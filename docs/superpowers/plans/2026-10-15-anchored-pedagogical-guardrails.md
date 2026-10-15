# Anchored Pedagogical Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement strict out-of-domain query guardrails (refusing unrelated questions like "How far is Uranus from Earth") while preserving deep explanatory and pedagogical capabilities for technical concepts anchored in the uploaded research papers.

**Architecture:** Dual-tier system prompt bounding in the LangChain conversational RAG pipeline with document manifest injection and explicit explanatory bridge guidelines. The RAG prompt enforces:
1. **Tier 1 (Out-of-Domain Refusal):** Explicitly refuse questions that have zero thematic or conceptual connection to the uploaded documents.
2. **Tier 2 (Strict Factual Grounding):** Mandate citations `[filename.pdf]` for all empirical claims, benchmark figures, and author statements.
3. **Tier 3 (Anchored Pedagogical Bridge):** Authorize deep conceptual explanations, mathematical derivations, and analogies for concepts *anchored* in the documents.

**Tech Stack:** Python 3.11+, FastAPI, LangChain, LangChain-Groq, pytest.

## Global Constraints

- Never break existing citation pills `[filename.pdf]` or LaTeX math formatting (`$$...$$`, `$...$`).
- Maintain the 8-chunk retrieval cap and 6-message chat history limit to prevent 413 context window errors.
- Ensure all error/refusal messages are polite, academic, and explicitly mention the active document names.

---

### Task 1: Create Guardrail Verification Test Suite

**Files:**
- Create: `backend/tests/test_guardrails.py`

**Interfaces:**
- Consumes: `backend.rag_pipeline.get_rag_chain`
- Produces: Automated pytest suite verifying Tier 1 (Refusal), Tier 2 (Factual Grounding), and Tier 3 (Conceptual Explanation).

- [ ] **Step 1: Write the failing test suite for guardrail boundaries**
  Create `backend/tests/test_guardrails.py` containing three test cases:
  1. `test_out_of_domain_refusal`: Tests questions completely unrelated to document domain (e.g. "How far is Uranus from Earth?"). Asserts that response states the topic is not covered in the provided sources and does NOT answer astronomical facts.
  2. `test_in_domain_factual_grounding`: Tests direct questions from document context (e.g. Transformer architecture). Asserts presence of citation `[Attention_Is_All_You_Need.pdf]`.
  3. `test_anchored_conceptual_explanation`: Tests questions asking to explain a concept in the paper from first principles (e.g. "Explain what Softmax does mathematically and why scaling by sqrt(d_k) prevents vanishing gradients"). Asserts the explanation is provided without refusing and references the paper's mechanism.

- [ ] **Step 2: Run test suite to verify current failure on Tier 1**
  Run `pytest backend/tests/test_guardrails.py` and confirm that `test_out_of_domain_refusal` fails because the model currently answers the Uranus question.

---

### Task 2: Inject Document Manifest into RAG Chain

**Files:**
- Modify: `backend/main.py:276-285`
- Modify: `backend/rag_pipeline.py:70-130`

**Interfaces:**
- Consumes: `models.Document`, `request.filenames`, `request.project_id`
- Produces: `get_rag_chain(project_id, k, filenames, doc_manifest)` with active document names injected into the system prompt.

- [ ] **Step 1: Update `get_rag_chain` signature and document manifest parameter**
  In `backend/rag_pipeline.py`, add `doc_manifest: list[str] = None` to `get_rag_chain`. If provided, format it as a formatted bullet list of active document names in the system prompt.

- [ ] **Step 2: Pass active document names from `main.py`**
  In `backend/main.py` (`query_chatbot`), resolve active document names from `request.filenames` or query `db.query(models.Document).filter(models.Document.project_id == request.project_id).all()` if `request.filenames` is empty. Pass this list to `get_rag_chain`.

---

### Task 3: Implement Anchored Pedagogical Guardrail Prompt

**Files:**
- Modify: `backend/rag_pipeline.py:110-130`

**Interfaces:**
- Consumes: System prompt template in `rag_pipeline.py`
- Produces: Updated `qa_prompt` with 3-tier boundary rules replacing permissive guideline 4.

- [ ] **Step 1: Remove permissive guideline 4 and insert 3-Tier Guardrail guidelines**
  Update the system prompt in `backend/rag_pipeline.py`:
  - Rule 1 (Refusal): When a question is completely unrelated to the domain/content of the uploaded documents ({doc_manifest}), you MUST politely refuse. State: "Based on the provided documents ([doc names]), this topic is not covered in your research library. I am restricted to answering questions and analyzing concepts related to your uploaded sources."
  - Rule 2 (Factual Grounding): Any assertions about author claims, experiments, benchmarks, or paper findings MUST be directly drawn from `{context}` with inline citations `[filename.pdf]`.
  - Rule 3 (Anchored Pedagogical Bridge): If a user asks to explain, derive, or provide analogies for concepts, equations, or methods *mentioned in the documents* (such as Softmax, Attention, Gradient Descent, BLEU score), you are encouraged to use academic knowledge to explain them thoroughly. Explicitly bridge the explanation to how the authors use it in the paper.
  - Rule 4 (Formatting & Math): Retain LaTeX math ($$...$$, $...$) and standard Markdown line breaks.

- [ ] **Step 2: Run test suite to verify all guardrails pass**
  Run `pytest backend/tests/test_guardrails.py` and confirm all 3 test tiers pass.

- [ ] **Step 3: Commit changes**
  Run `git add . && git commit -m "feat: implement anchored pedagogical guardrails in RAG pipeline"`

---

### Task 4: End-to-End Manual Verification & Verification Report

**Files:**
- Manual verification via API / Frontend chat

- [ ] **Step 1: Test out-of-domain query**
  Send: "How far is Uranus from Earth?"
  Verify: Returns polite refusal stating the topic is not covered in the uploaded papers.
- [ ] **Step 2: Test anchored explanation query**
  Send: "In the attention formula, explain what softmax does mathematically and why dividing by $\sqrt{d_k}$ is necessary."
  Verify: Produces thorough mathematical explanation with LaTeX, connects to the paper, and includes citations.
- [ ] **Step 3: Verify existing UI features**
  Verify citation pills, split-pane PDF viewer, and tool persistence remain fully intact.
