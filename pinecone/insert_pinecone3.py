import json
import os
from openai import OpenAI
from typing import List, Dict, Any
import time
from pinecone import Pinecone

# Configuración de credenciales (recomendado usar variables de entorno)
PINECONE_API_KEY = os.environ.get("PINECONE_API")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
NAMESPACE = "pictogramas_ada"  # Namespace específico para los pictogramas

# Usar el índice existente
INDEX_NAME = "rufusmenu"
DIMENSION = 1536  # Dimensión para embeddings de OpenAI

# Inicializar clientes con la nueva API de Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def conectar_a_indice(nombre_indice=None):
    """Conecta al índice existente en Pinecone."""
    if nombre_indice is None:
        nombre_indice = INDEX_NAME
        
    try:
        # Verificar que el índice existe
        if nombre_indice not in pc.list_indexes().names():
            print(f"⚠️ El índice {nombre_indice} no existe. Por favor, verifica el nombre.")
            return None
            
        print(f"📋 Conectando al índice existente {nombre_indice}...")
        index = pc.Index(nombre_indice)
        
        # Verificar conexión y mostrar estadísticas
        stats = index.describe_index_stats()
        print(f"✅ Conexión exitosa al índice {nombre_indice}")
        print(f"📊 Estadísticas actuales del índice:")
        print(f"    Total de vectores en el índice: {stats['total_vector_count']}")
        
        # Verificar si el namespace específico existe
        if NAMESPACE in stats.get('namespaces', {}):
            print(f"    Vectores en namespace '{NAMESPACE}': {stats['namespaces'][NAMESPACE]['vector_count']}")
        else:
            print(f"    Namespace '{NAMESPACE}' no encontrado o vacío")
        
        return index
    except Exception as e:
        print(f"❌ Error al conectar con el índice: {str(e)}")
        raise

