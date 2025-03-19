import os
import openai


api_key=os.getenv("OPENAI_API_KEY")

client = openai.OpenAI(api_key=api_key)

def generar_embedding(texto):
    response = client.embeddings.create(
        input=texto,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

