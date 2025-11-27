// src/ll1Parser.ts
import { Lexer, Token } from './lexer.js';

// ========================
// Tipos básicos LL(1)
// ========================

const EPSILON = 'ε';

type NonTerminal = string;
type Terminal = string;
type SymbolName = string;

interface Production {
  head: NonTerminal;
  body: SymbolName[]; // ex: ["StmtList", "Stmt"]
}

// ========================
// Gramática LL(1) para o núcleo do Ellipsis
// ========================
//
// Program      -> StmtList $
// StmtList     -> Stmt StmtList | ε
// Stmt         -> VarDecl | RecipeDecl | IfStmt | WhileStmt | ReturnStmt | Block | ExprStmt
// VarDecl      -> VarKw ID VarInitOpt SEMICOLON
// VarKw        -> KW_put | KW_take
// VarInitOpt   -> OP_ASSIGN Expr | ε
// RecipeDecl   -> KW_recipe ID LPAREN ParamListOpt RPAREN Block
// ParamListOpt -> ParamList | ε
// ParamList    -> ID ParamListTail
// ParamListTail-> COMMA ID ParamListTail | ε
// IfStmt       -> KW_if LPAREN Expr RPAREN Stmt IfElseOpt
// IfElseOpt    -> KW_else Stmt | ε
// WhileStmt    -> KW_meanwhile LPAREN Expr RPAREN Stmt
// ReturnStmt   -> KW_return ExprOpt SEMICOLON
// ExprOpt      -> Expr | ε
// Block        -> LBRACE StmtList RBRACE
// ExprStmt     -> Expr SEMICOLON
//
// Expr         -> OrExpr
// OrExpr       -> AndExpr OrExprTail
// OrExprTail   -> OP_OR AndExpr OrExprTail | ε
// AndExpr      -> EqualityExpr AndExprTail
// AndExprTail  -> OP_AND EqualityExpr AndExprTail | ε
// EqualityExpr -> RelExpr EqualityExprTail
// EqualityExprTail -> (OP_EQ | OP_NE) RelExpr EqualityExprTail | ε
// RelExpr      -> AddExpr RelExprTail
// RelExprTail  -> (OP_LT | OP_LE | OP_GT | OP_GE) AddExpr RelExprTail | ε
// AddExpr      -> MulExpr AddExprTail
// AddExprTail  -> (OP_PLUS | OP_MINUS) MulExpr AddExprTail | ε
// MulExpr      -> UnaryExpr MulExprTail
// MulExprTail  -> (OP_STAR | OP_SLASH | OP_PERCENT) UnaryExpr MulExprTail | ε
// UnaryExpr    -> (OP_NOT | OP_PLUS | OP_MINUS) UnaryExpr | Primary
// Primary      -> NUMBER | STRING | KW_true | KW_false | KW_empty
//               | ID CallTail
//               | LPAREN Expr RPAREN
// CallTail     -> LPAREN ArgListOpt RPAREN | ε
// ArgListOpt   -> ArgList | ε
// ArgList      -> Expr ArgListTail
// ArgListTail  -> COMMA Expr ArgListTail | ε
//
// Terminais são nomes abstratos, mapeados a partir dos tokens do Lexer.

export const NON_TERMINALS: NonTerminal[] = [
  'Program',
  'StmtList',
  'Stmt',
  'VarDecl',
  'VarKw',
  'VarInitOpt',
  'RecipeDecl',
  'ParamListOpt',
  'ParamList',
  'ParamListTail',
  'IfStmt',
  'IfElseOpt',
  'WhileStmt',
  'ReturnStmt',
  'ExprOpt',
  'Block',
  'AssignStmt',
  'Expr',
  'OrExpr',
  'OrExprTail',
  'AndExpr',
  'AndExprTail',
  'EqualityExpr',
  'EqualityExprTail',
  'RelExpr',
  'RelExprTail',
  'AddExpr',
  'AddExprTail',
  'MulExpr',
  'MulExprTail',
  'UnaryExpr',
  'Primary',
  'CallTail',
  'ArgListOpt',
  'ArgList',
  'ArgListTail',
];

