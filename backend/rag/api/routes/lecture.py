from fastapi import APIRouter

from rag.core.container import ServiceContainer

from rag.models.lecture import LectureDocument

from rag.models.indexing import IndexingResult


router = APIRouter(
    prefix="/api/v1/lectures",
    tags=["Lectures"]
)


@router.post(
    "/index",
    response_model=IndexingResult
)
def index_lecture(
    lecture: LectureDocument
) -> IndexingResult:

    """
    Index a cleaned lecture into ChromaDB.

    Pipeline:

        Lecture
            ↓
        Chunking
            ↓
        Embeddings
            ↓
        ChromaDB
    """

    container = ServiceContainer()

    result = (
        container.indexing_service
        .index_lecture(lecture)
    )

    return result