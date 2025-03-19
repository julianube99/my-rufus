import json
from insert_function import generar_embedding  # Función que genera embeddings con OpenAI
from pinecone import Pinecone
import os

INDEX_NAME = "traducciones"

# Inicializar Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(INDEX_NAME)

def buscar_pictograma(query, top_k=1):
    """
    Realiza una búsqueda en Pinecone a partir de una consulta de texto.

    Parámetros:
        query (str): La palabra o frase a buscar.
        top_k (int): Número de resultados similares a devolver.

    Retorna:
        Lista con los registros más similares.
    """
    # Generar embedding de la consulta
    query_vector = generar_embedding(query)

    # Buscar en Pinecone
    resultado = index.query(
        vector=query_vector,
        top_k=top_k,
        include_values=False,  # No necesitamos el vector, solo los metadatos
        include_metadata=True
    )

    # Mostrar el mejor resultado
    if resultado.matches:
        for match in resultado.matches:
            print(f"🔍 Resultado encontrado:")
            print(f"📌 ID: {match.id}")
            print(f"📝 Palabra en ARASAAC: {match.metadata['palabra_arasaac']}")
            print(f"🇦🇷 Traducción al argentino: {', '.join(match.metadata['traducciones_argentinas'])}")
            print("-" * 50)
    else:
        print("❌ No se encontraron coincidencias.")

# 🔹 Prueba de búsqueda
buscar_pictograma("roll", top_k=3)  # Debe devolver "cerveza, birra, chela"
