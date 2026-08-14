# How ChatGPT-Style Systems Work

A technical introduction for software engineers: from beginner concepts to system architecture and low-level computation.

**Scope discipline**

| Label | Meaning |
|---|---|
| **Public / industry-standard** | Widely documented (papers, blogs, open-source stacks) |
| **Conceptual / simplified** | Teaching model; omits engineering edge cases |
| **Proprietary / unknown** | Not publicly disclosed (e.g. OpenAI’s exact data mix, parameter counts for some models, internal routing, hidden chain-of-thought) — **not invented here** |

Neuriy AI in this repo implements the **application/orchestration** pattern described below. The local engine is not a secretly trained frontier GPT.

---

## Progress map

```
BEGINNER          → What ChatGPT is; tokens; chat product vs model
INTERMEDIATE      → Transformers; attention; embeddings; training loop
ADVANCED          → Alignment; RAG; tools; agents; hallucinations
SYSTEM ARCHITECTURE → Serving; safety hierarchy; end-to-end request path
LOW-LEVEL         → Math; GPUs; parallelism; numerical formats
```

---

## 1. What ChatGPT is

### Simply
ChatGPT is a **product**: a chat UI plus backend services that wrap a large language model so people can talk to it naturally.

### Technically
Distinguish three layers:

1. **GPT model (LLM)** — neural network that maps a sequence of tokens → next-token probability distribution.
2. **Application / product** — ChatGPT web/app: accounts, UI, history, file uploads, voice, projects.
3. **Orchestration layer** — builds the prompt/context, calls tools, retrieves documents, applies safety, streams tokens, stores turns.

```
┌─────────────────────────────────────────────┐
│  ChatGPT-like PRODUCT                       │
│  UI · accounts · history · uploads          │
├─────────────────────────────────────────────┤
│  ORCHESTRATION                              │
│  context · tools · RAG · safety · memory    │
├─────────────────────────────────────────────┤
│  LLM (GPT-family weights)                   │
│  transformer forward pass + sampling        │
└─────────────────────────────────────────────┘
```

### Example
You ask “Summarize this PDF and search the web for updates.” The **UI** accepts the file; **orchestration** extracts text, retrieves web results, builds a multi-message context; the **model** generates the answer token by token.

### Why it matters
Confusing “the model” with “the product” leads to wrong designs. Building Neuriy/FRC7 chat means shipping orchestration + APIs even before you host your own huge weights.

**LLM vs GPT vs ChatGPT**

| Term | What it is |
|---|---|
| LLM | Any large language model |
| GPT model | Decoder-only transformer trained mainly with next-token prediction (family name from OpenAI; architecture pattern is public) |
| ChatGPT | OpenAI’s chat product around such models |

---

## 2. GPT architecture

### Simply
**GPT** = Generative Pre-trained Transformer. Text text one token at a time using stacked transformer blocks.

### Technically (public transformer knowledge)

A **decoder-only** stack:

```
tokens → embedding (+ positions)
   → N × TransformerBlock
        ├─ LayerNorm
        ├─ Multi-Head Self-Attention (+ residual)
        ├─ LayerNorm
        └─ Feed-Forward / MLP (+ residual)
   → LayerNorm → linear → logits over vocabulary
```

**Self-attention** — each position attends to (usually) earlier positions (causal mask) so generation doesn’t peek at the future.

**Multi-head attention** — several attention “heads” in parallel; different heads can specialize (syntax, long-range refs, etc.) — specialization is observed/empirically discussed; exact head meanings are not a clean public taxonomy.

**Q, K, V** — learned projections of the same residual stream:

\[
Q = X W_Q,\quad K = X W_K,\quad V = X W_V
\]

**Feed-forward (MLP)** — usually two linear layers with a nonlinearity (historically GELU; many modern variants exist). Expands then projects back.

**Residual connections** — `x ← x + Sublayer(x)` ease gradient flow.

**Layer normalization** — stabilizes activations (Pre-LN is common in modern LLMs — public literature).

**Positional information** — absolute embeddings (older), or relative / RoPE / ALiBi-style methods (modern public techniques). Exact choice per commercial model may be undisclosed.

**Output layer** — unembedding / tied embeddings → vocabulary logits.

### Example
Input tokens for “The capital of France is” → layers mix context → high probability on “Paris”.

### Why it matters
Almost all modern chat models are variants of this stack. Understanding blocks lets you reason about context length, KV cache, and compute cost.

---

## 3. Tokenization

### Simply
Models don’t read letters or words directly. Text is cut into **tokens** (subwords/bytes).

### Technically
Algorithms like **BPE** or **Unigram** (SentencePiece) learn a vocabulary. Each token has an integer **token ID**.

