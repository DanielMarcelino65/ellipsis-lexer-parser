// src/parser.ts
import { Lexer, Token, KEYWORDS } from './lexer.js';

export type AST = Program | Stmt | Expr;

export type Program = { kind: 'Program'; body: Stmt[] };

export type Stmt =
  | { kind: 'VarDecl'; id: string; init?: Expr; kindKw: 'put' | 'take' }
  | { kind: 'FunctionDecl'; name: string; params: string[]; body: Stmt[] }
  | { kind: 'If'; test: Expr; consequent: Stmt[]; alternate?: Stmt[] }
  | { kind: 'While'; test: Expr; body: Stmt[] }
  | { kind: 'DoWhile'; body: Stmt[]; test: Expr }
  | {
      kind: 'For';
      init?: Stmt | null;
      test?: Expr | null;
      update?: Expr | null;
      body: Stmt[];
    }
  | { kind: 'Return'; argument?: Expr }
  | { kind: 'ExprStmt'; expr: Expr }
  | { kind: 'Block'; body: Stmt[] };

export type Expr =
  | { kind: 'Binary'; op: string; left: Expr; right: Expr }
  | { kind: 'Unary'; op: string; argument: Expr }
  | { kind: 'Literal'; value: string | number | boolean | null }
  | { kind: 'Identifier'; name: string }
  | { kind: 'Call'; callee: Expr; args: Expr[] }
  | { kind: 'Assignment'; id: string; value: Expr };

// === Util: mensagens de erro consistentes ===
function fmtWhere(t: Token) {
  return `${t.line}:${t.column}`;
}
function syntaxError(t: Token, message: string, expected?: string[]): never {
  const exp =
    expected && expected.length ? ` Expected: ${expected.join(' | ')}.` : '';
  throw new Error(`Syntax error at ${fmtWhere(t)}: ${message}.${exp}`);
}

