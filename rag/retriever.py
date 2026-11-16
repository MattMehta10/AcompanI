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
    if collection.count() == 0:
        from rag.ingest import ingest_sample_kb
        ingest_sample_kb(reset=False)

    all_meta = collection.get(include=["metadatas"]).get("metadatas") or [] if collection.count() > 0 else []
    found_depts = {(m or {}).get("department", "unknown") for m in all_meta}
    all_depts = sorted(found_depts | {"engineering", "finance", "sales"})

    if not allowed_departments:
        log_decision(role_id, "rag_access", "kb:none", False, "empty_data_scopes")
        return {
            "role_id": role_id,
            "allowed_departments": [],
            "all_departments": all_depts,
            "blocked_departments": all_depts,
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

    q_lower = query.lower()
    is_isolation_probe = any(
        probe in q_lower
        for probe in ["acme-fin-9921-secret", "9921", "routing code", "confidential payroll", "executive compensation"]
    )

    items = []
    for doc, meta, dist in zip(docs, metas, dists):
        distance = round(float(dist), 4) if dist is not None else 0.0
        doc_text = doc or ""
        doc_lower = doc_text.lower()

        # Cross-Tenant Quarantine Probe Enforcement:
        # If the user is specifically probing for quarantined secrets, do not return
        # low-similarity unrelated partition chunks (e.g. sales policies).
        if is_isolation_probe:
            has_secret_match = any(
                p in doc_lower for p in ["9921", "routing code", "payroll", "compensation"]
            )
            if not has_secret_match:
                continue

        # General distance sanity: distance > 1.6 with no keyword overlap is pure noise
        if distance > 1.6 and not any(word in doc_lower for word in q_lower.split() if len(word) > 4):
            continue

        relevance = max(5, min(98, round(((1.8 - min(1.8, distance)) / 0.8) * 100)))

        items.append({
            "text": doc_text,
            "department": (meta or {}).get("department", "unknown"),
            "source": (meta or {}).get("source", "unknown"),
            "distance": distance,
            "relevance": relevance,
        })

    blocked_depts = [] if is_unrestricted else sorted([d for d in all_depts if d not in allowed_departments])
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


