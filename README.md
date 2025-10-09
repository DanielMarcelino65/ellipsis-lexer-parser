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

## Linguagem (subconjunto reconhecido)
- **Declarações**: `var | let | const`, atribuição opcional e `;` opcional
- **Funções**: `function nome(params) { ... }`
- **Controle de fluxo**: `if / else`, `while`, `do/while`, `for`
- **Expressões**: precedência de `||`, `&&`, igualdade, relacionais, `+ - * / %`,
  unários `! - +`, chamadas `f(x, y)`, agrupamento `( ... )`
- **Literais**: números, strings (`"..."` ou `'...'`), `true`, `false`, `null`

## O que apresentar na banca
1. **Lexemas, Classes e Tabela**: usar `pnpm lex examples/demo.acai`
2. **Expressões Regulares**: destacar regex de identificadores no topo da saída
3. **Cadeia de Tokens**: linha com `[Tipo:Lexema]`
4. **Gramática (GLC)**: exibida por `pnpm parse`
5. **Organização das Regras**: arquivo `src/parser.ts` (seção `CFG`)
6. **Reconhecimento de Recursos**: rodar `pnpm parse` para aceitar `if/else`, `while`, `do/while`, `for`, `function`
7. **Integração Léxico+Sintático**: `pnpm parse` mostra total de tokens e AST

## Estrutura
```
acai-lexer-parser/
├─ examples/
│  └─ demo.acai
├─ src/
│  ├─ lexer.ts        # Scanner/tokenizador
│  ├─ parser.ts       # Analisador sintático (descida recursiva) + CFG
│  ├─ cli-lex.ts      # CLI p/ visualizar tokens/tabelas
│  ├─ cli-parse.ts    # CLI p/ rodar parser e imprimir AST
│  └─ cli-demo.ts     # Roteiro de demo (lex + parse)
├─ package.json
├─ tsconfig.json
└─ README.md
```

---
**Observação:** Você pode adicionar novos exemplos em `examples/` e rodar:
```bash
pnpm lex examples/seuArquivo.acai
pnpm parse examples/seuArquivo.acai
```