class Parser {
  private tokens: Token[];
  private i = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.i] ?? this.tokens[this.tokens.length - 1];
  }
  private atEnd(): boolean {
    return this.peek().type === 'EOF';
  }
  private advance(): Token {
    return this.tokens[this.i++] ?? this.tokens[this.tokens.length - 1];
  }

  private expect(type: Token['type'], lexeme?: string): Token {
    const t = this.peek();
    if (t.type !== type)
      syntaxError(t, `found ${t.type} '${t.lexeme}'`, [lexeme ?? type]);
    if (lexeme !== undefined && t.lexeme !== lexeme)
      syntaxError(t, `found '${t.lexeme}'`, [lexeme]);
    return this.advance();
  }

  // FIRST sets para validação rápida
  private firstOfExpression(t: Token): boolean {
    if (t.type === 'Number' || t.type === 'String') return true;
    if (t.type === 'Identifier') return true;
    if (t.type === 'Punctuation' && t.lexeme === '(') return true;
    if (
      t.type === 'Operator' &&
      (t.lexeme === '!' || t.lexeme === '+' || t.lexeme === '-')
    )
      return true;
    if (
      t.type === 'Keyword' &&
      (t.lexeme === 'true' || t.lexeme === 'false' || t.lexeme === 'empty')
    )
      return true;
    return false;
  }

  private firstOfStatement(t: Token): boolean {
    if (
      t.type === 'Keyword' &&
      (t.lexeme === 'put' ||
        t.lexeme === 'take' ||
        t.lexeme === 'recipe' ||
        t.lexeme === 'if' ||
        t.lexeme === 'else' ||
        t.lexeme === 'meanwhile' ||
        t.lexeme === 'do' ||
        t.lexeme === 'for' ||
        t.lexeme === 'return')
    )
      return true;
    if (t.type === 'Punctuation' && t.lexeme === '{') return true;
    // ExprStmt começa como Expression
    return this.firstOfExpression(t);
  }

  public parseProgram(): Program {
    const body: Stmt[] = [];
    while (!this.atEnd()) {
      const t0 = this.peek();
      if (!this.firstOfStatement(t0)) {
        syntaxError(t0, `invalid start of statement '${t0.lexeme}'`, [
          'put',
          'take',
          'recipe',
          'if',
          'meanwhile',
          'do',
          'for',
          'return',
          '{',
          '<expression>',
        ]);
      }
      body.push(this.parseStatement());
    }
    return { kind: 'Program', body };
  }

  // Palavras antigas: erro SINTÁTICO se usadas como começo de statement
  private static LEGACY_DECL_IDENTIFIERS = new Set(['let', 'const', 'var']);

  private parseStatement(): Stmt {
    const t = this.peek();

    if (t.type === 'Keyword') {
      switch (t.lexeme) {
        case 'put':
          return this.parseVarDecl(true); // let
        case 'take':
          return this.parseVarDecl(true); // const
        case 'recipe':
          return this.parseRecipeDecl();
        case 'if':
          return this.parseIf();
        case 'meanwhile':
          return this.parseWhile();
        case 'do':
          return this.parseDoWhile();
        case 'for':
          return this.parseFor();
        case 'return':
          return this.parseReturn();
      }
    }

    if (t.type === 'Punctuation' && t.lexeme === '{') {
      return this.parseBlock();
    }

    // Erro sintático explícito para 'let'/'const'/'var' iniciando statement
    if (
      t.type === 'Identifier' &&
      Parser.LEGACY_DECL_IDENTIFIERS.has(t.lexeme)
    ) {
      syntaxError(
        t,
        `'${t.lexeme}' is not a declaration keyword in this language`,
        ['put', 'take']
      );
    }

    // Expression statement (validamos FIRST(Expression))
    if (!this.firstOfExpression(t)) {
      syntaxError(t, `invalid start of expression '${t.lexeme}'`, [
        '(',
        'Identifier',
        'Number',
        'String',
        '!',
        '+',
        '-',
        'true',
        'false',
        'empty',
      ]);
    }
    const expr = this.parseExpression();
    if (this.peek().type === 'Punctuation' && this.peek().lexeme === ';') {
      this.advance();
    } else {
      syntaxError(this.peek(), `missing ';' after expression statement`, [';']);
    }
    return { kind: 'ExprStmt', expr };
  }

  private parseBlock(): Stmt {
    const open = this.expect('Punctuation', '{');
    const body: Stmt[] = [];
    while (
      !this.atEnd() &&
      !(this.peek().type === 'Punctuation' && this.peek().lexeme === '}')
    ) {
      body.push(this.parseStatement());
    }
    if (this.atEnd())
      syntaxError(open, `unterminated block: missing '}'`, ['}']);
    this.expect('Punctuation', '}');
    return { kind: 'Block', body };
  }

  // DECLARAÇÃO DE VARIÁVEL: SOMENTE 'put' (let) OU 'take' (const)
  private parseVarDecl(needsSemicolon: boolean): Stmt {
    const kw = this.peek();
    if (
      !(kw.type === 'Keyword' && (kw.lexeme === 'put' || kw.lexeme === 'take'))
    ) {
      syntaxError(kw, `expected 'put' or 'take'`, ['put', 'take']);
    }
    const kindKw = kw.lexeme as 'put' | 'take';
    this.advance();

    const idTok = this.expect('Identifier');
    const id = idTok.lexeme;

    let init: Expr | undefined;
    if (this.peek().type === 'Operator' && this.peek().lexeme === '=') {
      this.advance();
      init = this.parseExpression();
    }

    if (needsSemicolon) {
      // ; obrigatório fora do for
      if (this.peek().type === 'Punctuation' && this.peek().lexeme === ';') {
        this.advance();
      } else {
        syntaxError(this.peek(), `missing ';' after variable declaration`, [
          ';',
        ]);
      }
    }

    return { kind: 'VarDecl', id, init, kindKw };
  }

  private parseRecipeDecl(): Stmt {
    const k = this.expect('Keyword', 'recipe');
    const nameTok = this.expect('Identifier');
    this.expect('Punctuation', '(');
    const params: string[] = [];
    if (!(this.peek().type === 'Punctuation' && this.peek().lexeme === ')')) {
      do {
        const idTok = this.expect('Identifier');
        params.push(idTok.lexeme);
        if (this.peek().type === 'Punctuation' && this.peek().lexeme === ',') {
          this.advance();
        } else break;
      } while (true);
    }
    this.expect('Punctuation', ')');
    const body = (this.parseBlock() as any).body as Stmt[];
    return { kind: 'FunctionDecl', name: nameTok.lexeme, params, body };
  }

  private parseIf(): Stmt {
    this.expect('Keyword', 'if');
    this.expect('Punctuation', '(');
    const test = this.parseExpression();
    this.expect('Punctuation', ')');
    const consequent = this.parseStatement() as any;
    const consBody =
      consequent.kind === 'Block' ? consequent.body : [consequent];
    let alternate: Stmt[] | undefined;
    if (this.peek().type === 'Keyword' && this.peek().lexeme === 'else') {
      this.advance();
      const alt = this.parseStatement() as any;
      alternate = alt.kind === 'Block' ? alt.body : [alt];
    }
    return { kind: 'If', test, consequent: consBody, alternate };
  }

  private parseWhile(): Stmt {
    this.expect('Keyword', 'meanwhile'); // while
    this.expect('Punctuation', '(');
    const test = this.parseExpression();
    this.expect('Punctuation', ')');
    const bodyStmt = this.parseStatement() as any;
    const body = bodyStmt.kind === 'Block' ? bodyStmt.body : [bodyStmt];
    return { kind: 'While', test, body };
  }

  private parseDoWhile(): Stmt {
    this.expect('Keyword', 'do');
    const bodyStmt = this.parseStatement() as any;
    const body = bodyStmt.kind === 'Block' ? bodyStmt.body : [bodyStmt];
    this.expect('Keyword', 'meanwhile'); // do ... meanwhile (...)
    this.expect('Punctuation', '(');
    const test = this.parseExpression();
    this.expect('Punctuation', ')');
    if (this.peek().type === 'Punctuation' && this.peek().lexeme === ';')
      this.advance();
    return { kind: 'DoWhile', body, test };
  }

  private parseFor(): Stmt {
    this.expect('Keyword', 'for');
    this.expect('Punctuation', '(');

    // init
    let init: Stmt | null = null;
    if (!(this.peek().type === 'Punctuation' && this.peek().lexeme === ';')) {
      if (
        this.peek().type === 'Keyword' &&
        (this.peek().lexeme === 'put' || this.peek().lexeme === 'take')
      ) {
        init = this.parseVarDecl(false);
      } else {
        // erro sintático explícito se começar com let/const/var aqui
        if (
          this.peek().type === 'Identifier' &&
          Parser.LEGACY_DECL_IDENTIFIERS.has(this.peek().lexeme)
        ) {
          const t0 = this.peek();
          syntaxError(
            t0,
            `'${t0.lexeme}' is not a declaration keyword in this language`,
            ['put', 'take']
          );
        }
        // expressão normal
        if (!this.firstOfExpression(this.peek())) {
          syntaxError(this.peek(), `invalid start of expression in for-init`, [
            'put',
            'take',
            '(',
            'Identifier',
            'Number',
            'String',
            '!',
            '+',
            '-',
            'true',
            'false',
            'empty',
          ]);
        }
        const e = this.parseExpression();
        if (this.peek().type === 'Punctuation' && this.peek().lexeme === ';')
          this.advance();
        else syntaxError(this.peek(), `missing ';' after for-init`, [';']);
        init = { kind: 'ExprStmt', expr: e };
      }
    } else {
      this.expect('Punctuation', ';');
    }

    // test
    let test: Expr | null = null;
    if (!(this.peek().type === 'Punctuation' && this.peek().lexeme === ';')) {
      test = this.parseExpression();
    }
    this.expect('Punctuation', ';');

    // update
    let update: Expr | null = null;
    if (!(this.peek().type === 'Punctuation' && this.peek().lexeme === ')')) {
      update = this.parseExpression();
    }
    this.expect('Punctuation', ')');

    const bodyStmt = this.parseStatement() as any;
    const body = bodyStmt.kind === 'Block' ? bodyStmt.body : [bodyStmt];
    return { kind: 'For', init, test, update, body };
  }

  private parseReturn(): Stmt {
    this.expect('Keyword', 'return');
    let argument: Expr | undefined;
    if (!(this.peek().type === 'Punctuation' && this.peek().lexeme === ';')) {
      argument = this.parseExpression();
    }
    if (this.peek().type === 'Punctuation' && this.peek().lexeme === ';')
      this.advance();
    return { kind: 'Return', argument };
  }

  // === EXPRESSÕES com precedência ===
  private parseExpression(): Expr {
    return this.parseAssignment();
  }

  private parseAssignment(): Expr {
    const expr = this.parseLogicalOr();
    if (this.peek().type === 'Operator' && this.peek().lexeme === '=') {
      this.advance();
      if (expr.kind !== 'Identifier')
        syntaxError(
          this.peek(),
          'left side of assignment must be an identifier'
        );
      const value = this.parseAssignment();
      return { kind: 'Assignment', id: (expr as any).name, value };
    }
    return expr;
  }

  private parseLogicalOr(): Expr {
    let left = this.parseLogicalAnd();
    while (this.peek().type === 'Operator' && this.peek().lexeme === '||') {
      const op = this.advance().lexeme;
      const right = this.parseLogicalAnd();
      left = { kind: 'Binary', op, left, right };
    }
    return left;
  }

  private parseLogicalAnd(): Expr {
    let left = this.parseEquality();
    while (this.peek().type === 'Operator' && this.peek().lexeme === '&&') {
      const op = this.advance().lexeme;
      const right = this.parseEquality();
      left = { kind: 'Binary', op, left, right };
    }
    return left;
  }

  private parseEquality(): Expr {
    let left = this.parseRelational();
    while (
      this.peek().type === 'Operator' &&
      (this.peek().lexeme === '==' ||
        this.peek().lexeme === '!=' ||
        this.peek().lexeme === '===' ||
        this.peek().lexeme === '!==')
    ) {
      const op = this.advance().lexeme;
      const right = this.parseRelational();
      left = { kind: 'Binary', op, left, right };
    }
    return left;
  }

  private parseRelational(): Expr {
    let left = this.parseAdditive();
    while (
      this.peek().type === 'Operator' &&
      (this.peek().lexeme === '<' ||
        this.peek().lexeme === '>' ||
        this.peek().lexeme === '<=' ||
        this.peek().lexeme === '>=')
    ) {
      const op = this.advance().lexeme;
      const right = this.parseAdditive();
      left = { kind: 'Binary', op, left, right };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (
      this.peek().type === 'Operator' &&
      (this.peek().lexeme === '+' || this.peek().lexeme === '-')
    ) {
      const op = this.advance().lexeme;
      const right = this.parseMultiplicative();
      left = { kind: 'Binary', op, left, right };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (
      this.peek().type === 'Operator' &&
      (this.peek().lexeme === '*' ||
        this.peek().lexeme === '/' ||
        this.peek().lexeme === '%')
    ) {
      const op = this.advance().lexeme;
      const right = this.parseUnary();
      left = { kind: 'Binary', op, left, right };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (
      this.peek().type === 'Operator' &&
      (this.peek().lexeme === '!' ||
        this.peek().lexeme === '+' ||
        this.peek().lexeme === '-')
    ) {
      const op = this.advance().lexeme;
      const argument = this.parseUnary();
      return { kind: 'Unary', op, argument };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    if (t.type === 'Number') {
      this.advance();
      return { kind: 'Literal', value: Number(t.lexeme) };
    }
    if (t.type === 'String') {
      this.advance();
      return { kind: 'Literal', value: t.lexeme.slice(1, -1) };
    }
    if (
      t.type === 'Keyword' &&
      (t.lexeme === 'true' || t.lexeme === 'false' || t.lexeme === 'empty')
    ) {
      this.advance();
      return {
        kind: 'Literal',
        value: t.lexeme === 'true' ? true : t.lexeme === 'false' ? false : null,
      };
    }
    if (t.type === 'Identifier') {
      this.advance();
      let expr: Expr = { kind: 'Identifier', name: t.lexeme };
      if (this.peek().type === 'Punctuation' && this.peek().lexeme === '(') {
        this.advance();
        const args: Expr[] = [];
        if (
          !(this.peek().type === 'Punctuation' && this.peek().lexeme === ')')
        ) {
          do {
            args.push(this.parseExpression());
            if (
              this.peek().type === 'Punctuation' &&
              this.peek().lexeme === ','
            )
              this.advance();
            else break;
          } while (true);
        }
        this.expect('Punctuation', ')');
        expr = { kind: 'Call', callee: expr, args };
      }
      return expr;
    }
    if (t.type === 'Punctuation' && t.lexeme === '(') {
      this.advance();
      const e = this.parseExpression();
      this.expect('Punctuation', ')');
      return e;
    }
    syntaxError(t, `unexpected token ${t.type} '${t.lexeme}'`, [
      'Number',
      'String',
      'Identifier',
      '(',
      'true',
      'false',
      'empty',
      '!',
      '+',
      '-',
    ]);
  }
}

export function parse(source: string) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  return { tokens, ast };
}

export const CFG = `
Program       -> Statement* EOF
Statement     -> VarDecl | RecipeDecl | If | While | DoWhile | For | Return | Block | ExprStmt
VarDecl       -> ('put'|'take') Identifier ('=' Expression)? ';'?
RecipeDecl    -> 'recipe' Identifier '(' ParamList? ')' Block
ParamList     -> Identifier (',' Identifier)*
If            -> 'if' '(' Expression ')' Statement ('else' Statement)?
While         -> 'meanwhile' '(' Expression ')' Statement
DoWhile       -> 'do' Statement 'meanwhile' '(' Expression ')' ';'?
For           -> 'for' '(' (VarDecl|Expression)? ';' Expression? ';' Expression? ')' Statement
Return        -> 'return' Expression? ';'?
Block         -> '{' Statement* '}'
ExprStmt      -> Expression ';'?

Expression    -> Assignment
Assignment    -> Identifier '=' Assignment | LogicalOr
LogicalOr     -> LogicalAnd ('||' LogicalAnd)*
LogicalAnd    -> Equality ('&&' Equality)*
Equality      -> Relational (('=='|'!='|'==='|'!==') Relational)*
Relational    -> Additive (('<'|'>'|'<='|'>=') Additive)*
Additive      -> Multiplicative (('+'|'-') Multiplicative)*
Multiplicative-> Unary (('*'|'/'|'%') Unary)*
Unary         -> ('!'|'-'|'+') Unary | Primary
Primary       -> Number | String | 'true' | 'false' | 'empty' | Identifier CallArgs? | '(' Expression ')'
CallArgs      -> '(' (Expression (',' Expression)*)? ')'
`;