export const TERMINALS: Terminal[] = [
  'KW_put',
  'KW_take',
  'KW_recipe',
  'KW_if',
  'KW_else',
  'KW_meanwhile',
  'KW_return',
  'KW_true',
  'KW_false',
  'KW_empty',

  'ID',
  'NUMBER',
  'STRING',

  'LBRACE',
  'RBRACE',
  'LPAREN',
  'RPAREN',
  'SEMICOLON',
  'COMMA',

  'OP_ASSIGN',
  'OP_OR',
  'OP_AND',
  'OP_EQ',
  'OP_NE',
  'OP_LT',
  'OP_LE',
  'OP_GT',
  'OP_GE',
  'OP_PLUS',
  'OP_MINUS',
  'OP_STAR',
  'OP_SLASH',
  'OP_PERCENT',
  'OP_NOT',

  '$', // fim de entrada (EOF)
];

export const START_SYMBOL: NonTerminal = 'Program';

export const PRODUCTIONS: Production[] = [
  { head: 'Program', body: ['StmtList', '$'] },

  { head: 'StmtList', body: ['Stmt', 'StmtList'] },
  { head: 'StmtList', body: [EPSILON] },

  { head: 'Stmt', body: ['VarDecl'] },
  { head: 'Stmt', body: ['RecipeDecl'] },
  { head: 'Stmt', body: ['IfStmt'] },
  { head: 'Stmt', body: ['WhileStmt'] },
  { head: 'Stmt', body: ['ReturnStmt'] },
  { head: 'Stmt', body: ['Block'] },
  { head: 'Stmt', body: ['AssignStmt'] },

  { head: 'VarDecl', body: ['VarKw', 'ID', 'VarInitOpt', 'SEMICOLON'] },

  { head: 'VarKw', body: ['KW_put'] },
  { head: 'VarKw', body: ['KW_take'] },

  { head: 'VarInitOpt', body: ['OP_ASSIGN', 'Expr'] },
  { head: 'VarInitOpt', body: [EPSILON] },

  { head: 'AssignStmt', body: ['ID', 'OP_ASSIGN', 'Expr', 'SEMICOLON'] },

  {
    head: 'RecipeDecl',
    body: ['KW_recipe', 'ID', 'LPAREN', 'ParamListOpt', 'RPAREN', 'Block'],
  },

  { head: 'ParamListOpt', body: ['ParamList'] },
  { head: 'ParamListOpt', body: [EPSILON] },

  { head: 'ParamList', body: ['ID', 'ParamListTail'] },

  { head: 'ParamListTail', body: ['COMMA', 'ID', 'ParamListTail'] },
  { head: 'ParamListTail', body: [EPSILON] },

  {
    head: 'IfStmt',
    body: ['KW_if', 'LPAREN', 'Expr', 'RPAREN', 'Stmt', 'IfElseOpt'],
  },

  { head: 'IfElseOpt', body: ['KW_else', 'Stmt'] },
  { head: 'IfElseOpt', body: [EPSILON] },

  {
    head: 'WhileStmt',
    body: ['KW_meanwhile', 'LPAREN', 'Expr', 'RPAREN', 'Stmt'],
  },

  { head: 'ReturnStmt', body: ['KW_return', 'ExprOpt', 'SEMICOLON'] },

  { head: 'ExprOpt', body: ['Expr'] },
  { head: 'ExprOpt', body: [EPSILON] },

  { head: 'Block', body: ['LBRACE', 'StmtList', 'RBRACE'] },

  { head: 'Expr', body: ['OrExpr'] },

  { head: 'OrExpr', body: ['AndExpr', 'OrExprTail'] },

  { head: 'OrExprTail', body: ['OP_OR', 'AndExpr', 'OrExprTail'] },
  { head: 'OrExprTail', body: [EPSILON] },

  { head: 'AndExpr', body: ['EqualityExpr', 'AndExprTail'] },

  { head: 'AndExprTail', body: ['OP_AND', 'EqualityExpr', 'AndExprTail'] },
  { head: 'AndExprTail', body: [EPSILON] },

  { head: 'EqualityExpr', body: ['RelExpr', 'EqualityExprTail'] },

  {
    head: 'EqualityExprTail',
    body: ['OP_EQ', 'RelExpr', 'EqualityExprTail'],
  },
  {
    head: 'EqualityExprTail',
    body: ['OP_NE', 'RelExpr', 'EqualityExprTail'],
  },
  { head: 'EqualityExprTail', body: [EPSILON] },

  { head: 'RelExpr', body: ['AddExpr', 'RelExprTail'] },

  {
    head: 'RelExprTail',
    body: ['OP_LT', 'AddExpr', 'RelExprTail'],
  },
  {
    head: 'RelExprTail',
    body: ['OP_LE', 'AddExpr', 'RelExprTail'],
  },
  {
    head: 'RelExprTail',
    body: ['OP_GT', 'AddExpr', 'RelExprTail'],
  },
  {
    head: 'RelExprTail',
    body: ['OP_GE', 'AddExpr', 'RelExprTail'],
  },
  { head: 'RelExprTail', body: [EPSILON] },

  { head: 'AddExpr', body: ['MulExpr', 'AddExprTail'] },

  {
    head: 'AddExprTail',
    body: ['OP_PLUS', 'MulExpr', 'AddExprTail'],
  },
  {
    head: 'AddExprTail',
    body: ['OP_MINUS', 'MulExpr', 'AddExprTail'],
  },
  { head: 'AddExprTail', body: [EPSILON] },

  { head: 'MulExpr', body: ['UnaryExpr', 'MulExprTail'] },

  {
    head: 'MulExprTail',
    body: ['OP_STAR', 'UnaryExpr', 'MulExprTail'],
  },
  {
    head: 'MulExprTail',
    body: ['OP_SLASH', 'UnaryExpr', 'MulExprTail'],
  },
  {
    head: 'MulExprTail',
    body: ['OP_PERCENT', 'UnaryExpr', 'MulExprTail'],
  },
  { head: 'MulExprTail', body: [EPSILON] },

  {
    head: 'UnaryExpr',
    body: ['OP_NOT', 'UnaryExpr'],
  },
  {
    head: 'UnaryExpr',
    body: ['OP_PLUS', 'UnaryExpr'],
  },
  {
    head: 'UnaryExpr',
    body: ['OP_MINUS', 'UnaryExpr'],
  },
  {
    head: 'UnaryExpr',
    body: ['Primary'],
  },

  {
    head: 'Primary',
    body: ['NUMBER'],
  },
  {
    head: 'Primary',
    body: ['STRING'],
  },
  {
    head: 'Primary',
    body: ['KW_true'],
  },
  {
    head: 'Primary',
    body: ['KW_false'],
  },
  {
    head: 'Primary',
    body: ['KW_empty'],
  },
  {
    head: 'Primary',
    body: ['ID', 'CallTail'],
  },
  {
    head: 'Primary',
    body: ['LPAREN', 'Expr', 'RPAREN'],
  },

  {
    head: 'CallTail',
    body: ['LPAREN', 'ArgListOpt', 'RPAREN'],
  },
  {
    head: 'CallTail',
    body: [EPSILON],
  },

  {
    head: 'ArgListOpt',
    body: ['ArgList'],
  },
  {
    head: 'ArgListOpt',
    body: [EPSILON],
  },

  {
    head: 'ArgList',
    body: ['Expr', 'ArgListTail'],
  },

  {
    head: 'ArgListTail',
    body: ['COMMA', 'Expr', 'ArgListTail'],
  },
  {
    head: 'ArgListTail',
    body: [EPSILON],
  },
];

