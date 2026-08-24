# AI DOCUMENT INTELLIGENCE & RAG ENGINE
## Technical Architecture, Grounding Guarantees & Hosting Specifications

*Document Status:* **Active Architectural Blueprint**  
*Target System:* `@doc-platform/workers` & `@doc-platform/core`  
*Module:* [`ai-document.ts`](file:///c:/Users/Upendra/Desktop/pdff/packages/workers/src/processors/ai-document.ts)

---

## 1. Executive Overview: Real AI vs. "Faux-AI" Document Tools

Most consumer PDF tools "pretend" to provide AI document intelligence by naively sending raw string dumps directly into basic LLM prompts. This causes critical production failures:
- **Token Truncation:** Fails on 50+ page documents by chopping off content after page 2.
- **Hallucinated Numbers/Clauses:** Generates fabricated answers without document evidence.
- **Zero Verifiability:** The user has no way to confirm where an answer came from.
- **Data Privacy Violations:** Uploads entire raw PDFs to external cloud endpoints.

### Our Production AI Engineering Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REAL AI DOCUMENT INTELLIGENCE ENGINE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Semantic Text Chunker with Page Coordinates                             │
│     - Splits documents into semantic paragraph chunks with overlap.         │
│     - Tags every single chunk with { pageNumber, boundingBox, heading }.     │
│                                                                             │
│  2. Hybrid Retrieval (RAG: Dense Vector + BM25 Keyword Search)             │
│     - Finds exact contractual clauses, dates, currency numbers, & synonyms. │
│     - Top-K relevant chunks retrieved based on cosine similarity.           │
│                                                                             │
│  3. Grounded Source Citations (Zero Hallucination Policy)                   │
│     - Every answer from the AI MUST cite exact references:                  │
│       e.g., "[Page 14, Section 3.2: 'Payment Terms']".                      │
│     - Users can click the citation to verify the real document text.        │
│                                                                             │
│  4. Hierarchical Map-Reduce for 100+ Page Long Documents                    │
│     - For massive contracts/books: Recursive chunked map-reduce generates:  │
│       • Executive Summary                                                   │
│       • Key Obligations & Liabilities                                       │
│       • Financial & Numerical Tables                                        │
│       • Critical Deadlines & Action Items                                   │
│                                                                             │
│  5. Structured Schema / Table Extraction                                    │
│     - Converts unstructured invoices/receipts into verified JSON schemas.   │
│                                                                             │
│  6. Multi-Provider & Offline Security Fallback                              │
│     - Pluggable adapter: Gemini 1.5 Pro, Claude 3.5, GPT-4o, or Local       │
│       Ollama/Llama-3 for 100% on-premise air-gapped privacy.                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Deep-Dive: Core Technical Components

### A. Semantic Chunking with Page Tracking
Documents are not treated as monolithic strings. The engine parses the PDF into structured semantic chunks:
```typescript
interface DocumentChunk {
  chunkId: string;        // e.g. "chunk_p4_02"
  pageNumber: number;     // Exact 1-indexed page where text resides
  text: string;           // Clean textual payload
  tokens: string[];       // Tokenized words for keyword & BM25 retrieval
  boundingBox?: {         // Exact coordinate frame for UI highlight
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

* **Chunking Strategy:** 500-token sliding window with 100-token overlap across paragraph boundaries to prevent context fragmentation at sentence breaks.

---

### B. Hybrid Retrieval (Dense Vector + BM25 Term Frequency)
Queries are resolved through a dual-scoring pipeline:
1. **Keyword/Lexical Search (BM25):** Matches exact strings, SKU numbers, currency quantities (`$45,000`, `₹1,50,000`), and dates.
2. **Dense Vector Embeddings:** Matches semantic concepts (e.g., query *"What happens if I cancel?"* retrieves clauses titled *"Termination for Convenience"*).
3. **Reciprocal Rank Fusion (RRF):** Combines lexical and vector scores to produce the definitive `Top-K` chunks passed to the inference model.

---

### C. Grounded Source Citations (Zero-Hallucination Policy)
The inference prompt enforces strict grounding:
* **Constraint:** The model is prohibited from using external world knowledge if it contradicts or is absent from the provided context chunks.
* **Output Payload:**
```json
{
  "question": "What is the warranty period for hardware defects?",
  "answer": "Hardware defects are covered for a period of 24 months from the initial delivery date.",
  "citations": [
    {
      "pageNumber": 7,
      "snippetText": "Section 4.1: Hardware Warranty. Supplier warrants that hardware components shall remain free from defects for twenty-four (24) months...",
      "relevanceScore": 0.96
    }
  ],
  "groundedConfidence": 0.98
}
```

---

### D. Hierarchical Map-Reduce for 100+ Page Documents (`ai-summarize`)
For large corporate filings, legal depositions, and books:
1. **Map Phase:** Each section/chapter chunk is summarized independently into key factual points, numerical figures, and entities.
2. **Reduce Phase:** Intermediate summaries are hierarchically synthesized into:
   - **Executive Overview:** 1-page high-level summary for leadership.
   - **Obligations & Risks:** Compliance flags and liabilities.
   - **Financial Tables:** Extracted line items and balance figures.
   - **Action Items:** Deadlines, deliverables, and signatory requirements.

---

## 3. Hosting & Infrastructure Architecture

The platform uses a **Decoupled Multi-Provider AI Adapter**:

```
                  ┌─────────────────────────────────────┐
                  │    Sandboxed Worker AI Processor    │
                  └──────────────────┬──────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌───────────────────────────┐           ┌───────────────────────────┐
    │     Cloud AI Adapter      │           │     Local / On-Premise    │
    │  (High Concurrency SaaS)  │           │   (Air-Gapped & Enterprise)│
    ├───────────────────────────┤           ├───────────────────────────┤
    │ - Google Gemini 1.5 Pro   │           │ - Ollama / vLLM           │
    │ - Anthropic Claude 3.5    │           │ - Llama-3.1 8B / 70B      │
    │ - OpenAI GPT-4o           │           │ - Mistral Nemo            │
    │ - Strict zero-retention   │           │ - 100% Zero Data Egress   │
    │   enterprise API agreements│          │ - Runs in customer VPC    │
    └───────────────────────────┘           └───────────────────────────┘
```

* **Production SaaS Hosting:** Managed workers execute in isolated container environments calling encrypted zero-data-retention endpoints.
* **Enterprise / Sovereign Cloud Hosting:** For banks, legal firms, and healthcare clients, workers route directly to a co-located local `vLLM` container with GPU acceleration, guaranteeing that no byte of customer data leaves the perimeter.

---

## 4. Manual & Automated Evaluation Framework

To verify accuracy and eliminate regressions:
1. **Citation Verification Metric:** Checks that 100% of generated claims link to an exact valid page index present in the document.
2. **Context Precision & Recall:** Benchmarked using RAGAS (Retrieval Augmented Generation Assessment) evaluation datasets.
3. **Hallucination Detection:** An automated validator flags any generated statement containing entities/numbers not found in the source text chunk.
