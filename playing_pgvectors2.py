import os
from dotenv import load_dotenv
from langchain_community.vectorstores import PGVector
from langchain_community.embeddings import OpenAIEmbeddings

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

# 📌 Datos de conexión
CONNECTION_STRING = "postgresql+psycopg2://jlocamuz:kala59104@localhost:5432/rufus"
COLLECTION_NAME = "pictograms_with_meanings"  # Nombre correcto de la tabla vectorizada

# 📌 Inicializar los embeddings
embeddings = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))

def search_similar_documents(query, k=5):
    """Buscar documentos similares en la base de datos utilizando una consulta."""
    # Instanciar PGVector para conectarse a la base de datos con la función de embeddings
    db = PGVector(
        embedding_function=embeddings,  # Pasamos la función de embeddings
        connection_string=CONNECTION_STRING,
        collection_name=COLLECTION_NAME
    )
    
    # Realizar la búsqueda de documentos similares
    similar = db.similarity_search_with_score(query, k=k)
    
    # Retornar los documentos similares encontrados
    return similar

# Función principal para realizar la consulta
def main():
    query = "que son las facturas en argentina"  # Consulta de ejemplo
    similar_documents = search_similar_documents(query)
    
    # Mostrar los documentos similares encontrados
    for doc in similar_documents:
        print(doc, end="\n\n")
    
    return similar_documents

if __name__ == "__main__":
    response = main()
    print(f"Documentos similares encontrados: {len(response)}")
