from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 80) -> List[str]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=overlap)
    return splitter.split_text(text)

