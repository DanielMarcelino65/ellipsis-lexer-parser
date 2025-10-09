// src/cli-parse.ts
import fs from 'node:fs';
import { parse, CFG } from './parser.js';

const path = process.argv[2];
if (!path) {
  console.error('Usage: pnpm parse <file>'); process.exit(1);
}
const src = fs.readFileSync(path, 'utf-8');
try {
  const { tokens, ast } = parse(src);
  console.log('=== GRAMÁTICA LIVRE DE CONTEXTO (SUBCONJUNTO) ===');
  console.log(CFG);
  console.log('=== INTEGRAÇÃO LÉXICO + SINTÁTICO ===');
  console.log('- Total de tokens gerados pelo Lexer:', tokens.length);
  console.log('- Parser consumiu todos os tokens até EOF sem erro.');
  console.log();
  console.log('=== AST (RESUMO) ===');
  console.log(JSON.stringify(ast, null, 2));
} catch (e:any) {
  console.error('Erro de análise sintática:', e.message);
  process.exit(2);
}
