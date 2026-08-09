export const TokenType = Object.freeze({
  KEYWORD: "KEYWORD",
  IDENT: "IDENT",
  STRING: "STRING",
  NUMBER: "NUMBER",
  LBRACE: "LBRACE",
  RBRACE: "RBRACE",
  NEWLINE: "NEWLINE",
  EOF: "EOF",
});

const KEYWORDS = new Set([
  "set", "env", "network", "docker", "use", "model", "run", "input",
  "print", "result", "region", "auth", "connect", "timeout", "retry",
  "stream", "batch", "webhook", "lang",
]);

export function tokenize(source) {
  const tokens = [];
  let i = 0, line = 1, column = 1;
  const push = (type, value, startCol = column) => tokens.push({ type, value, line, column: startCol });

  while (i < source.length) {
    const ch = source[i];
    if (ch === "\n") { push(TokenType.NEWLINE, "\n"); i++; line++; column = 1; continue; }
    if (ch === " " || ch === "\t" || ch === "\r") { i++; column++; continue; }
    if (ch === "#" || (ch === "/" && source[i + 1] === "/")) {
      while (i < source.length && source[i] !== "\n") { i++; column++; }
      continue;
    }
    if (ch === "{") { push(TokenType.LBRACE, "{"); i++; column++; continue; }
    if (ch === "}") { push(TokenType.RBRACE, "}"); i++; column++; continue; }
    if (ch === '"') {
      const startCol = column; i++; column++;
      let value = "";
      while (i < source.length && source[i] !== '"') {
        if (source[i] === "\\" && i + 1 < source.length) {
          const next = source[i + 1];
          const escapes = { n: "\n", t: "\t", r: "\r", '"': '"', "\\": "\\" };
          value += escapes[next] ?? next; i += 2; column += 2; continue;
        }
        if (source[i] === "\n") throw err(line, column, "Unterminated string");
        value += source[i]; i++; column++;
      }
      if (i >= source.length) throw err(line, startCol, "Unterminated string");
      i++; column++; push(TokenType.STRING, value, startCol); continue;
    }
    if (/[0-9]/.test(ch)) {
      const startCol = column; let value = "";
      while (i < source.length && /[0-9.]/.test(source[i])) { value += source[i]; i++; column++; }
      push(TokenType.NUMBER, value, startCol); continue;
    }
    if (/[A-Za-z_.-]/.test(ch)) {
      const startCol = column; let value = "";
      while (i < source.length && /[A-Za-z0-9_.:\/@-]/.test(source[i])) { value += source[i]; i++; column++; }
      push(KEYWORDS.has(value) ? TokenType.KEYWORD : TokenType.IDENT, value, startCol); continue;
    }
    throw err(line, column, `Unexpected '${ch}'`);
  }
  push(TokenType.EOF, "");
  return tokens;
}

function err(line, column, message) {
  const e = new Error(`FRCL syntax error at ${line}:${column}: ${message}`);
  e.name = "FRCLSyntaxError"; e.line = line; e.column = column; return e;
}
