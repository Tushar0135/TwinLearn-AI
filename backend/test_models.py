from google import genai

from rag.core.config import settings


client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)

print("Available Gemini models:")

for model in client.models.list():
    print(model.name)