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
import type { LL1Step } from './LL1parser'; // <- exporta esse tipo lá

function printUsage() {
  const prog = path.basename(process.argv[1] || 'll1-cli');
  console.log(`
Uso:
  pnpm ll1 <arquivo> [opções]

Opções:
  --tokens      Imprime a lista de tokens gerados pelo analisador léxico
  --first       Imprime os conjuntos FIRST da gramática
  --follow      Imprime os conjuntos FOLLOW da gramática
  --table       Imprime um resumo da Tabela LL(1)
  --trace       Imprime o passo a passo da pilha (tabela de MATCH do LL(1))
  -h, --help    Mostra esta mensagem de ajuda

Exemplos:
  pnpm ll1 exemplos/test.ellipsis --tokens --first --follow
  pnpm ll1 exemplos/test.ellipsis --table
  pnpm ll1 exemplos/test.ellipsis --trace
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
      showTrace: false,
    };
  }

  // primeiro argumento não começando com "-" é o arquivo
  const filePath = args.find((a) => !a.startsWith('-')) || null;

  const showTokens = args.includes('--tokens');
  const showFirst = args.includes('--first');
  const showFollow = args.includes('--follow');
  const showTable = args.includes('--table');
  const showTrace = args.includes('--trace');

  return {
    showHelp: false,
    filePath,
    showTokens,
    showFirst,
    showFollow,
    showTable,
    showTrace,
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

// impressão do passo a passo do LL(1)
function printTrace(trace: LL1Step[]) {
  if (!trace || trace.length === 0) {
    console.log('\n===== TRAÇO LL(1) =====');
    console.log('(nenhum passo registrado)');
    return;
  }

  console.log('\n===== TRAÇO LL(1) (tabela de MATCH) =====');
  console.log(
    'passo | pilha (fundo -> topo)                | lookahead        | ação        | produção'
  );
  console.log(
    '------+--------------------------------------+------------------+-------------+--------------------------------'
  );

  for (const s of trace) {
    const stackStr = `[${s.stack.join(' ')}]`;
    const look = `${s.lookahead.type}:${s.lookahead.lexeme}`
      .slice(0, 16)
      .padEnd(16, ' ');
    const actionLabel = s.action.padEnd(11, ' ');
    const prodStr = s.production
      ? `${s.production.head} -> ${s.production.body.join(' ')}`
      : '';

    console.log(
      `${String(s.step).padEnd(5, ' ')} | ${stackStr.padEnd(
        38,
        ' '
      )} | ${look} | ${actionLabel} | ${prodStr}`
    );
  }
  console.log();
}

function main() {
  const {
    showHelp,
    filePath,
    showTokens,
    showFirst,
    showFollow,
    showTable,
    showTrace,
  } = parseArgs();

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
    // agora runLL1 aceita opção { trace }
    const { tokens, first, follow, table, trace } = runLL1(source, {
      trace: showTrace,
    });

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
    if (showTrace) {
      printTrace(trace);
    }
  } catch (err) {
    console.error('Erro durante análise LL(1):');
    console.error(String(err));
    process.exit(1);
  }
}

main();