// ========================
// Helpers de erro (compatíveis com Parser.ts)
// ========================

function fmtWhere(t: Token) {
  return `${t.line}:${t.column}`;
}

function syntaxError(t: Token, message: string): never {
  throw new Error(`Syntax error at ${fmtWhere(t)}: ${message}.`);
}

// ========================
// Cálculo de FIRST e FOLLOW
// ========================

type FirstSet = Map<SymbolName, Set<Terminal | typeof EPSILON>>;
type FollowSet = Map<NonTerminal, Set<Terminal>>;

function computeFirstSets(): FirstSet {
  const first: FirstSet = new Map();

  // FIRST de terminais
  for (const t of TERMINALS) {
    first.set(t, new Set([t]));
  }
  // FIRST(ε) = {ε}
  first.set(EPSILON, new Set([EPSILON]));

  // FIRST de não-terminais inicialmente vazio
  for (const nt of NON_TERMINALS) {
    if (!first.has(nt)) first.set(nt, new Set());
  }

  let changed = true;
  while (changed) {
    changed = false;

    for (const { head, body } of PRODUCTIONS) {
      const firstHead = first.get(head)!;

      let canDeriveEpsilon = true;

      for (const symbol of body) {
        const firstSymbol =
          first.get(symbol) || new Set<Terminal | typeof EPSILON>();

        // adiciona FIRST(symbol) \ {ε} em FIRST(head)
        for (const tok of firstSymbol) {
          if (tok === EPSILON) continue;
          if (!firstHead.has(tok)) {
            firstHead.add(tok);
            changed = true;
          }
        }

        if (!firstSymbol.has(EPSILON)) {
          canDeriveEpsilon = false;
          break;
        }
      }

      if (canDeriveEpsilon) {
        if (!firstHead.has(EPSILON)) {
          firstHead.add(EPSILON);
          changed = true;
        }
      }
    }
  }

  return first;
}

