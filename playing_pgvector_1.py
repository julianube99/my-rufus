import os
from dotenv import load_dotenv
from langchain_community.vectorstores import PGVector
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from pgvector.sqlalchemy import Vector

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

# 📌 Datos de conexión
CONNECTION_STRING = "postgresql+psycopg2://jlocamuz:kala59104@localhost:5432/rufus"
COLLECTION_NAME = "pictograms_with_meanings"  # Nombre correcto de la tabla vectorizada

# 📌 Inicializar los embeddings
embeddings = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))

# 📌 Cargar múltiples PDFs
pdf_files = ['Tortita_(Mendoza).pdf', 'Gastronomía_de_Argentina.pdf']  # Lista de tus PDFs
all_texts = []

for pdf_file in pdf_files:
    loader = PyPDFLoader(pdf_file)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts = text_splitter.split_documents(documents)
    all_texts.extend(texts)  # Agregar los textos del PDF a la lista de textos
    print(f"Procesando archivo: {pdf_file}")

# 📌 Crear los vectores para todos los textos
doc_vectors = embeddings.embed_documents([t.page_content for t in all_texts])

# 📌 Cargar los documentos en PGVector
db = PGVector.from_documents(
    embedding=embeddings,
    documents=all_texts,  # Usar todos los textos de todos los PDFs
    collection_name=COLLECTION_NAME,
    connection_string=CONNECTION_STRING,
)

print(f"Documentos cargados correctamente en la colección {COLLECTION_NAME}.")




