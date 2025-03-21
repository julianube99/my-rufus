import json
import os
from openai import OpenAI
from typing import List, Dict, Any
import time
from pinecone import Pinecone

# Configuración de credenciales (recomendado usar variables de entorno)
PINECONE_API_KEY = os.environ.get("PINECONE_API")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Usar el índice existente
INDEX_NAME = "rufusmenu"
DIMENSION = 1536  # Dimensión para embeddings de OpenAI (3-small)

# Nombre del archivo JSON
ARCHIVO_JSON = "items_claude_sin_nombres.json"

# Inicializar clientes con la nueva API de Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def conectar_a_indice():
    """Conecta al índice existente en Pinecone."""
    try:
        # Verificar que el índice existe
        if INDEX_NAME not in pc.list_indexes().names():
            print(f"⚠️ El índice {INDEX_NAME} no existe. Por favor, verifica el nombre.")
            return None
            
        print(f"📋 Conectando al índice existente {INDEX_NAME}...")
        index = pc.Index(INDEX_NAME)
        
        # Verificar que el índice está vacío (para confirmar conexión)
        stats = index.describe_index_stats()
        print(f"✅ Conexión exitosa al índice {INDEX_NAME}")
        print(f"📊 Estadísticas actuales del índice:")
        print(f"    Total de vectores en el índice: {stats['total_vector_count']}")
        
        return index
    except Exception as e:
        print(f"❌ Error al conectar con el índice: {str(e)}")
        raise