function computeFollowSets(first: FirstSet): FollowSet {
  const follow: FollowSet = new Map();

  for (const nt of NON_TERMINALS) {
    follow.set(nt, new Set());
  }

  // $ ∈ FOLLOW(START_SYMBOL)
  follow.get(START_SYMBOL)!.add('$');

  let changed = true;
  while (changed) {
    changed = false;

    for (const { head, body } of PRODUCTIONS) {
      for (let i = 0; i < body.length; i++) {
        const B = body[i];
        if (!NON_TERMINALS.includes(B)) continue;

        const followB = follow.get(B)!;

        // β = body[i+1..]
        let canBetaDeriveEpsilon = true;

        for (let j = i + 1; j < body.length; j++) {
          const symbol = body[j];
          const firstSymbol =
            first.get(symbol) || new Set<Terminal | typeof EPSILON>();

          // FIRST(symbol) \ {ε} ⊆ FOLLOW(B)
          for (const tok of firstSymbol) {
            if (tok === EPSILON) continue;
            if (!followB.has(tok)) {
              followB.add(tok);
              changed = true;
            }
          }

          if (!firstSymbol.has(EPSILON)) {
            canBetaDeriveEpsilon = false;
            break;
          }
        }

        // se β ⇒* ε, FOLLOW(head) ⊆ FOLLOW(B)
        if (canBetaDeriveEpsilon) {
          const followHead = follow.get(head)!;
          for (const tok of followHead) {
            if (!followB.has(tok)) {
              followB.add(tok);
              changed = true;
            }
          }
        }
      }
    }
  }

  return follow;
}

// ========================
// Construção da tabela LL(1)
// ========================

type ParseTable = Map<NonTerminal, Map<Terminal, Production>>;