Why not whole words?
- Open vocabulary (rare words, code, typos)
- Shared pieces across languages
- Stable compute unit

**Context window** ≈ max tokens of input+output the model can condition on. Cost scales with token count (attention often ~quadratic in sequence length for vanilla attention; efficient variants exist).

### Example
`"unhappiness"` → `["un", "happiness"]` or similar pieces (vocab-dependent).

### Why it matters
Billing, truncation, and prompt design are all in tokens. Neuriy’s educational tokenizer in `@neuriy/ai` shows the idea; production systems use tiktoken/SentencePiece-class tokenizers.

---

## 4. Embeddings

### Simply
Each token ID becomes a **vector** of numbers (e.g. hundreds/thousands of dimensions).

### Technically
Lookup: \(e_i = E[\text{id}_i]\). Geometry encodes similarity: related concepts often have closer vectors (cosine/dot product). Contextual embeddings after layers depend on whole sequence — unlike static Word2Vec.

### Example
Vectors for “king” and “queen” may be closer than “king” and “carburetor” (classic illustration; real LLM geometry is richer and contextual).

### Why it matters
Embeddings are also the backbone of **RAG** (document vectors in a vector DB).

---

## 5. Attention

### Intuition
When predicting the next word, the model “looks back” at relevant earlier tokens (the subject of a verb, the open brace in code, the user’s constraint).

### Math (scaled dot-product attention — Vaswani et al., public)

\[
\mathrm{Attention}(Q,K,V) = \mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
\]

- \(QK^\top\): similarity scores between queries and keys  
- \(\sqrt{d_k}\): scale to keep softmax well-behaved  
- softmax: turns scores into weights that sum to 1  
- multiply by \(V\): weighted mix of values  

**Multi-head**: run \(h\) attentions with different projections; concatenate; project.

**Causal mask**: set future scores to \(-\infty\) before softmax so position \(t\) only sees \(\le t\).

### Example
In “The animal didn’t cross the street because **it** was tired”, attention can bind “it” to “animal”.

### Why it matters
Attention is how context enters each prediction — the core of transformer LLMs.

---

## 6. Neural-network parameters

### Simply
**Parameters** (weights, biases) are the knobs learned in training. “7B model” ≈ ~7 billion parameters (order of magnitude language — exact counts for some closed models are undisclosed).

### Technically
Knowledge is **distributed** across matrices — not one weight per fact. It is **not** a database of Q&A rows. Retrieval of a “fact” is reconstructing a likely continuation from statistical patterns + context.

### Example
The association “Paris–France” is smeared across many weights; editing one fact without side effects is hard (research area: model editing).

### Why it matters
You cannot `UPDATE` a single fact like a SQL row. Use RAG, fine-tuning, or tools for fresh/private truth.

---

## 7. Training

### Pretraining
On huge text corpora, minimize **next-token prediction** loss.

**Batch**: many sequences in parallel on accelerators.

**Forward pass**: compute logits → probabilities.

**Loss**: usually **cross-entropy** between predicted distribution and the true next token.

**Backpropagation**: chain rule → **gradients** ∂Loss/∂param.

**Optimizers**: Adam/AdamW-class (public); learning rate schedules (warmup+decay common).

**Checkpoints**: saved weights periodically.

**Evaluation**: held-out perplexity, benchmarks (MMLU-style, coding, etc.) — suites evolve; closed eval harnesses may differ.

### Cross-entropy (simplified)

\[
L = -\sum_t \log p_\theta(x_t \mid x_{<t})
\]

Plain English: punish the model when it assigns low probability to the actual next token.

### Parameter update (schematic)

\[
\theta \leftarrow \theta - \eta \cdot \tilde{g}
\]

\(\eta\): learning rate; \(\tilde{g}\): optimizer-processed gradient.

### Why it matters
Pretraining creates broad competence; it does not by itself create a polite, safe chatbot.

---

## 8. Instruction tuning and alignment

### Why pretraining is not enough
Base models complete text (including toxic or unhelpful completions). Products need instruction-following and safety.

### Public concepts (not OpenAI private recipes)

| Stage | Idea |
|---|---|
| Instruction tuning / SFT | Train on (prompt, ideal response) demos |
| Preference optimization | Learn from ranked human/AI preferences (RLHF, DPO, and variants — public papers) |
| Alignment | Steer toward helpful, honest, harmless behavior as defined by policy |
| Safety training | Reduce disallowed categories; refusal styles |
| Red teaming | Adversarial testing |

**Proprietary**: exact data, raters, reward models, and policy trees for ChatGPT are not public — do not invent them.

---

## 9. Inference (after you send a message)

### Step-by-step (conceptual)