def generar_embedding(texto: str) -> List[float]:
    """Genera un embedding usando el modelo de OpenAI."""
    response = openai_client.embeddings.create(
        input=texto,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def preparar_texto_para_embedding(pictograma: Dict[str, Any]) -> str:
    """
    Prepara un texto enriquecido para generar un embedding más informativo.
    Combina nombres alternativos y definición si existe.
    """
    # Verificar si 'nombre del pictograma' está presente y es una lista
    if "nombre del pictograma" in pictograma and isinstance(pictograma["nombre del pictograma"], list):
        nombres = ", ".join(pictograma["nombre del pictograma"])
    else:
        # Si no está presente o no es una lista, usar un valor por defecto
        nombres = f"Pictograma ID {pictograma.get('id del pictograma de ARASAAC', 'desconocido')}"
        
        # Intentar crear lista de nombres si no existe
        if "nombre del pictograma" not in pictograma:
            pictograma["nombre del pictograma"] = [nombres]
    
    definicion = pictograma.get("definicion", "")
    
    # Crear un texto descriptivo completo
    texto = f"Pictograma de: {nombres}."
    if definicion:
        texto += f" Definición: {definicion}."
        
    return texto

def vectorizar_e_insertar_pictogramas(datos: List[Dict[str, Any]], index):
    """Vectoriza todos los pictogramas y los inserta en Pinecone."""
    vectores = []
    total_pictogramas = len(datos)
    
    print(f"🚀 Iniciando procesamiento de {total_pictogramas} pictogramas...")
    print("-" * 60)
    
    inicio_tiempo_total = time.time()
    count_vectores = 0
    
    for idx, pictograma in enumerate(datos):
        # Verificar si el pictograma tiene el formato esperado
        if "id del pictograma de ARASAAC" not in pictograma:
            print(f"⚠️ Pictograma en índice {idx} no tiene ID de ARASAAC. Saltando...")
            continue
            
        id_pictograma = str(pictograma["id del pictograma de ARASAAC"])
        
        # Asegurarse de que "nombre del pictograma" sea una lista
        if "nombre del pictograma" not in pictograma:
            pictograma["nombre del pictograma"] = [f"Pictograma {id_pictograma}"]
        elif not isinstance(pictograma["nombre del pictograma"], list):
            pictograma["nombre del pictograma"] = [str(pictograma["nombre del pictograma"])]
        
        print(f"[{idx+1}/{total_pictogramas}] Procesando pictograma ID: {id_pictograma}")
        print(f"    Nombres: {', '.join(pictograma['nombre del pictograma'])}")
        
        # Preparar texto para el embedding principal
        texto_completo = preparar_texto_para_embedding(pictograma)
        print(f"    Texto para embedding: {texto_completo[:50]}...")
        
        inicio_tiempo = time.time()
        embedding = generar_embedding(texto_completo)
        tiempo_embedding = time.time() - inicio_tiempo
        
        # Metadatos: almacenar información útil para recuperar después
        metadata = {
            "id": id_pictograma,
            "nombres": pictograma["nombre del pictograma"],
            "definicion": pictograma.get("definicion", "")
        }
        
        # Agregar a la lista de vectores
        vectores.append({
            "id": id_pictograma,
            "values": embedding,
            "metadata": metadata
        })
        count_vectores += 1
        
        print(f"    ✓ Embedding principal generado en {tiempo_embedding:.2f} segundos")
        
        # También vectorizar cada nombre alternativo individualmente para mayor precisión
        nombres = pictograma["nombre del pictograma"]
        print(f"    Generando {len(nombres)} embeddings adicionales para nombres alternativos...")
        
        for i, nombre in enumerate(nombres):
            nombre_id = f"{id_pictograma}_nombre_{i}"
            inicio_tiempo = time.time()
            embedding_nombre = generar_embedding(nombre)
            tiempo_embedding = time.time() - inicio_tiempo
            
            vectores.append({
                "id": nombre_id,
                "values": embedding_nombre,
                "metadata": metadata
            })
            count_vectores += 1
            
            print(f"        ✓ Embedding para '{nombre}' generado en {tiempo_embedding:.2f} segundos")
        
        print(f"    Total: {len(nombres) + 1} embeddings generados para pictograma ID {id_pictograma}")
        print("-" * 60)
        
        # Insertar en lotes de 100 si alcanzamos el tamaño del lote
        if len(vectores) >= 100:
            batch = vectores[:100]
            vectores = vectores[100:]
            
            print(f"🔄 Insertando lote de {len(batch)} vectores en Pinecone...")
            inicio_tiempo = time.time()
            index.upsert(vectors=batch)
            tiempo_insercion = time.time() - inicio_tiempo
            print(f"✅ Lote insertado en {tiempo_insercion:.2f} segundos")
            print("-" * 60)
    
    # Insertar vectores restantes (si hay menos de 100)
    if vectores:
        print(f"🔄 Insertando lote final de {len(vectores)} vectores en Pinecone...")
        inicio_tiempo = time.time()
        index.upsert(vectors=vectores)
        tiempo_insercion = time.time() - inicio_tiempo
        print(f"✅ Lote final insertado en {tiempo_insercion:.2f} segundos")
    
    tiempo_total = time.time() - inicio_tiempo_total
    print("-" * 60)
    print(f"🎉 Proceso completado en {tiempo_total:.2f} segundos")
    print(f"🔢 Total de vectores generados e insertados: {count_vectores}")
    
    # Obtener estadísticas del índice
    stats = index.describe_index_stats()
    print(f"📊 Estadísticas finales del índice:")
    print(f"    Total de vectores en el índice: {stats['total_vector_count']}")
    print(f"    Dimensión de los vectores: {stats['dimension']}")

def buscar_pictograma(consulta: str, index, top_k: int = 3):
    """
    Busca pictogramas que coincidan semánticamente con la consulta.
    Devuelve los top_k resultados más relevantes.
    """
    print(f"🔍 Buscando coincidencias para: '{consulta}'")
    
    # Generar embedding para la consulta
    inicio_tiempo = time.time()
    embedding_consulta = generar_embedding(consulta)
    tiempo_embedding = time.time() - inicio_tiempo
    print(f"✓ Embedding de consulta generado en {tiempo_embedding:.2f} segundos")
    
    # Realizar búsqueda en Pinecone
    inicio_tiempo = time.time()
    resultados = index.query(
        vector=embedding_consulta,
        top_k=top_k,
        include_metadata=True
    )
    tiempo_busqueda = time.time() - inicio_tiempo
    print(f"✓ Búsqueda completada en {tiempo_busqueda:.2f} segundos")
    
    # Procesar y devolver resultados
    pictogramas_encontrados = []
    ids_unicos = set()  # Para evitar duplicados
    
    print(f"📋 Encontrados {len(resultados['matches'])} coincidencias (antes de eliminar duplicados)")
    
    for match in resultados["matches"]:
        id_original = match["metadata"]["id"]
        
        # Evitar duplicados (diferentes nombres del mismo pictograma)
        if id_original in ids_unicos:
            continue
            
        ids_unicos.add(id_original)
        
        pictogramas_encontrados.append({
            "id del pictograma de ARASAAC": int(id_original),
            "nombre del pictograma": match["metadata"]["nombres"],
            "definicion": match["metadata"]["definicion"],
            "score": match["score"]  # Puntuación de similitud (0-1)
        })
    
    print(f"✅ Resultados únicos encontrados: {len(pictogramas_encontrados)}")
    return pictogramas_encontrados

def main():
    print("=" * 80)
    print("SISTEMA DE VECTORIZACIÓN E INDEXACIÓN DE PICTOGRAMAS ARASAAC")
    print("=" * 80)
    
    # Cargar datos desde un archivo JSON
    try:
        with open(ARCHIVO_JSON, 'r', encoding='utf-8') as f:
            datos_pictogramas = json.load(f)
        print(f"📂 Archivo {ARCHIVO_JSON} cargado correctamente")
        print(f"📋 Total de pictogramas encontrados: {len(datos_pictogramas)}")
    except Exception as e:
        print(f"❌ Error al cargar el archivo: {str(e)}")
        return
    
    # Conectar al índice existente
    try:
        index = conectar_a_indice()
        if index is None:
            return
    except Exception as e:
        print(f"❌ Error al conectar con Pinecone: {str(e)}")
        return
    
    # Vectorizar e insertar pictogramas
    try:
        vectorizar_e_insertar_pictogramas(datos_pictogramas, index)
    except Exception as e:
        print(f"❌ Error durante la vectorización: {str(e)}")
        return
    
    # Ejemplo de búsqueda
    try:
        print("\n" + "=" * 80)
        print("PRUEBA DE BÚSQUEDA")
        print("=" * 80)
        
        consulta = "lingote húmedo de chocolate"
        resultados = buscar_pictograma(consulta, index)
        
        print("\n📊 RESULTADOS PARA CONSULTA: " + consulta)
        print("-" * 60)
        
        for i, resultado in enumerate(resultados):
            print(f"{i+1}. ID: {resultado['id del pictograma de ARASAAC']}")
            print(f"   Nombres: {', '.join(resultado['nombre del pictograma'])}")
            print(f"   Score: {resultado['score']:.4f}")
            print("-" * 40)
    except Exception as e:
        print(f"❌ Error durante la búsqueda: {str(e)}")

if __name__ == "__main__":
    main()