# Acai Lexer + Parser (Subset)

Projeto minimalista focado **apenas** na parte de **Análise Léxica e Sintática**,
pronto para apresentar na disciplina de Compiladores. Foi reduzido para não incluir
interpretador/compilador completo — somente **lexer** e **parser** integrados.

## Requisitos

- Node 18+
- pnpm (`npm i -g pnpm`)

## Instalação

```bash
pnpm install
```

## Rodar (Léxico)

Gera tabela de lexemas/tokens, classes e cadeia de tokens:

```bash
pnpm lex examples/demo.acai
```

Saída esperada:

- **Expressões Regulares**: identificador (`^[A-Za-z_][A-Za-z0-9_]*$`)
- **Tabela de Lexemas/Tokens** (com `console.table`)
- **Cadeia de Tokens** linear

## Rodar (Sintático)

Mostra a **gramática livre de contexto (subconjunto)**, confirma a integração
(tokens -> parser) e imprime um **AST resumido**:

```bash
pnpm parse examples/demo.acai
```

## Demo completa

```bash
pnpm demo
```
