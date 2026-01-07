# Arquitetura do Sistema

Esta seção apresenta a visualização técnica da infraestrutura e dos fluxos de dados utilizando Mermaid.js.

## Visão Geral de Componentes

```mermaid
graph LR
    %% Atores
    User((Usuário/Frontend))
    CronAgent((Cron/Schedule))

    %% Camada de API
    subgraph API_Gateway [API Gateway]
        AuthFuncs[Auth Endpoints]
        GroupFuncs[Groups Endpoints]
        PartFuncs[Participants Endpoints]
        DesigFuncs[Designations Endpoints]
    end

    %% Processamento Assíncrono
    subgraph Async_Layer [Processamento Assíncrono]
        DesigQueue{{DesignationQueue.fifo}}
        WhatsAppQueue{{WhatsAppMessageQueue}}
        UpdateDesigLambda[updateDesignation]
        WhatsAppLambda[whatsappMessageHandler]
    end

    %% Fluxos de Entrada
    User -- HTTP Request --> API_Gateway
    CronAgent -- Triggers --> transactionStatusDesignations[transactionStatusDesignations]

    %% Relacionamentos de Saída
    DesigFuncs -- produziu --> DesigQueue
    DesigQueue -- consome --> UpdateDesigLambda
    
    AuthFuncs -- envia código --> WhatsAppQueue
    DesigFuncs -- envia notificação --> WhatsAppQueue
    transactionStatusDesignations -- notifica --> WhatsAppQueue
    
    WhatsAppQueue -- consome --> WhatsAppLambda

    %% Armazenamento
    UpdateDesigLambda --> DB[(Prisma / Database)]
    AuthFuncs --> DB
    GroupFuncs --> DB
    PartFuncs --> DB
    DesigFuncs --> DB
    
    %% Saída Externa
    WhatsAppLambda -- envia --> WA_Provider((WhatsApp API))
```

## Fluxos Críticos

### 1. Atualização e Sincronização de Designação
Quando uma alteração é feita (ex: cancelamento ou troca de participante), o sistema garante a consistência através de uma fila FIFO.

```mermaid
sequenceDiagram
    participant U as Usuário
    participant L as create/cancelDesignation
    participant Q as DesignationQueue (FIFO)
    participant C as updateDesignation (Consumer)
    participant DB as Banco de Dados

    U->>L: Request (PATCH/POST)
    L->>DB: Atualiza estado inicial
    L->>Q: Envia mensagem de sincronização
    Q->>C: Gatilha Função
    C->>DB: Consolida alterações e recalcula tempos
```

### 2. Notificações WhatsApp (Cadência Humana)
O sistema utiliza uma fila para garantir que as mensagens não sejam enviadas todas de uma vez, simulando um comportamento humano de digitação para evitar bloqueios.

```mermaid
sequenceDiagram
    participant S as Serviços (Auth/Designation)
    participant D as SQSMessageDispatcher
    participant Q as WhatsAppMessageQueue
    participant H as whatsappMessageHandler
    participant WA as WhatsApp API

    S->>D: Solicita envio
    D->>D: Calcula Delay (Tamanho do Texto)
    D->>Q: Envia com DelaySeconds
    Note over Q: Aguarda Delay de Digitação
    Q->>H: Entrega mensagem
    H->>WA: Envia mensagem final
```