function buildParseTable(first: FirstSet, follow: FollowSet): ParseTable {
  const table: ParseTable = new Map();

  for (const nt of NON_TERMINALS) {
    table.set(nt, new Map());
  }

  for (const prod of PRODUCTIONS) {
    const { head, body } = prod;

    // SE o head NÃO está em NON_TERMINALS, loga e ignora (pra não dar TypeError)
    if (!NON_TERMINALS.includes(head)) {
      console.error(
        `ATENÇÃO: produção com head '${head}' não está em NON_TERMINALS, ignorando:`,
        prod
      );
      continue;
    }

    const firstBody = new Set<Terminal | typeof EPSILON>();
    let canDeriveEpsilon = true;

    for (const symbol of body) {
      const fs = first.get(symbol) || new Set<Terminal | typeof EPSILON>();
      for (const tok of fs) {
        if (tok === EPSILON) continue;
        firstBody.add(tok);
      }
      if (!fs.has(EPSILON)) {
        canDeriveEpsilon = false;
        break;
      }
    }
    if (canDeriveEpsilon) firstBody.add(EPSILON);

    const row = table.get(head)!;

    // Para cada a em FIRST(α) \ {ε}, M[head, a] = prod
    for (const tok of firstBody) {
      if (tok === EPSILON) continue;
      if (!row.has(tok as Terminal)) {
        row.set(tok as Terminal, prod);
      } else {
        // conflito LL(1) (podemos silenciar)
        // console.warn('Conflito LL(1) em', head, tok, row.get(tok), 'x', prod);
      }
    }

    // Se ε ∈ FIRST(α), para cada b em FOLLOW(head), M[head, b] = prod
    if (firstBody.has(EPSILON)) {
      const followHead = follow.get(head)!;
      for (const b of followHead) {
        if (!row.has(b)) {
          row.set(b, prod);
        } else {
          // conflito LL(1) "epsilon" (caso clássico do IfElseOpt)
          // console.warn('Conflito LL(1) (epsilon) em', head, b, row.get(b), 'x', prod);
        }
      }
    }
  }

  return table;
}

// ========================
// Mapeamento Token -> Terminal
// ========================

function tokenToTerminal(t: Token): Terminal {
  if (t.type === 'EOF') return '$';

  if (t.type === 'Keyword') {
    switch (t.lexeme) {
      case 'put':
        return 'KW_put';
      case 'take':
        return 'KW_take';
      case 'recipe':
        return 'KW_recipe';
      case 'if':
        return 'KW_if';
      case 'else':
        return 'KW_else';
      case 'meanwhile':
        return 'KW_meanwhile';
      case 'return':
        return 'KW_return';
      case 'true':
        return 'KW_true';
      case 'false':
        return 'KW_false';
      case 'empty':
        return 'KW_empty';
      default:
        syntaxError(t, `keyword '${t.lexeme}' não está na gramática LL(1)'`);
    }
  }

  if (t.type === 'Identifier') return 'ID';
  if (t.type === 'Number') return 'NUMBER';
  if (t.type === 'String') return 'STRING';

  if (t.type === 'Punctuation') {
    switch (t.lexeme) {
      case '{':
        return 'LBRACE';
      case '}':
        return 'RBRACE';
      case '(':
        return 'LPAREN';
      case ')':
        return 'RPAREN';
      case ';':
        return 'SEMICOLON';
      case ',':
        return 'COMMA';
      default:
        syntaxError(t, `pontuação '${t.lexeme}' não está na gramática LL(1)'`);
    }
  }

  if (t.type === 'Operator') {
    switch (t.lexeme) {
      case '=':
        return 'OP_ASSIGN';
      case '||':
        return 'OP_OR';
      case '&&':
        return 'OP_AND';
      case '==':
      case '===':
        return 'OP_EQ';
      case '!=':
      case '!==':
        return 'OP_NE';
      case '<':
        return 'OP_LT';
      case '<=':
        return 'OP_LE';
      case '>':
        return 'OP_GT';
      case '>=':
        return 'OP_GE';
      case '+':
        return 'OP_PLUS';
      case '-':
        return 'OP_MINUS';
      case '*':
        return 'OP_STAR';
      case '/':
        return 'OP_SLASH';
      case '%':
        return 'OP_PERCENT';
      case '!':
        return 'OP_NOT';
      default:
        syntaxError(t, `operador '${t.lexeme}' não está na gramática LL(1)'`);
    }
  }

  syntaxError(
    t,
    `token '${t.type}' '${t.lexeme}' não mapeado para terminal LL(1)`
  );
}

class LL1Parser {
  private tokens: Token[];
  private index = 0;
  private table: ParseTable;

  constructor(tokens: Token[], table: ParseTable) {
    this.tokens = tokens;
    this.table = table;
  }

