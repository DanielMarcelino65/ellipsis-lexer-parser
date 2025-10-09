// src/cli-lex.ts
import { Lexer, IDENTIFIER_REGEX } from './lexer.js';
import fs from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('Usage: pnpm lex <file>'); process.exit(1);
}
const src = fs.readFileSync(path, 'utf-8');
const lexer = new Lexer(src);
const tokens = lexer.tokenize();

// Table of lexemes & classes
type Row = { idx:number, lexeme:string, class:string, line:number, column:number };
const rows: Row[] = tokens.map((t, i) => ({
  idx: i,
  lexeme: t.lexeme,
  class: t.type,
  line: t.line,
  column: t.column
}));

// Display
console.log('=== EXPRESSÕES REGULARES ===');
console.log('- Identificador:', IDENTIFIER_REGEX.toString());
console.log();
console.log('=== TABELA DE LEXEMAS / TOKENS ===');
console.table(rows);
console.log();
console.log('=== CADEIA DE TOKENS ===');
console.log(tokens.map(t => `[${t.type}:${t.lexeme}]`).join(' '));
