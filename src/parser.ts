// src/parser.ts
import { Lexer, Token, KEYWORDS } from './lexer.js';

export type AST = Program | Stmt | Expr;

export type Program = { kind: 'Program'; body: Stmt[] };

export type Stmt =
  | { kind: 'VarDecl'; id: string; init?: Expr }
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
      throw new Error(
        `Expected ${type} but found ${t.type} ('${t.lexeme}') at ${t.line}:${t.column}`
      );
    if (lexeme !== undefined && t.lexeme !== lexeme) {
      throw new Error(
        `Expected '${lexeme}' but found '${t.lexeme}' at ${t.line}:${t.column}`
      );
    }
    return this.advance();
  }

  public parseProgram(): Program {
    const body: Stmt[] = [];
    while (!this.atEnd()) {
      body.push(this.parseStatement());
    }
    return { kind: 'Program', body };
  }

  private parseStatement(): Stmt {
    const t = this.peek();
    if (t.type === 'Keyword') {
      switch (t.lexeme) {
        case 'put':
        case 'take':
          return this.parseVarDecl();
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
    // default: expression statement
    const expr = this.parseExpression();
    // optional semicolon
    if (this.peek().type === 'Punctuation' && this.peek().lexeme === ';')
      this.advance();
    return { kind: 'ExprStmt', expr };
  }

  private parseBlock(): Stmt {
    this.expect('Punctuation', '{');
    const body: Stmt[] = [];
    while (
      !(this.peek().type === 'Punctuation' && this.peek().lexeme === '}')
    ) {
      body.push(this.parseStatement());
    }
    this.expect('Punctuation', '}');
    return { kind: 'Block', body };
  }

  private parseVarDecl(): Stmt {
    const kw = this.peek(); // deve ser 'put' ou 'take'
    if (
      !(kw.type === 'Keyword' && (kw.lexeme === 'put' || kw.lexeme === 'take'))
    ) {
      throw new Error(`Expected 'put' or 'take' at ${kw.line}:${kw.column}`);
    }
    this.advance(); // consome 'put' ou 'take'

    const id = this.expect('Identifier').lexeme;
    let init: Expr | undefined = undefined;

    // opcional "= expr"
    if (this.peek().type === 'Operator' && this.peek().lexeme === '=') {
      this.advance();
      init = this.parseExpression();
    }
    if (this.peek().type === 'Punctuation' && this.peek().lexeme === ';')
      this.advance();
    return { kind: 'VarDecl', id, init };
  }

  private parseRecipeDecl(): Stmt {
    this.expect('Keyword', 'recipe');
    const name = this.expect('Identifier').lexeme;
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
    return { kind: 'FunctionDecl', name, params, body };
  }

  private parseIf(): Stmt {
    this.expect('Keyword', 'if');
    this.expect('Punctuation', '(');
    const test = this.parseExpression();
    this.expect('Punctuation', ')');
    const consequent = this.parseStatement() as any;
    const consBody =
      consequent.kind === 'Block' ? consequent.body : [consequent];
    let alternate: Stmt[] | undefined = undefined;
    if (this.peek().type === 'Keyword' && this.peek().lexeme === 'else') {
      this.advance();
      const alt = this.parseStatement() as any;
      alternate = alt.kind === 'Block' ? alt.body : [alt];
    }
    return { kind: 'If', test, consequent: consBody, alternate };
  }

  private parseWhile(): Stmt {
    this.expect('Keyword', 'while');
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
    this.expect('Keyword', 'while');
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
        (this.peek().lexeme === 'var' ||
          this.peek().lexeme === 'let' ||
          this.peek().lexeme === 'const')
      ) {
        init = this.parseVarDecl();
      } else {
        const e = this.parseExpression();
        if (this.peek().type === 'Punctuation' && this.peek().lexeme === ';')
          this.advance();
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
    let argument: Expr | undefined = undefined;
    if (!(this.peek().type === 'Punctuation' && this.peek().lexeme === ';')) {
      argument = this.parseExpression();
    }
    if (this.peek().type === 'Punctuation' && this.peek().lexeme === ';')
      this.advance();
    return { kind: 'Return', argument };
  }

  // Expressions with precedence (||, &&, equality, relational, additive, multiplicative, unary, primary)
  private parseExpression(): Expr {
    return this.parseAssignment();
  }

  private parseAssignment(): Expr {
    const expr = this.parseLogicalOr();
    if (this.peek().type === 'Operator' && this.peek().lexeme === '=') {
      this.advance();
      if (expr.kind !== 'Identifier')
        throw new Error('Left side of assignment must be an identifier');
      const value = this.parseAssignment();
      return { kind: 'Assignment', id: expr.name, value };
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
      (t.lexeme === 'true' || t.lexeme === 'false' || t.lexeme === 'null')
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
      // call
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
    throw new Error(
      `Unexpected token ${t.type} '${t.lexeme}' at ${t.line}:${t.column}`
    );
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
VarDecl       -> ('var'|'let'|'const') Identifier ('=' Expression)? ';'?
RecipeDecl    -> 'recipe' Identifier '(' ParamList? ')' Block
ParamList     -> Identifier (',' Identifier)*
If            -> 'if' '(' Expression ')' Statement ('else' Statement)?
While         -> 'while' '(' Expression ')' Statement
DoWhile       -> 'do' Statement 'while' '(' Expression ')' ';'?
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
Primary       -> Number | String | 'true' | 'false' | 'null' | Identifier CallArgs? | '(' Expression ')'
CallArgs      -> '(' (Expression (',' Expression)*)? ')'
`;
