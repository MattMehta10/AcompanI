import os
from pathlib import Path
from typing import Optional
import chromadb
from chromadb.config import Settings
from rag.chunking import chunk_text

BASE_DIR = Path(__file__).resolve().parent
CHROMA_PATH = BASE_DIR / "chroma_db"
KB_SAMPLES_DIR = BASE_DIR / "kb_samples"

_client: Optional[chromadb.PersistentClient] = None


def get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=str(CHROMA_PATH),
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def get_collection(reset: bool = False):
    client = get_client()
    if reset:
        try:
            client.delete_collection("company_kb")
        except Exception:
            pass
    return client.get_or_create_collection(name="company_kb")


def _embed_texts(texts: list[str]) -> Optional[list[list[float]]]:
    """Use Ollama nomic-embed-text if configured, otherwise let Chroma use its built-in ONNX embedder."""
    if os.getenv("EMBEDDING_PROVIDER", "chroma_default") == "ollama":
        from langchain_ollama import OllamaEmbeddings

        embedder = OllamaEmbeddings(
            model="nomic-embed-text",
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        )
        return embedder.embed_documents(texts)
    return None


def ingest_document(text: str, department: str, source: str, reset: bool = False) -> int:
    collection = get_collection(reset=reset)
    chunks = chunk_text(text)
    if not chunks:
        return 0
    ids = [f"{department}_{source}_{i}" for i in range(len(chunks))]
    metadatas = [{"department": department, "source": source} for _ in chunks]
    embeddings = _embed_texts(chunks)
    if embeddings is not None:
        collection.upsert(documents=chunks, embeddings=embeddings, ids=ids, metadatas=metadatas)
    else:
        collection.upsert(documents=chunks, ids=ids, metadatas=metadatas)
    return len(chunks)


def ingest_sample_kb(reset: bool = True) -> dict[str, int]:
    """Ingest all sample KB documents under rag/kb_samples/."""
    counts: dict[str, int] = {}
    if reset:
        get_collection(reset=True)
    for file_path in sorted(KB_SAMPLES_DIR.glob("*.txt")):
        department = file_path.stem.lower()
        text = file_path.read_text(encoding="utf-8")
        counts[department] = ingest_document(text, department=department, source=file_path.name, reset=False)
    return counts

