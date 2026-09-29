class RAGException(Exception):
    """
    Base Exception
    """
    pass


class EmbeddingException(RAGException):
    """
    Embedding failed.
    """
    pass


class ChunkingException(RAGException):
    """
    Chunking failed.
    """
    pass


class RetrievalException(RAGException):
    """
    Retrieval failed.
    """
    pass


class VectorStoreException(RAGException):
    """
    ChromaDB failed.
    """
    pass
