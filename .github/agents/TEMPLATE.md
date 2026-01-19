# 🏗️ Template para Criar Novos Custom Agents

Use este template como base para criar novos agents que seguem o padrão oficial do GitHub Copilot.

## Checklist Antes de Começar

- [ ] Tenho um propósito claro para o agent
- [ ] Existem diretrizes/padrões que o agent deve seguir
- [ ] Posso manter instruções sob 30.000 caracteres
- [ ] Tenho exemplos de como o agent deve responder

---

## Template Base

```markdown
---
name: agent-short-descriptive-name
description: One-line description of what this agent does and its capabilities
tools: ["read", "edit", "search"]
target: vscode
---

# [Full Agent Name] Agent

[Opening paragraph explaining what this agent does and why it matters]

## Core Objectives

1. **[Objective 1]:** [Description of what it achieves]
2. **[Objective 2]:** [Description of what it achieves]
3. **[Objective 3]:** [Description of what it achieves]

## Key Concepts

### Concept 1
[Detailed explanation with examples if needed]

### Concept 2
[Detailed explanation]

## Workflow / Process

[Step-by-step process for common use cases]

## Best Practices

### Do's ✅
- [What to do]
- [What to do]

### Don'ts ❌
- [What not to do]
- [What not to do]

## Your Role

[Specific instructions about what the agent should focus on]

---

**Reference Links:** [Links to documentation if applicable]
```

---

## Exemplo Completo Comentado

```markdown
---
name: code-reviewer
description: Reviews code for quality, performance, security, and maintainability. Provides constructive feedback aligned with team standards without rewriting code.
tools: ["read", "search"]
model: claude-haiku-4.5
target: vscode
---

# Code Review Agent

[Explicação do propósito]

## Core Objectives

1. **Quality Assessment** - Avaliar qualidade geral
2. **Best Practices** - Verificar alinhamento com standards
3. **Performance Analysis** - Identificar gargalos
4. **Security Review** - Detectar vulnerabilidades

## Key Concepts

### Code Quality Dimensions

- **Readability:** Código entendível
- **Maintainability:** Fácil de modificar
- **Performance:** Eficiência de execução
- **Security:** Sem vulnerabilidades

## Review Workflow

### 1. Discovery Phase
- Ler código submetido
- Entender contexto e propósito
- Identificar padrões existentes

### 2. Analysis Phase
- Verificar qualidade
- Buscar anti-patterns
- Checar segurança

### 3. Feedback Phase
- Apresentar pontos de melhoria
- Sugerir alternativas
- Priorizar por impacto

## Best Practices

### Do's ✅
- Use exemplos de código que já existe
- Seja respeitoso nas críticas
- Explique o porquê das sugestões
- Reconheça o bom código

### Don'ts ❌
- Não reescreva todo o código
- Não seja condescendente
- Não ignore bom trabalho
- Não sugira apenas por sugerir

## Your Role

Quando solicitado para revisar código:
1. Leia o código cuidadosamente
2. Identifique padrões do projeto
3. Aponte melhorias concretas
4. Sugira soluções alternativas
5. Reconheça os pontos fortes
```

---

## Guia de Propriedades YAML

### `name` (obrigatório)
```yaml
name: agent-short-name
# Apenas: . - _ a-z A-Z 0-9
# Não: espaços, caracteres especiais
# Exemplo: test-specialist, code-reviewer, visual-documentation
```

### `description` (obrigatório)
```yaml
description: One-line description of what agent does and capabilities
# Máximo ~100 caracteres (aparece na UI)
# Seja específico e descritivo
```

### `tools` (recomendado)
```yaml
tools: ["read", "edit", "search"]
# Ferramentas disponíveis para o agent
# Opções: read, edit, search, create, delete, etc.
# Se omitido, agent tem acesso a TODAS
```

### `model` (recomendado para IDEs)
```yaml
model: claude-haiku-4.5
# Define qual modelo IA o agent usa
# Útil em VS Code, JetBrains, Eclipse, Xcode
```

### `target` (opcional)
```yaml
target: vscode
# Valores: vscode, github-copilot
# Se omitido, funciona em ambos
```

### `mcp-servers` (apenas org/enterprise)
```yaml
mcp-servers:
  - name: server-name
    config: ...
# Apenas para agents org/enterprise level
```

---

## Estrutura de Conteúdo Recomendada

