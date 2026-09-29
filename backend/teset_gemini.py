from google import genai

from rag.core.config import settings


client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)

print("Model:", settings.GEMINI_MODEL)

try:
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents="Explain CNN in one simple sentence."
    )

    print("SUCCESS")
    print(response.text)

except Exception as e:
    print("FAILED")
    print(type(e).__name__)
    print(e)