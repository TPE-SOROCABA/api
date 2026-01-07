# Dicionário de Arquitetura (ARCH_DICT)

Este documento descreve os recursos técnicos do projeto, suas finalidades e como são ativados.

## Autenticação (Auth)

| Recurso | Tipo | Finalidade | Gatilho |
| :--- | :--- | :--- | :--- |
| `login` | Lambda | Realiza o login inicial do usuário | HTTP POST `/auth/login` |
| `loginCode` | Lambda | Login do usuário utilizando um código de acesso | HTTP POST `/auth/login-code` |
| `recoverPassword` | Lambda | Inicia o fluxo de recuperação de senha e envia código via WhatsApp | HTTP POST `/auth/recover-password` |
| `resetPassword` | Lambda | Redefine a senha do usuário após validação | HTTP POST `/auth/reset-password` |
| `check-authorizer` | Lambda | Custom Authorizer para validar tokens JWT nas rotas protegidas | Interno (API Gateway) |

## Infraestrutura e Global (Infra)

| Recurso | Tipo | Finalidade | Gatilho |
| :--- | :--- | :--- | :--- |
| `healthcheck` | Lambda | Verifica a saúde da API | HTTP GET `/healthcheck` |
| `transactionStatusDesignations` | Lambda | Cron job para atualizar status de designações periodicamente | Cron (vários horários) |
| `whatsappMessageHandler` | Lambda | Consome mensagens da fila e envia via WhatsApp com cadência humana | SQS (`WhatsAppMessageQueue`) |
| `testSqsWhatsapp` | Lambda | Endpoint para testar o envio de mensagens para a fila SQS | HTTP POST `/test/sqs-whatsapp` |
| `DesignationQueue` | SQS | Fila FIFO para processamento sequencial de atualizações de designação | `SendUpdateDesignation` (vários) |
| `WhatsAppMessageQueue` | SQS | Fila para mensagens de saída do WhatsApp | `SQSMessageDispatcher` (vários) |
| `WhatsAppMessageQueueDLQ` | SQS | Fila de mensagens mortas para erros no envio de WhatsApp | Sistema |

## Grupos (Groups)

| Recurso | Tipo | Finalidade | Gatilho |
| :--- | :--- | :--- | :--- |
| `listWeekDesignations` | Lambda | Lista designações da semana para um grupo | HTTP GET `/groups/{groupId}/designations/week` |
| `groupByIdWeekDesignation` | Lambda | Detalhes semanais de um grupo específico | HTTP GET `/groups/{groupId}/designations/week-details` |
| `listDesignationsByGroupId` | Lambda | Lista todas as designações associadas a um grupo | HTTP GET `/groups/{groupId}/designations` |

## Participantes (Participants)

| Recurso | Tipo | Finalidade | Gatilho |
| :--- | :--- | :--- | :--- |
| `listParticipants` | Lambda | Lista todos os participantes cadastrados | HTTP GET `/participants` |
| `createIncidences` | Lambda | Registra uma nova incidência para um participante | HTTP POST `/designations/{designationId}/participants/{participantId}/incidences` |
| `updateIncidences` | Lambda | Atualiza dados de uma incidência existente | HTTP PUT `/designations/{designationId}/participants/{participantId}/incidences/{incidentId}` |
| `deleteIncidences` | Lambda | Remove uma incidência do registro | HTTP DELETE `/designations/{designationId}/participants/{participantId}/incidences/{incidentId}` |

## Designações (Designations)

| Recurso | Tipo | Finalidade | Gatilho |
| :--- | :--- | :--- | :--- |
| `createDesignation` | Lambda | Cria uma nova entrada de designação | HTTP POST `/designations` |
| `sendDesignation` | Lambda | Inicia o processo de envio de uma designação | HTTP POST `/designations/{designationId}/send` |
| `cancelDesignation` | Lambda | Cancela uma designação existente | HTTP PATCH `/designations/{designationId}/cancel` |
| `updatePointDesignation` | Lambda | Atualiza informações de um ponto na designação | HTTP PATCH `/designations/{designationId}/points/{pointId}` |
| `updateParticipantsPointDesignation` | Lambda | Atualiza os participantes vinculados a um ponto | HTTP PUT `/designations/{designationId}/points/{pointId}/participants` |
| `designationsById` | Lambda | Busca detalhes de uma designação por ID | HTTP GET `/designations/{designationId}` |
| `designationsByIdParticipants` | Lambda | Lista participantes de uma designação específica | HTTP GET `/designations/{designationId}/participants` |
| `weekParticipantDesignations` | Lambda | Lista designações da semana para um participante específico | HTTP GET `/designations/{designationId}/participants/{participantId}` |
| `updateDesignation` | Lambda | Processa atualizações de designação de forma assíncrona | SQS (`DesignationQueue`) |

## Outros Componentes

| Recurso | Tipo | Finalidade | Gatilho |
| :--- | :--- | :--- | :--- |
| `uploadPhoto` | Lambda | Realiza o upload da foto de perfil do participante | HTTP POST `/participants/{participantId}/photo` |
| `Z_API / WhatsApp` | API Externa | Serviço terceiro para envio real das mensagens de WhatsApp | `whatsappMessageHandler` |
| `S3 (participants-photo)` | Bucket S3 | Armazenamento de fotos de perfil dos participantes | `uploadPhoto` |
| `Prisma / RDS` | Banco de Dados | Camada de persistência (PostgreSQL) para todo o sistema | Diversas Lambdas |