1. **HTTP request** hits API gateway  
2. **Auth / quota / safety classifiers** (product-specific)  
3. **Tokenize** messages  
4. **Context construction** — system + developer + history + user (+ tool results + retrieved docs)  
5. **Embedding + transformer forward** (with **KV cache** for speed)  
6. **Logits** → **softmax** → distribution over vocab  
7. **Decode/sample** (greedy, temperature, top-p, etc.)  
8. Append token; repeat (**autoregressive**) until stop/EOS/length  
9. **Stream** tokens to UI; **post-process** / output filters  

### Why token-by-token?
The model defines \(p(x_t mid x_{<t})\). The joint distribution over a full answer factorizes left-to-right. There is no single forward pass that emits an entire arbitrary-length answer at once in standard GPT decoding.

---

## 10. Context windows

### Simply
The sliding working memory of the model for one request.

### Technically
Conversation history is **re-sent** (or cached as KV) as tokens — not magical permanent memory. Long context increases **memory (KV)** and **compute**.

**KV caching**: store Key/Value tensors from prior tokens so decoding new tokens reuses work (public serving technique).

### Why it matters
“Remember last month” needs external memory/DB; context alone is ephemeral per session/request design.

---

## 11. Reasoning

### Simply
Models can produce intermediate steps that look like reasoning because training data and objectives reward useful multi-step patterns.

### Distinctions

| Mode | Meaning |
|---|---|
| Pattern recognition | Familiar structures |
| Inference | Draw conclusions from stated premises in-context |
| Planning | Decompose goals (often with scaffolding/tools) |
| Explicit reasoning | Visible chain-of-thought text |

**Emergence**: large-scale next-token training can yield surprising skills — studied publicly; mechanisms still researched.

**Reasoning models** (public product category): systems trained/incentivized to spend more tokens on deliberation, sometimes with separate “thinking” channels. **Do not claim** private internal scratchpads for specific vendors unless published.

Neuriy’s `neuriy.reason` exposes an **application-level** reasoning trace for teaching — not a hidden proprietary CoT channel.

---

## 12. RAG — Retrieval-Augmented Generation

```
Query → embed → vector search (+ optional keyword/hybrid)
     → rerank → inject top docs into prompt → generate
```

| Piece | Role |
|---|---|
| Embeddings | Map text → vectors |
| Vector DB | ANN search (HNSW, IVF, …) |
| Keyword | BM25 etc. |
| Hybrid | Fuse dense + sparse |
| Reranker | Cross-encoder polish |
| Injection | Docs become context tokens |

**Why**: fresher info, private corpora, citations — without full retraining.

---

## 13. Tool use

The model emits a **structured call** (function name + JSON args). Orchestration executes **time, calculator, web search, code sandbox, file fetch, APIs**. Results return as messages; the model continues.

**LLM alone** predicts text. **Tool-using AI system** = LLM + schemas + executors + policy.

Neuriy tools: `time`, `calculator`, `marketplace`, `memory`.

---

## 14. Agents

```
Goal → Plan → Select tool → Act → Observe → Iterate → Memory → Terminate
```

vs basic LLM: single shot completion. Agents add loops, state, and stopping rules. Reliability, cost, and safety become central engineering problems.

---

## 15. Hardware

| Concept | Role |
|---|---|
| GPUs / AI accelerators | Massive parallel matmuls |
| Tensor cores | Mixed-precision GEMMs |
| VRAM / HBM | Hold weights + activations + KV |
| Memory bandwidth | Often the bottleneck for inference |
| Distributed computing | Model too big / batch too big for one device |

GPUs win because transformer layers are dominated by **dense matrix multiplications** that parallelize well.

---

## 16. Distributed training

| Parallelism | Idea |
|---|---|
| Data parallel | Same weights, different batches; sync gradients |
| Tensor / model parallel | Split layers/matrices across GPUs |
| Pipeline parallel | Split depth into stages |

Needs fast interconnect (NVLink/InfiniBand-class), gradient sync (AllReduce), and distributed checkpoint storage. Exact cluster designs for frontier labs are largely proprietary.

---

## 17. Inference infrastructure

| Topic | Notes |
|---|---|
| Model serving | Load weights; expose generate API |
| Batching | Amortize GPU work across users |
| Continuous batching | Schedule sequences at token iteration granularity (public OSS ideas: vLLM et al.) |
| KV cache | Critical for multi-turn / long decode |
| Quantization | INT8/FP8/… to shrink memory |
| Formats | FP32, FP16, BF16, INT8, FP8 — trade accuracy vs speed |
| Latency vs throughput | Time-to-first-token vs tokens/sec at scale |

---

## 18. Why LLMs hallucinate

The model optimizes **likelihood**, not guaranteed **truth**. Fluent text can be false. Gaps in knowledge get filled with plausible continuations.

