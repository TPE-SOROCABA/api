# Documento de Requisitos do Produto (PRD) - Admin TPE

## 1. Visão Geral
Este documento define as diretrizes visuais e especificações de design para o projeto Admin TPE, assegurando consistência na interface e experiência do usuário. O sistema segue o **TPE Digital Design System**.

## 2. Identidade Visual e Tema

### 🎨 Paleta de Cores

As cores foram definidas para garantir contraste, legibilidade e uma hierarquia visual clara.

| Categoria | Nome | Hex | Uso Recomendado |
|-----------|------|-----|-----------------|
| **Primária** | `tpe-primary` | `#374192` | Botões primários, cabeçalhos, ícones de ação, destaques. |
| **Secundária** | `tpe-secondary` | `#929BD2` | Botões secundários, bordas, ícones neutros. |
| **Gradiente** | `tpe-gradient` | `linear-gradient(90deg, #181C43 0%, #374192 100%)` | Hero sections, barras superiores, fundos de destaque. |
| **Interação** | `tpe-hover` | `#46607F` | Estado de hover para elementos primários. |
| **Fundo** | `bg-light` | `#FFFFFF` | Fundo geral da aplicação. |
| **Fundo Sec.** | `bg-medium` | `#F8F8F8` | Áreas internas, cards, blocos de conteúdo. |
| **Texto** | `text-dark` | `#333333` | Títulos e corpo principal. |
| **Texto Sec.** | `text-medium` | `#666666` | Legendas e textos de apoio. |
| **Texto Claro** | `text-light` | `#FFFFFF` | Textos sobre fundos escuros. |
| **Erro** | `tpe-error` | `#E74C3C` | Mensagens de erro, validações negativas, ações destrutivas. |
| **Sucesso** | `tpe-success` | `#2ECC71` | Mensagens de sucesso, confirmações. |
| **Aviso** | `tpe-warning` | `#F1C40F` | Alertas e atenção. |

### ✍️ Tipografia

A família tipográfica padrão é a **Inter**.

| Elemento | Peso | Tamanho | Line Height | Uso |
|----------|------|---------|-------------|-----|
| **H1** | SemiBold (600) | 24px | 1.2 | Títulos principais de páginas. |
| **H2** | SemiBold (600) | 20px | 1.3 | Subtítulos de seções. |
| **Body** | Regular (400) | 14px | 1.5 | Texto corrido padrão. |
| **Caption** | Regular (400) | 12px | 1.4 | Legendas, timestamps, metadados. |
| **Botão** | Medium (500) | 14px | 1.0 | Rótulos de botões e links. |

### 📏 Espaçamento e Grid (8-point Grid)

O sistema utiliza uma escala baseada em múltiplos de **4px** e **8px**.

- **Paddings & Margins Padrão:** `8px`, `16px`, `24px`, `32px`.
- **Border Radius:**
  - `sm`: 4px
  - `md`: 6px
  - `lg`: 8px (Padrão para cards e componentes maiores)
- **Breakpoints (Responsividade):**
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1400px

**Diretrizes Mobile:**
- Em telas < 640px, utilizar padding lateral mínimo de `8px` e vertical de `12px`.
- Evitar gutters desnecessários entre colunas.

## 3. Componentes de Interface (UI)

### Botões
- **Primário:** Fundo `#374192`, Texto Branco.
- **Secundário:** Fundo Branco, Borda `#929BD2`, Texto `#374192`.
- **Ghost:** Fundo Transparente, Texto `#374192`.
- **Hover:** Variação de cor `#46607F`.
- **Raio da Borda:** Usar variáveis globais de radius (geralmente `8px`).

### Cards
- Fundo branco (`#FFFFFF`) com sombra leve (`shadow-sm`).
- Estrutura recomendada: Header, Content, Footer.

### Tabelas e Listas
- Linhas com altura confortável.
- Cabeçalhos com texto secundário (`#666666`) ou primário suave.
- Ações alinhadas à direita.

### Modais
- Fundo overlay escuro com opacidade.
- Container centralizado com fundo branco.
- Título claro, corpo descritivo e ações no rodapé.

## 4. Stack Tecnológica (Frontend)

- **Estilização:** Tailwind CSS (CDN)