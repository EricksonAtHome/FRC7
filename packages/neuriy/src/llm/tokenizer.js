/**
 * Educational tokenizer for Neuriy AI.
 * Simplified: not a production BPE/tiktoken clone — teaches token concepts.
 * Public analogy: GPT models use learned subword vocabularies (BPE/Unigram).
 */

const SPECIAL = Object.freeze({
  bos: "<|bos|>",
  eos: "<|eos|>",
  pad: "<|pad|>",
  system: "<|system|>",
  user: "<|user|>",
  assistant: "<|assistant|>",
});

/** Minimal English+code-ish vocabulary + byte fallbacks */
const BASE_VOCAB = [
  SPECIAL.bos, SPECIAL.eos, SPECIAL.pad, SPECIAL.system, SPECIAL.user, SPECIAL.assistant,
  " ", "\n", "\t",
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(""),
  ...".,!?;:'\"()-_/\\@#$%&*+=<>[]{}|~`".split(""),
  "the", "a", "an", "to", "of", "and", "in", "is", "it", "you", "that", "for",
  "on", "with", "as", "be", "this", "have", "from", "or", "one", "had", "by",
  "word", "but", "not", "what", "all", "were", "we", "when", "your", "can",
  "said", "there", "use", "each", "which", "she", "do", "how", "their", "if",
  "will", "up", "other", "about", "out", "many", "then", "them", "these", "so",
  "some", "her", "would", "make", "like", "him", "into", "time", "has", "look",
  "two", "more", "write", "go", "see", "number", "no", "way", "could", "people",
  "my", "than", "first", "water", "been", "call", "who", "oil", "its", "now",
  "find", "long", "down", "day", "did", "get", "come", "made", "may", "part",
  "hello", "help", "please", "thanks", "code", "function", "return", "const",
  "let", "var", "class", "import", "export", "async", "await", "true", "false",
  "null", "undefined", "error", "data", "model", "chat", "neuriy", "ai", "gpt",
  "token", "attention", "transformer", "embedding", "train", "infer", "prompt",
];

function buildMaps() {
  const tokenToId = new Map();
  const idToToken = [];
  for (const t of BASE_VOCAB) {
    if (!tokenToId.has(t)) {
      tokenToId.set(t, idToToken.length);
      idToToken.push(t);
    }
  }
  // byte-level fallback tokens
  for (let i = 0; i < 256; i++) {
    const t = `<|byte_${i}|>`;
    tokenToId.set(t, idToToken.length);
    idToToken.push(t);
  }
  return { tokenToId, idToToken };
}

const { tokenToId, idToToken } = buildMaps();

export function vocabSize() {
  return idToToken.length;
}

export function encode(text) {
  const s = String(text ?? "");
  const ids = [];
  let i = 0;
  while (i < s.length) {
    let matched = null;
    // greedy longest match from vocab (simple, educational)
    for (let len = Math.min(24, s.length - i); len >= 1; len--) {
      const slice = s.slice(i, i + len);
      if (tokenToId.has(slice)) {
        matched = slice;
        break;
      }
    }
    if (matched) {
      ids.push(tokenToId.get(matched));
      i += matched.length;
    } else {
      const code = s.charCodeAt(i) & 0xff;
      ids.push(tokenToId.get(`<|byte_${code}|>`));
      i += 1;
    }
  }
  return ids;
}

export function decode(ids) {
  return (ids || [])
    .map((id) => {
      const t = idToToken[id];
      if (!t) return "";
      const m = /^<\|byte_(\d+)\|>$/.exec(t);
      if (m) return String.fromCharCode(Number(m[1]));
      if (t.startsWith("<|") && t.endsWith("|>")) return "";
      return t;
    })
    .join("");
}

export function countTokens(text) {
  return encode(text).length;
}

export function specialTokens() {
  return { ...SPECIAL };
}

/**
 * Build chat-style token stream with role markers (ChatML-inspired, simplified).
 */
export function encodeChat(messages) {
  const parts = [];
  for (const msg of messages || []) {
    const role = String(msg.role || "user");
    const marker = SPECIAL[role] || SPECIAL.user;
    parts.push(marker, "\n", String(msg.content ?? ""), "\n");
  }
  parts.push(SPECIAL.assistant, "\n");
  return encode(parts.join(""));
}
