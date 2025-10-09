//Classes de Lexemas
export type TokenType =
  | 'Identifier'
  | 'Number'
  | 'String'
  | 'Keyword'
  | 'Operator'
  | 'Punctuation'
  | 'EOF';

// Estrutura do Token
export type Token = {
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
};

export const KEYWORDS = new Set([
  'if',
  'else',
  'meanwhile', //while
  'do',
  'for',
  'recipe', //function
  'return',
  'put', //let
  'take', //const
  'true',
  'false',
  'empty', //null
]);

export const LEGACY_TO_DIALECT = new Map<string, string>([
  ['let', 'put'],
  ['const', 'take'],
  ['function', 'recipe'],
  ['while', 'meanwhile'],
  ['null', 'empty'],
  ['var', 'put'],
]);

export const FORBIDDEN_IDENTIFIERS = new Set(LEGACY_TO_DIALECT.keys());

export const IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

const isWhitespace = (ch: string) => /\s/.test(ch);
const isDigit = (ch: string) => /[0-9]/.test(ch);
const isIdentifierStart = (ch: string) => /[A-Za-z_]/.test(ch);
const isIdentifierPart = (ch: string) => /[A-Za-z0-9_]/.test(ch);

const OPERATORS = [
  '===',
  '!==',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '++',
  '--',
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '=',
  '!',
] as const;

const PUNCT = ['(', ')', '{', '}', '[', ']', ';', ',', '.'] as const;

export class Lexer {
  private src: string;
  private i = 0;
  private line = 1;
  private col = 1;

  constructor(source: string) {
    this.src = source;
  }

  private peek(n = 0): string {
    return this.src[this.i + n] ?? '';
  }
  private advance(): string {
    const ch = this.src[this.i++] ?? '';
    if (ch === '\n') {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
    return ch;
  }

  private makeToken(
    type: TokenType,
    lexeme: string,
    line: number,
    column: number
  ): Token {
    return { type, lexeme, line, column };
  }

  private skipWhitespaceAndComments() {
    while (true) {
      if (isWhitespace(this.peek())) {
        this.advance();
        continue;
      }
      // line comment //
      if (this.peek() === '/' && this.peek(1) === '/') {
        while (this.peek() && this.peek() !== '\n') this.advance();
        continue;
      }
      // block comment /* ... */
      if (this.peek() === '/' && this.peek(1) === '*') {
        this.advance();
        this.advance();
        while (this.peek() && !(this.peek() === '*' && this.peek(1) === '/')) {
          this.advance();
        }
        if (this.peek()) {
          this.advance();
          this.advance();
        }
        continue;
      }
      break;
    }
  }

  private matchLongestOperator(): string | null {
    for (const op of OPERATORS) {
      let ok = true;
      for (let k = 0; k < op.length; k++) {
        if (this.peek(k) !== op[k]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        for (let k = 0; k < op.length; k++) this.advance();
        return op;
      }
    }
    return null;
  }

  nextToken(): Token {
    this.skipWhitespaceAndComments();
    const ch = this.peek();
    if (!ch) return this.makeToken('EOF', '<EOF>', this.line, this.col);

    const startLine = this.line,
      startCol = this.col;

    // String literals (single or double quotes)
    if (ch === '"' || ch === "'") {
      const quote = this.advance();
      let str = '';
      while (this.peek() && this.peek() !== quote) {
        if (this.peek() === '\\') {
          this.advance();
          const esc = this.advance();
          str += '\\' + esc;
        } else {
          str += this.advance();
        }
      }
      if (this.peek() === quote) this.advance();
      return this.makeToken('String', quote + str + quote, startLine, startCol);
    }

    // Number
    if (isDigit(ch)) {
      let num = '';
      while (isDigit(this.peek())) num += this.advance();
      if (this.peek() === '.' && isDigit(this.peek(1))) {
        num += this.advance();
        while (isDigit(this.peek())) num += this.advance();
      }
      return this.makeToken('Number', num, startLine, startCol);
    }

    // Identifier or keyword
    if (isIdentifierStart(ch)) {
      let id = this.advance();
      while (isIdentifierPart(this.peek())) id += this.advance();

      if (FORBIDDEN_IDENTIFIERS.has(id)) {
        const suggestion = LEGACY_TO_DIALECT.get(id);
        const where = `${startLine}:${startCol}`;
        const hint = suggestion ? ` Use '${suggestion}' instead.` : '';
        throw new Error(
          `Lexical error at ${where}: '${id}' is not valid in this language.${hint}`
        );
      }

      if (KEYWORDS.has(id)) {
        return this.makeToken('Keyword', id, startLine, startCol);
      }
      return this.makeToken('Identifier', id, startLine, startCol);
    }

    // Operator
    const op = this.matchLongestOperator();
    if (op) return this.makeToken('Operator', op, startLine, startCol);

    // Punctuation
    if ((PUNCT as readonly string[]).includes(ch)) {
      this.advance();
      return this.makeToken('Punctuation', ch, startLine, startCol);
    }

    // Unknown -> treat as Operator to keep going
    this.advance();
    return this.makeToken('Operator', ch, startLine, startCol);
  }

  tokenize(): Token[] {
    const toks: Token[] = [];
    while (true) {
      const t = this.nextToken();
      toks.push(t);
      if (t.type === 'EOF') break;
    }
    return toks;
  }
}
