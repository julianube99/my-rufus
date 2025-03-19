import json
from insert_function import generar_embedding  # Función que genera embeddings con OpenAI
from pinecone import Pinecone
import os

INDEX_NAME = "rufusmenu"
NAMESPACE = "traducciones"
BATCH_SIZE = 100  # Subimos en lotes de 100 para eficiencia

# Inicializar Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(INDEX_NAME)

# Cargar JSON (cambia la ruta a tu archivo JSON)
with open("./MENU_GASTRONOMICO_CORRECTO.json", "r", encoding="utf-8") as file:
    datos = json.load(file)

vector_data = []
errores = []  # Lista para almacenar registros con errores

# Función para generar texto enriquecido basado en la estructura simplificada
def generar_texto_enriquecido(item):
    # Manejo de listas para palabra_arasaac
    palabra_arasaac = item["nombre del pictograma de ARASAAC"]
    if isinstance(palabra_arasaac, list):
        palabra_arasaac_str = ", ".join(palabra_arasaac)
    else:
        palabra_arasaac_str = palabra_arasaac
        
    # Manejo de listas para traducciones
    traducciones_argentinas = item["traduccion al argentino del nombre del pictograma de ARASAAC"]
    if isinstance(traducciones_argentinas, list):
        traducciones_str = ", ".join(traducciones_argentinas)
    else:
        traducciones_str = traducciones_argentinas
    
    # Crear texto enriquecido simplificado
    texto = f"""
Pictograma ARASAAC: {palabra_arasaac_str}
Traducción argentina: {traducciones_str}
Búsqueda relacionada: {palabra_arasaac_str}, {traducciones_str}
"""
    return texto.strip()

for item in datos:
    try:
        palabra_arasaac = item["nombre del pictograma de ARASAAC"]
        traducciones_argentinas = item["traduccion al argentino del nombre del pictograma de ARASAAC"]
        
        # Convertir listas a strings para palabras y traducciones
        palabra_arasaac_str = ", ".join(palabra_arasaac) if isinstance(palabra_arasaac, list) else palabra_arasaac
        traducciones_str = ", ".join(traducciones_argentinas) if isinstance(traducciones_argentinas, list) else traducciones_argentinas
        
        # Generar texto enriquecido para el embedding
        texto_embedding = generar_texto_enriquecido(item)
        
        print(f"TEXTO EMBEDDING PARA ID {item['id del pictograma de ARASAAC']}:")
        print(texto_embedding)
        print("-" * 50)
        
        # Generar embedding con el texto enriquecido
        vector = generar_embedding(texto_embedding)
        
        # Preparar metadata con strings en lugar de listas
        metadata = {
            "palabra_arasaac": palabra_arasaac_str,
            "traducciones_argentinas": traducciones_str,
            "contexto": "gastronomía argentina"
        }
        
        # Agregar vector a la lista de vectores a subir
        vector_data.append({
            "id": str(item["id del pictograma de ARASAAC"]),
            "values": vector,
            "metadata": metadata
        })

        # Subir en lotes de 100
        if len(vector_data) >= BATCH_SIZE:
            index.upsert(vectors=vector_data, namespace=NAMESPACE)
            print(f"✅ Subidos {len(vector_data)} registros a Pinecone.")
            vector_data = []  # Vaciar la lista para el siguiente lote

    except KeyError as e:
        error_msg = f"⚠️ Clave faltante en el registro {item}. Error: {e}"
        print(error_msg)
        errores.append({"registro": item, "error": str(e)})
    except Exception as e:
        error_msg = f"⚠️ Error inesperado en el registro {item}. Error: {e}"
        print(error_msg)
        errores.append({"registro": item, "error": str(e)})

# Subir los últimos registros que quedaron en la lista (menores a BATCH_SIZE)
if vector_data:
    index.upsert(vectors=vector_data, namespace=NAMESPACE)
    print(f"✅ Subidos {len(vector_data)} registros finales a Pinecone.")

# Guardar los errores en un archivo JSON para analizarlos después
if errores:
    with open("errores.json", "w", encoding="utf-8") as error_file:
        json.dump(errores, error_file, indent=4, ensure_ascii=False)
    print(f"⚠️ Se encontraron {len(errores)} errores. Guardados en 'errores.json'.")

print("🎉 Todos los datos fueron subidos con éxito.")