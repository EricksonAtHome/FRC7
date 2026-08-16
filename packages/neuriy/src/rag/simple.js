/**
 * Tiny in-process RAG: embed by bag-of-tokens hashing, cosine-rank snippets.
 * Educational — production RAG uses real embedding models + vector DBs.
 */

import { encode } from "../llm/tokenizer.js";

const DOCS = [
  {
    id: "gpt-basics",
    title: "What is a GPT model?",
    text: "GPT means Generative Pre-trained Transformer. It predicts the next token given previous tokens using a decoder-only transformer with self-attention.",
  },
  {
    id: "chatgpt-vs-llm",
    title: "ChatGPT vs LLM",
    text: "An LLM is the neural network. A GPT model is an LLM family. ChatGPT is the product: UI, orchestration, safety, tools, memory, and the model together.",
  },
  {
    id: "attention",
    title: "Self-attention",
    text: "Self-attention computes Query, Key, Value projections. Attention weights are softmax(QK^T / sqrt(d_k)) applied to V so each token can gather context from others.",
  },
  {
    id: "rag",
    title: "Retrieval-Augmented Generation",
    text: "RAG retrieves relevant documents via embeddings and injects them into the prompt so the model can answer with fresher or private knowledge without retraining.",
  },
  {
    id: "agents",
    title: "AI agents",
    text: "An agent loops: goal → plan → select tool → act → observe → iterate → stop. Agents wrap an LLM with tools, memory, and termination conditions.",
  },
  {
    id: "neuriy",
    title: "Neuriy AI",
    text: "Neuriy AI is a ChatGPT-style conversational system in FRC7 with models like neuriy.chat, neuriy.code, sessions, tools, and Neuriy Marketplace discovery.",
  },
  {
    id: "training",
    title: "Pretraining",
    text: "Pretraining minimizes next-token cross-entropy on large text corpora using backpropagation, AdamW-style optimizers, and distributed GPU training.",
  },
  {
    id: "inference",
    title: "Inference",
    text: "Inference tokenizes input, runs the transformer forward pass, produces logits, samples or argmaxes the next token, and repeats autoregressively with KV cache.",
  },
];

function embed(text) {
  const ids = encode(String(text || "").toLowerCase());
  const dim = 64;
  const v = new Float64Array(dim);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    v[id % dim] += 1;
    v[(id * 7) % dim] += 0.5;
  }
  // L2 normalize
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < dim; i++) v[i] /= n;
  return v;
}

function cosine(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function retrieve(query, { k = 3 } = {}) {
  const q = embed(query);
  const scored = DOCS.map((d) => ({
    ...d,
    score: cosine(q, embed(`${d.title} ${d.text}`)),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).filter((d) => d.score > 0.05);
}

export function formatRetrieved(docs) {
  if (!docs?.length) return "";
  return docs
    .map((d, i) => `[${i + 1}] ${d.title}: ${d.text}`)
    .join("\n");
}
