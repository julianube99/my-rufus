import json
import openai
from pinecone import Pinecone

# Configurar API de OpenAI y Pinecone
INDEX_NAME = "rufusmenu"


# Inicializar OpenAI
openai.api_key = OPENAI_API_KEY

# Inicializar Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

# Leer el archivo JSON
with open("ARASAAC-argentino.json", "r", encoding="utf-8") as file:
    data = json.load(file)

# Función para generar embeddings con OpenAI
def generate_embedding(text):
    response = openai.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding

# **Dividir los datos en lotes de 100**
BATCH_SIZE = 100  # Número de registros por batch
vectors = []
for i, item in enumerate(data):
    print(item)
    text = f"{item['nombre del pictograma de ARASAAC']} - {item['traduccion al argentino del nombre del pictograma de ARASAAC']}"
    vector = generate_embedding(text)

    vectors.append({
        "id": str(item["id del pictograma de ARASAAC"]),
        "values": vector,
        "metadata": {
            "nombre": item["nombre del pictograma de ARASAAC"],
            "traduccion": item["traduccion al argentino del nombre del pictograma de ARASAAC"]
        }
    })

    # **Cada 100 registros, subimos a Pinecone y limpiamos la lista**
    if len(vectors) >= BATCH_SIZE or i == len(data) - 1:
        index.upsert(vectors=vectors, namespace="traducciones")
        print(f"Subidos {len(vectors)} vectores a Pinecone...")
        vectors = []  # Limpiar la lista para el siguiente batch

print("✅ Todos los datos han sido subidos correctamente a Pinecone")
