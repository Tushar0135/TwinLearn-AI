from fastapi import FastAPI

from app.api.routes import lecture
from app.api.routes import rag


app = FastAPI(
    title="TwinLearn AI Professor",
    description=(
        "Agentic AI Professor with "
        "Retrieval-Augmented Generation "
        "and Learning Twin."
    ),
    version="1.0.0",
)


# =====================================================
# ROUTES
# =====================================================

app.include_router(
    lecture.router
)

app.include_router(
    rag.router
)


# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():

    return {
        "application": "TwinLearn AI Professor",
        "status": "running",
        "version": "1.0.0",
    }