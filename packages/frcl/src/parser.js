import { tokenize, TokenType } from "./tokenize.js";

export function parse(source) {
  const tokens = tokenize(source);
  let pos = 0;
  const peek = () => tokens[pos];
  const at = (type, value) => peek().type === type && (value === undefined || peek().value === value);
  const advance = () => tokens[pos++];
  const skip = () => { while (at(TokenType.NEWLINE)) advance(); };
  const expect = (type, value) => {
    if (!at(type, value)) throw parseErr(peek(), `Expected ${value || type}`);
    return advance();
  };
  const stringOrIdent = () => {
    if (at(TokenType.STRING) || at(TokenType.IDENT) || at(TokenType.KEYWORD) || at(TokenType.NUMBER)) return advance().value;
    throw parseErr(peek(), "Expected value");
  };
  const block = () => {
    expect(TokenType.LBRACE); skip();
    const props = {};
    while (!at(TokenType.RBRACE) && !at(TokenType.EOF)) {
      if (at(TokenType.NEWLINE)) { advance(); continue; }
      const key = advance().value;
      props[key] = stringOrIdent();
      skip();
    }
    expect(TokenType.RBRACE);
    return props;
  };

  const body = [];
  skip();
  while (!at(TokenType.EOF)) {
    const t = peek();
    if (at(TokenType.KEYWORD, "set")) {
      advance(); expect(TokenType.KEYWORD, "env");
      body.push({ type: "SetEnv", value: stringOrIdent() });
    } else if (at(TokenType.KEYWORD, "network") || at(TokenType.KEYWORD, "docker")) {
      const kind = advance().value;
      const name = stringOrIdent(); skip();
      body.push({ type: kind === "network" ? "Network" : "Docker", name, properties: block() });
    } else if (at(TokenType.KEYWORD, "use")) {
      advance(); expect(TokenType.KEYWORD, "model");
      body.push({ type: "UseModel", model: stringOrIdent() });
    } else if (at(TokenType.KEYWORD, "run")) {
      advance();
      if (at(TokenType.KEYWORD, "model")) advance();
      const model = stringOrIdent(); skip();
      let props = {};
      if (at(TokenType.LBRACE)) props = block();
      else if (at(TokenType.KEYWORD, "input")) { advance(); props.input = stringOrIdent(); }
      if (!props.input) throw parseErr(t, "run requires input");
      body.push({
        type: "RunModel",
        model,
        input: props.input,
        stream: props.stream === "true",
        timeout: props.timeout ? Number(props.timeout) : null,
        retry: props.retry ? Number(props.retry) : null,
        webhook: props.webhook || null,
        lang: props.lang || null,
      });
    } else if (at(TokenType.KEYWORD, "print")) {
      advance(); if (at(TokenType.KEYWORD, "result") || at(TokenType.IDENT, "result")) advance();
      body.push({ type: "Print" });
    } else if (at(TokenType.KEYWORD, "region") || at(TokenType.KEYWORD, "connect") || at(TokenType.KEYWORD, "auth") || at(TokenType.KEYWORD, "lang")) {
      const kind = advance().value;
      body.push({ type: kind[0].toUpperCase() + kind.slice(1), value: stringOrIdent() });
    } else if (at(TokenType.KEYWORD, "batch")) {
      advance(); skip();
      const props = at(TokenType.LBRACE) ? block() : {};
      body.push({ type: "Batch", ...props });
    } else {
      throw parseErr(t, `Unexpected '${t.value}'`);
    }
    skip();
  }
  return { type: "Program", body };
}

export function toPlan(ast) {
  const plan = {
    env: "prod", networks: {}, docker: null, model: null, runs: [],
    region: null, connect: null, auth: null, lang: "ht", print: false, batch: false,
  };
  for (const n of ast.body) {
    if (n.type === "SetEnv") plan.env = n.value;
    else if (n.type === "Network") plan.networks[n.name] = n.properties;
    else if (n.type === "Docker") plan.docker = { name: n.name, ...n.properties };
    else if (n.type === "UseModel") plan.model = n.model;
    else if (n.type === "RunModel") {
      plan.runs.push({ model: n.model || plan.model, input: n.input, stream: n.stream, timeout: n.timeout, retry: n.retry, webhook: n.webhook, lang: n.lang });
      if (!plan.model) plan.model = n.model;
    }
    else if (n.type === "Print") plan.print = true;
    else if (n.type === "Region") plan.region = String(n.value).toLowerCase();
    else if (n.type === "Connect") plan.connect = n.value;
    else if (n.type === "Auth") plan.auth = n.value;
    else if (n.type === "Lang") plan.lang = n.value;
    else if (n.type === "Batch") plan.batch = true;
  }
  return plan;
}

export function compile(source) {
  const ast = parse(source);
  return { ast, plan: toPlan(ast) };
}

export function validatePlan(plan) {
  const errors = [], warnings = [];
  if (!plan?.runs?.length) errors.push("No run model statements");
  for (const [i, run] of (plan.runs || []).entries()) {
    if (!run.model) errors.push(`Run #${i + 1} missing model`);
    if (!run.input?.trim?.()) errors.push(`Run #${i + 1} empty input`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function analyze(source) {
  const { ast, plan } = compile(source);
  return { ast, plan, validation: validatePlan(plan) };
}

function parseErr(token, message) {
  const e = new Error(`FRCL parse error at ${token.line}:${token.column}: ${message}`);
  e.name = "FRCLParseError"; return e;
}
