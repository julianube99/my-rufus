import os
from pinecone import ServerlessSpec
from pinecone import Pinecone
from dotenv import load_dotenv  # Asegúrate de importar load_dotenv


load_dotenv()

INDEX_NAME = "rufusmenu"

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))


pc.create_index(
    name=INDEX_NAME,
    dimension=1536,  # ADA-002 tiene 1536 dimensiones
    metric="cosine",  # Se recomienda "cosine" para embeddings de OpenAI
    spec=ServerlessSpec(
        cloud="aws",  # Digital Ocean no es compatible aquí, usa AWS
        region="us-east-1"
    )
)