  private currentToken(): Token {
    return this.tokens[this.index] ?? this.tokens[this.tokens.length - 1];
  }

  private advance(): void {
    if (this.index < this.tokens.length) this.index++;
  }

  public parse(start: NonTerminal = START_SYMBOL): void {
    const stack: SymbolName[] = ['$' as SymbolName, start];

    let lookahead = this.currentToken();

    while (stack.length > 0) {
      const X = stack.pop()!;
      const aTerminal = tokenToTerminal(lookahead);

      // Caso 1: X é terminal
      if (TERMINALS.includes(X as Terminal)) {
        if (X === aTerminal) {
          // MATCH
          this.advance();
          lookahead = this.currentToken();
        } else {
          syntaxError(
            lookahead,
            `esperado terminal '${X}' no topo da pilha, encontrado '${aTerminal}'`
          );
        }
      }
      // Caso 2: X é ε
      else if (X === EPSILON) {
        continue;
      }
      // Caso 3: X é não-terminal
      else {
        const row = this.table.get(X);
        if (!row) {
          syntaxError(
            lookahead,
            `não existe linha na tabela para não-terminal '${X}'`
          );
        }
        const prod = row.get(aTerminal);
        if (!prod) {
          syntaxError(
            lookahead,
            `não existe produção LL(1) para par (${X}, ${aTerminal})`
          );
        }

        // Empilha corpo da produção em ordem reversa
        for (let i = prod.body.length - 1; i >= 0; i--) {
          const sym = prod.body[i];
          if (sym !== EPSILON) stack.push(sym);
        }
      }
    }

    // Depois que a pilha esvaziar, a entrada deve estar em EOF
    const finalTerm = tokenToTerminal(lookahead);
    if (finalTerm !== '$') {
      syntaxError(
        lookahead,
        'entrada não foi completamente consumida pelo analisador LL(1)'
      );
    }
  }
}

export function runLL1(source: string) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();

  const first = computeFirstSets();
  const follow = computeFollowSets(first);
  const table = buildParseTable(first, follow);

  const parser = new LL1Parser(tokens, table);
  parser.parse(); // se não lançar erro, a entrada é aceita

  return {
    tokens,
    first,
    follow,
    table,
  };
}

// Para facilitar na apresentação
export const LL1_INFO = {
  NON_TERMINALS,
  TERMINALS,
  PRODUCTIONS,
  START_SYMBOL,
  EPSILON,
};

// ========================
// Helpers para imprimir FIRST e FOLLOW bonitinho
// ========================

export function printFirstSets(first: FirstSet) {
  console.log('===== FIRST =====');
  // Só mostra FIRST dos não-terminais, pra ficar mais limpo
  for (const nt of NON_TERMINALS) {
    const set = first.get(nt);
    if (!set) continue;
    const values = Array.from(set);
    // ordenar com ε no final
    values.sort((a, b) => {
      if (a === EPSILON) return 1;
      if (b === EPSILON) return -1;
      return a.localeCompare(b);
    });
    console.log(`FIRST(${nt}) = { ${values.join(', ')} }`);
  }
  console.log();
}

export function printFollowSets(follow: FollowSet) {
  console.log('===== FOLLOW =====');
  for (const nt of NON_TERMINALS) {
    const set = follow.get(nt);
    if (!set) continue;
    const values = Array.from(set);
    values.sort((a, b) => a.localeCompare(b));
    console.log(`FOLLOW(${nt}) = { ${values.join(', ')} }`);
  }
  console.log();
}

export function printParseTable(table: ParseTable) {
  console.log('===== TABELA LL(1) (resumo) =====');
  for (const nt of NON_TERMINALS) {
    const row = table.get(nt);
    if (!row) continue;
    const entries = Array.from(row.entries());
    if (entries.length === 0) continue;

    console.log(`Não-terminal: ${nt}`);
    for (const [terminal, prod] of entries) {
      const bodyStr = prod.body.join(' ');
      console.log(`  [${terminal}] => ${prod.head} -> ${bodyStr}`);
    }
    console.log();
  }
}
