// src/ll1-cli.ts
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  runLL1,
  printFirstSets,
  printFollowSets,
  printParseTable,
} from './LL1parser';

// Se quiser tipar tokens bonitinho:
import type { Token } from './lexer.js';

function printUsage() {
  const prog = path.basename(process.argv[1] || 'll1-cli');
  console.log(`
Uso:
  pnpm tsx src/ll1-cli.ts <arquivo> [opções]

Opções:
  --tokens      Imprime a lista de tokens gerados pelo analisador léxico
  --first       Imprime os conjuntos FIRST da gramática
  --follow      Imprime os conjuntos FOLLOW da gramática
  --table       Imprime um resumo da Tabela LL(1)
  -h, --help    Mostra esta mensagem de ajuda

Exemplos:
  pnpm ll1 exemplos/test.ellipsis --tokens --first --follow
  pnpm ll1 exemplos/test.ellipsis --table
`);
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    return {
      showHelp: true,
      filePath: null as string | null,
      showTokens: false,
      showFirst: false,
      showFollow: false,
      showTable: false,
    };
  }

  // primeiro argumento não começando com "-" é o arquivo
  const filePath = args.find((a) => !a.startsWith('-')) || null;

  const showTokens = args.includes('--tokens');
  const showFirst = args.includes('--first');
  const showFollow = args.includes('--follow');
  const showTable = args.includes('--table');

  return {
    showHelp: false,
    filePath,
    showTokens,
    showFirst,
    showFollow,
    showTable,
  };
}

function printTokens(tokens: Token[]) {
  console.log('===== TOKENS =====');
  for (const t of tokens) {
    const pos = `${t.line}:${t.column}`.padEnd(7);
    const type = t.type.padEnd(10);
    console.log(`${pos} ${type} '${t.lexeme}'`);
  }
  console.log();
}

function main() {
  const { showHelp, filePath, showTokens, showFirst, showFollow, showTable } =
    parseArgs();

  if (showHelp || !filePath) {
    printUsage();
    process.exit(showHelp ? 0 : 1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Erro: arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf8');

  try {
    const { tokens, first, follow, table } = runLL1(source);

    console.log(`Arquivo: ${filePath}`);
    console.log('Resultado: Programa aceito pelo analisador LL(1).');
    console.log();

    if (showTokens) {
      printTokens(tokens);
    }
    if (showFirst) {
      printFirstSets(first);
    }
    if (showFollow) {
      printFollowSets(follow);
    }
    if (showTable) {
      printParseTable(table);
    }
  } catch (err) {
    console.error('Erro durante análise LL(1):');
    console.error(String(err));
    process.exit(1);
  }
}

main();