**Mitigations**: RAG, tools, verification agents, calibration, better training/alignment, cite sources, abstain when unsure — none are perfect.

---

## 19. Safety architecture (conceptual hierarchy)

```
Safety / system policy  (highest)
        ↓
Developer instructions
        ↓
User messages           (lowest when conflicting)
```

Plus classifiers, moderation APIs, tool allowlists, output filters. Exact ChatGPT policy engines are proprietary; the **hierarchy idea** is widely discussed publicly.

---

## 20. ChatGPT-like system architecture (ASCII)

```
 User
  │
  ▼
 Chat UI (web/app)
  │
  ▼
 API gateway / auth / rate limits
  │
  ▼
 Orchestration service
  │  ├─ load session / memory store
  │  ├─ build message list (system/dev/user)
  │  ├─ moderation (input)
  │  ├─ optional RAG retrieve
  │  └─ decide tools?
  ▼
 GPT / LLM worker (tokens in → tokens out)
  │
  ├──── if tool call ────▶ Tool runtime
  │                         (web, code, files, APIs)
  │                              │
  │◀──── tool results ───────────┘
  │
  ▼
 Continue generation
  │
  ▼
 Output moderation / formatting
  │
  ▼
 Stream / return to UI → User
```

---

## 21. End-to-end example

**User:** “What is 17*19, and briefly what is attention?”

1. **UI** sends JSON to `/v1/chat`  
2. **Safety** allows the text  
3. **Session** appends user turn  
4. **Tokenizer** would convert context to IDs (remote LLM) / Neuriy local counts tokens  
5. **Tool detect** → `calculator(17*19)` → `323`  
6. **RAG** may pull attention snippet  
7. **Generate** answer mentioning 323 + attention intuition  
8. **Store** assistant message  
9. **Return** to user  

Same pattern whether weights are local, remote OpenAI-compatible, or a hosted frontier API.

---

## 22. Mathematics (plain English)

**Embedding**: one-hot / id → dense vector via table lookup.

**QKV**: three linear maps of the hidden state.

**Attention**: soft weighted average of value vectors, weights from query-key similarity.

**Softmax**: \(e^{z_i} / \sum_j e^{z_j}\) — emphasizes largest scores.

**Cross-entropy**: how surprised the model is by the true token.

**Gradients**: sensitivity of loss to each weight.

**Updates**: nudge weights opposite the gradient (optimizer-adjusted).

**Matmul**: \(C = AB\) — core GPU op; attention and MLPs are mostly matmuls.

---

## 23. Comparison

| System | Strength | Limit |
|---|---|---|
| Traditional software | Exact logic | Brittle NLP |
| Search engines | Fresh docs | Not synthesis |
| Databases | Precise records | No language UI |
| Expert systems | Clear rules | Costly to expand |
| Classical ML | Tabular tasks | Weak open language |
| Neural nets | Pattern learning | Need data/compute |
| LLMs | Flexible language | Hallucinations |
| RAG systems | Grounded answers | Retrieval quality |
| AI agents | Multi-step goals | Complexity/fail modes |

---

## 24. Proprietary vs publicly known

**Generally public**
- Transformer equations; BPE-style tokenization; next-token training; RLHF/DPO literature; RAG; tool calling patterns; KV cache; common parallelisms; quantization ideas.

**Typically not public (do not invent)**
- Exact ChatGPT microservice graph  
- Full training corpora and filtering pipelines  
- Undisclosed parameter counts / expert routing  
- Live safety classifier models  
- Hidden deliberation channels  
- Production cluster topology and capacity  

**Simplified in this doc / Neuriy**
- Educational tokenizer & tiny RAG  
- Persona + tool orchestration instead of hosting frontier weights by default  

---

## Building an LLM-powered app (engineer checklist)

1. Define product surface (chat, tools, files).  
2. Choose model hosting (API vs self-host).  
3. Design message schema + system prompts.  
4. Add session store (context ≠ long-term memory).  
5. Add RAG if private/fresh data matters.  
6. Add tools with strict schemas + sandboxing.  
7. Add input/output moderation.  
8. Measure latency (TTFT), cost (tokens), quality (evals).  
9. Log traces for debugging agents.  
10. Never confuse demos with production SLAs.

---

## Further reading (public)

- Vaswani et al., *Attention Is All You Need*  
- Radford et al., GPT / GPT-2 papers  
- Brown et al., GPT-3  
- Ouyang et al., InstructGPT (RLHF)  
- Lewis et al., RAG  
- Open-source stacks: Hugging Face Transformers, vLLM, llama.cpp (ecosystem examples)

---

*Document version aligned with FRC7 / Neuriy AI 7.2. Educational; not an official OpenAI architecture disclosure.*