def generar_embedding(texto: str) -> List[float]:
    """Genera un embedding usando el modelo de OpenAI."""
    response = openai_client.embeddings.create(
        input=texto,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

def insertar_pictogramas(datos: List[Dict[str, Any]], index):
    """Inserta pictogramas en el índice dentro del namespace especificado."""
    vectores = []
    total_pictogramas = len(datos)
    
    print(f"🚀 Iniciando procesamiento de {total_pictogramas} pictogramas para el namespace '{NAMESPACE}'...")
    print("-" * 60)
    
    inicio_tiempo_total = time.time()
    count_vectores = 0
    
    for idx, pictograma in enumerate(datos):
        # Verificar si el pictograma tiene ID
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
        texto_completo = f"Pictograma: {', '.join(pictograma['nombre del pictograma'])}"
        if pictograma.get("definicion"):
            texto_completo += f". {pictograma['definicion']}"
        
        print(f"    Texto para embedding: {texto_completo[:80]}...")
        
        inicio_tiempo = time.time()
        embedding = generar_embedding(texto_completo)
        tiempo_embedding = time.time() - inicio_tiempo
        
        # Metadatos para el vector
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
        
        # También vectorizar cada nombre alternativo individualmente
        nombres = pictograma["nombre del pictograma"]
        print(f"    Generando {len(nombres)} embeddings adicionales para nombres alternativos...")
        
        for i, nombre in enumerate(nombres):
            nombre_id = f"{id_pictograma}_nombre_{i}"
            embedding_nombre = generar_embedding(nombre)
            
            vectores.append({
                "id": nombre_id,
                "values": embedding_nombre,
                "metadata": metadata
            })
            count_vectores += 1
            
            print(f"        ✓ Embedding para '{nombre}' generado")
        
        print(f"    Total: {len(nombres) + 1} embeddings generados para pictograma ID {id_pictograma}")
        print("-" * 60)
        
        # Insertar en lotes de 100 si alcanzamos el tamaño del lote
        if len(vectores) >= 100:
            batch = vectores[:100]
            vectores = vectores[100:]
            
            print(f"🔄 Insertando lote de {len(batch)} vectores en namespace '{NAMESPACE}'...")
            inicio_tiempo = time.time()
            
            # Insertar en el namespace específico
            index.upsert(
                vectors=batch,
                namespace=NAMESPACE
            )
            
            tiempo_insercion = time.time() - inicio_tiempo
            print(f"✅ Lote insertado en {tiempo_insercion:.2f} segundos")
            print("-" * 60)
    
    # Insertar vectores restantes (si hay menos de 100)
    if vectores:
        print(f"🔄 Insertando lote final de {len(vectores)} vectores en namespace '{NAMESPACE}'...")
        inicio_tiempo = time.time()
        
        # Insertar en el namespace específico
        index.upsert(
            vectors=vectores,
            namespace=NAMESPACE
        )
        
        tiempo_insercion = time.time() - inicio_tiempo
        print(f"✅ Lote final insertado en {tiempo_insercion:.2f} segundos")
    
    tiempo_total = time.time() - inicio_tiempo_total
    print("-" * 60)
    print(f"🎉 Proceso completado en {tiempo_total:.2f} segundos")
    print(f"🔢 Total de vectores generados e insertados en namespace '{NAMESPACE}': {count_vectores}")
    
    # Obtener estadísticas actualizadas del índice
    stats = index.describe_index_stats()
    if NAMESPACE in stats.get('namespaces', {}):
        print(f"📊 Vectores actuales en namespace '{NAMESPACE}': {stats['namespaces'][NAMESPACE]['vector_count']}")

def buscar_pictograma(consulta: str, index_name=None, top_k: int = 5):
    """
    Busca pictogramas que coincidan semánticamente con la consulta.
    Búsqueda limitada al namespace 'pictogramas_ada'.
    """
    print(f"🔍 Buscando coincidencias para: '{consulta}' en namespace '{NAMESPACE}'")
    
    # Determinar el índice a usar
    if index_name is None:
        # Usar el índice global
        index = conectar_a_indice(INDEX_NAME)
    elif isinstance(index_name, str):
        # Es el nombre de un índice, necesitamos conectarnos
        index = conectar_a_indice(index_name)
    else:
        # Asumimos que ya es un objeto índice
        index = index_name
    
    if index is None:
        print("❌ No se pudo conectar al índice.")
        return []
    
    # Enriquecer la consulta con contexto gastronómico
    consulta_enriquecida = f"Plato o postre gastronómico: {consulta}. Buscar equivalentes y similares."
    print(f"🔍 Consulta enriquecida: '{consulta_enriquecida}'")
    
    # Generar embedding para la consulta
    inicio_tiempo = time.time()
    embedding_consulta = generar_embedding(consulta_enriquecida)
    tiempo_embedding = time.time() - inicio_tiempo
    print(f"✓ Embedding de consulta generado en {tiempo_embedding:.2f} segundos")
    
    # Realizar búsqueda en Pinecone - en el namespace específico
    inicio_tiempo = time.time()
    resultados = index.query(
        vector=embedding_consulta,
        top_k=top_k,
        include_metadata=True,
        namespace=NAMESPACE  # Especificar el namespace para la búsqueda
    )
    tiempo_busqueda = time.time() - inicio_tiempo
    print(f"✓ Búsqueda completada en {tiempo_busqueda:.2f} segundos en namespace '{NAMESPACE}'")
    
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
        
        # Incluir toda la información disponible en los metadatos
        pictograma_info = {
            "id del pictograma de ARASAAC": int(id_original),
            "score": match["score"]  # Puntuación de similitud (0-1)
        }
        
        # Añadir campos de metadatos si existen
        for campo in ["nombres", "definicion", "categoria", "subcategoria", "equivalentes"]:
            if campo in match["metadata"]:
                pictograma_info[campo] = match["metadata"][campo]
        
        # Mantener compatibilidad con "nombre del pictograma"
        if "nombres" in pictograma_info and "nombre del pictograma" not in pictograma_info:
            pictograma_info["nombre del pictograma"] = pictograma_info["nombres"]
        
        pictogramas_encontrados.append(pictograma_info)
    
    print(f"✅ Resultados únicos encontrados: {len(pictogramas_encontrados)}")
    return pictogramas_encontrados

def mostrar_resultados(resultados):
    """Muestra los resultados de forma amigable"""
    if not resultados:
        print("❌ No se encontraron resultados.")
        return
        
    print("\n📊 RESULTADOS:")
    print("-" * 60)
    
    for i, resultado in enumerate(resultados):
        print(f"{i+1}. ID: {resultado['id del pictograma de ARASAAC']}")
        
        if "nombre del pictograma" in resultado:
            if isinstance(resultado["nombre del pictograma"], list):
                print(f"   Nombres: {', '.join(resultado['nombre del pictograma'])}")
            else:
                print(f"   Nombre: {resultado['nombre del pictograma']}")
                
        if "definicion" in resultado:
            print(f"   Definición: {resultado['definicion']}")
            
        for campo in ["categoria", "subcategoria", "equivalentes"]:
            if campo in resultado and resultado[campo]:
                print(f"   {campo.capitalize()}: {resultado[campo]}")
                
        print(f"   Score: {resultado['score']:.4f}")
        print("-" * 40)

def cargar_datos(ruta_archivo):
    """Carga datos desde un archivo JSON."""
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as f:
            datos = json.load(f)
        print(f"📂 Archivo {ruta_archivo} cargado correctamente")
        print(f"📋 Total de pictogramas encontrados: {len(datos)}")
        return datos
    except Exception as e:
        print(f"❌ Error al cargar el archivo: {str(e)}")
        return []

def main():
    try:
        # Conectar al índice
        index = conectar_a_indice()
        if index is None:
            return
        
        # Menú de opciones
        while True:
            print("\n" + "=" * 50)
            print(f"MENÚ DE OPCIONES (Namespace: {NAMESPACE}):")
            print("1. Cargar e insertar pictogramas desde JSON")
            print("2. Buscar pictogramas")
            print("3. Salir")
            opcion = input("Seleccione una opción (1-3): ")
            
            if opcion == "1":
                ruta_archivo = input("Ingrese la ruta del archivo JSON: ")
                datos = cargar_datos(ruta_archivo)
                if datos:
                    insertar_pictogramas(datos, index)
            elif opcion == "2":
                consulta = input("\n🔍 Ingrese consulta: ")
                resultados = buscar_pictograma(consulta, index)
                mostrar_resultados(resultados)
            elif opcion == "3":
                print("¡Hasta pronto!")
                break
            else:
                print("Opción no válida, por favor intente de nuevo.")
                
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main()