```
1. Introdução (1-2 parágrafos)
   └─ O que o agent faz
   └─ Por que importa

2. Objetivos Principais (3-5)
   └─ Cada um com descrição clara

3. Conceitos Chave (2-4 seções)
   └─ Explicações detalhadas
   └─ Exemplos se necessário

4. Workflow/Processo
   └─ Passo a passo
   └─ Para casos comuns

5. Best Practices
   └─ Do's (✅)
   └─ Don'ts (❌)

6. Seu Papel
   └─ Instruções específicas
   └─ Foco do agent
   └─ Como abordá-lo
```

---

## Checklist para Novo Agent

Antes de criar um novo agent:

- [ ] **Propósito Claro:** Tenho um propósito bem definido
- [ ] **Guidelines Existentes:** Tenho padrões/diretrizes para o agent seguir
- [ ] **Diferenciação:** É diferente dos agents existentes
- [ ] **Tamanho:** Instruções < 30.000 caracteres
- [ ] **Exemplos:** Tenho exemplos de como responder
- [ ] **Testeabilidade:** Posso testar o agent rapidamente
- [ ] **Documentação:** Documento está pronto

---

## Validação de Arquivo

### YAML válido
```bash
# Usar YAML validator online
# ou verificar manualmente:
# - Colons após propriedades
# - Indentação correta
# - Fechamento de ---
```

### Conteúdo
```
- [ ] Introdução clara
- [ ] Objetivos bem definidos
- [ ] Exemplos de código/workflow
- [ ] Best practices documentadas
- [ ] Instruções claras sobre papel
- [ ] Links/referências (se aplicável)
```

### Nomeação de Arquivo
```
correct-name.agent.md      ✅
wrong_name.agent.md        ✅ (mas menos legível)
WrongName.agent.md         ❌ (maiúsculas)
wrong name.agent.md        ❌ (espaço)
wrong-name.md              ❌ (falta .agent)
```

---

## Onde Colocar o Arquivo

### Para Workspace-level (recomendado para times)
```
.github/agents/
└── your-agent.agent.md
```

### Para User Profile (pessoal)
```
~/.config/Copilot/agents/  (Linux)
~/Library/Copilot/agents/  (macOS)
%APPDATA%\Copilot\agents\  (Windows)
```

### Para Organization/Enterprise
```
.github-private/agents/
└── your-agent.agent.md
```

---

## Exemplos de Nomes

### ✅ Bons Nomes
```
- test-specialist
- readme-writer
- code-reviewer
- architecture
- prd-specialist
- performance-analyzer
- security-auditor
- documentation-assistant
```

### ❌ Nomes Ruins
```
- TestSpecialist       (maiúscula)
- test specialist      (espaço)
- test_specialist      (underscore é OK, mas dash é melhor)
- ts                   (muito vago)
- my-agent            (não descritivo)
```

---

## Template Mínimo (Quick Start)

Se você quer criar algo rápido:

```markdown
---
name: my-specialist
description: Short, clear description of what this agent does
tools: ["read", "edit", "search"]
model: claude-haiku-4.5
target: vscode
---

# My Specialist Agent

## Core Objectives
1. **Objective 1:** Description
2. **Objective 2:** Description

## Your Role

When asked to [task description]:
- Do this
- Then do that
- Finally do this

Focus on [area of expertise].
```

---

## Recursos Úteis

### Documentação Oficial
- **Create Custom Agents:** https://docs.github.com/pt/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents
- **Custom Agents Configuration:** https://docs.github.com/en/copilot/reference/custom-agents-configuration
- **VS Code Custom Agents:** https://code.visualstudio.com/docs/copilot/customization/custom-agents

### Exemplos
- **GitHub Awesome Copilot:** https://github.com/github/awesome-copilot/tree/main/agents
- **Este Repositório:** `.github/agents/`

### Validadores
- **YAML Validator:** https://www.yamllint.com/
- **Markdown Validator:** https://www.markdownlint.com/

---

## Dúvidas Comuns

### Q: Posso ter mais de 30.000 caracteres?
**A:** Não. Se precisar, divida em múltiplos agents ou separe em documentação externa.

### Q: Como actualizar um agent?
**A:** Edit o `.agent.md` file e salve. VS Code sincroniza automaticamente.

### Q: Posso remover um agent?
**A:** Sim, delete o arquivo. Deixará de aparecer no dropdown.

### Q: Agents podem chamar outros agents?
**A:** Indiretamente através de instruções, mas não há integração nativa.

### Q: Qual modelo IA usar?
**A:** `claude-haiku-4.5` para a maioria. Specs específicas podem usar versões diferentes.

---

**Template versão:** 1.0
**Última atualização:** Janeiro 2026
**Status:** Ready to use
