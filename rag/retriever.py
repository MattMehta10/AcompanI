import os
from typing import List, Dict, Any
from authority.audit_log import log_decision
from rag.ingest import get_collection


def retrieve_scoped(
    query: str,
    allowed_departments: List[str],
    role_id: str = "unknown",
    k: int = 3,
) -> List[str]:
    """Retrieve chunks strictly filtered to the role's allowed_departments."""
    if not allowed_departments:
        log_decision(role_id, "rag_access", "kb:none", False, "empty_data_scopes")
        return []

    collection = get_collection()
    if collection.count() == 0:
        return []

    where_filter = (
        {"department": {"$in": allowed_departments}}
        if "all" not in allowed_departments
        else None
    )

    if os.getenv("EMBEDDING_PROVIDER", "chroma_default") == "ollama":
        from langchain_ollama import OllamaEmbeddings

        embedder = OllamaEmbeddings(
            model="nomic-embed-text",
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        )
        q_emb = embedder.embed_query(query)
        results = collection.query(query_embeddings=[q_emb], n_results=k, where=where_filter)
    else:
        results = collection.query(query_texts=[query], n_results=k, where=where_filter)

    docs = results.get("documents", [[]])[0] or []
    log_decision(
        role_id=role_id,
        action_type="rag_access",
        resource=f"kb:{','.join(allowed_departments)}",
        allowed=True,
        reason=f"returned_{len(docs)}_chunks",
    )
    return docs


def retrieve_scoped_with_metadata(
    query: str,
    allowed_departments: List[str],
    role_id: str = "unknown",
    k: int = 4,
) -> Dict[str, Any]:
    """Retrieve scoped chunks along with similarity distances, metadata, and isolation status."""
    collection = get_collection()
    all_meta = collection.get(include=["metadatas"]).get("metadatas") or [] if collection.count() > 0 else []
    all_depts = sorted({(m or {}).get("department", "unknown") for m in all_meta})

    if not allowed_departments:
        log_decision(role_id, "rag_access", "kb:none", False, "empty_data_scopes")
        return {
            "role_id": role_id,
            "allowed_departments": [],
            "all_departments": all_depts,
            "blocked_departments": all_depts,
            "results": [],
        }

    if collection.count() == 0:
        return {
            "role_id": role_id,
            "allowed_departments": allowed_departments,
            "all_departments": [],
            "blocked_departments": [],
            "results": [],
        }

    is_unrestricted = "all" in allowed_departments
    where_filter = None if is_unrestricted else {"department": {"$in": allowed_departments}}

    if os.getenv("EMBEDDING_PROVIDER", "chroma_default") == "ollama":
        from langchain_ollama import OllamaEmbeddings

        embedder = OllamaEmbeddings(
            model="nomic-embed-text",
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        )
        q_emb = embedder.embed_query(query)
        raw = collection.query(
            query_embeddings=[q_emb],
            n_results=k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )
    else:
        raw = collection.query(
            query_texts=[query],
            n_results=k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

    docs = (raw.get("documents") or [[]])[0]
    metas = (raw.get("metadatas") or [[]])[0]
    dists = (raw.get("distances") or [[]])[0]

    items = []
    for doc, meta, dist in zip(docs, metas, dists):
        items.append({
            "text": doc,
            "department": (meta or {}).get("department", "unknown"),
            "source": (meta or {}).get("source", "unknown"),
            "distance": round(float(dist), 4) if dist is not None else 0.0,
            "relevance": max(0, min(100, round((1.0 - float(dist or 0.0) / 2.0) * 100))),
        })

    blocked_depts = [] if is_unrestricted else [d for d in all_depts if d not in allowed_departments]
    log_decision(
        role_id=role_id,
        action_type="rag_access",
        resource=f"kb:{','.join(allowed_departments)}",
        allowed=True,
        reason=f"explorer_returned_{len(items)}_chunks",
    )
    return {
        "role_id": role_id,
        "allowed_departments": allowed_departments,
        "all_departments": all_depts,
        "blocked_departments": blocked_depts,
        "results": items,
    }


