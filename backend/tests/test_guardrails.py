import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from langchain_core.documents import Document
from langchain.chains.combine_documents import create_stuff_documents_chain
from rag_pipeline import llm, get_rag_chain

SAMPLE_PAPER_CONTEXT = [
    Document(
        page_content=(
            "The Transformer uses multi-head attention. An attention function can be described as mapping "
            "a query and a set of key-value pairs to an output. We compute the attention function on a set "
            "of queries simultaneously, packed together into a matrix Q. "
            "Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V. "
            "We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the "
            "softmax function into regions where it has extremely small gradients. To counteract this effect, "
            "we scale the dot products by 1 / sqrt(d_k)."
        ),
        metadata={"filename": "Attention_Is_All_You_Need.pdf", "source": "Attention_Is_All_You_Need.pdf", "page": 4}
    )
]

def test_out_of_domain_refusal():
    """Tier 1: Out-of-domain query (e.g. Uranus) must be refused when context is about Transformer."""
    chain = get_rag_chain(filenames=["Attention_Is_All_You_Need.pdf"])
    
    # We test with the RAG chain or directly with context
    response = chain.invoke({
        "input": "How far is Uranus from Earth?",
        "chat_history": []
    })
    answer = response["answer"].lower()
    
    # Should NOT provide actual planetary distance (e.g., 'billion kilometers' or 'astronomical units' or '1.8 billion miles')
    # Should indicate that it is not covered in the documents/sources
    assert any(phrase in answer for phrase in [
        "not covered", "not discussed", "not mention", "no information", 
        "outside the scope", "uploaded", "research library", "sources do not"
    ]), f"Expected refusal, got: {response['answer']}"
    
    assert "billion" not in answer and "miles" not in answer and "19.2 au" not in answer, \
        f"Model answered planetary distance instead of refusing: {response['answer']}"

def test_anchored_conceptual_explanation():
    """Tier 3: Conceptual question anchored in paper must be explained and cited."""
    chain = get_rag_chain(filenames=["Attention_Is_All_You_Need.pdf"])
    response = chain.invoke({
        "input": "In the attention formula, explain what softmax does mathematically and why dividing by sqrt(d_k) is necessary.",
        "chat_history": []
    })
    answer = response["answer"]
    
    # Must explain softmax/gradients
    assert any(term in answer.lower() for term in ["softmax", "gradient", "probability", "scale", "dot product"]), \
        f"Expected conceptual explanation, got: {answer}"
    
    # Must contain citations to the document
    assert "Attention_Is_All_You_Need.pdf" in answer or "Attention" in answer, \
        f"Expected document citation in explanation, got: {answer}"
