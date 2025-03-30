import json
import os
from openai import OpenAI
from typing import List, Dict, Any
import time
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.environ.get("PINECONE_API")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
NAMESPACE = "pictogramas_ada_enriquecidos2"
INDEX_NAME = "rufusmenu"
DIMENSION = 1536

pc = Pinecone(api_key=PINECONE_API_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def conectar_a_indice(nombre_indice=None):
    if nombre_indice is None:
        nombre_indice = INDEX_NAME
    try:
        print(f"📋 Conectando al índice existente {nombre_indice}...")
        index = pc.Index(nombre_indice)
        stats = index.describe_index_stats()
        print(f"✅ Conexión exitosa al índice {nombre_indice}")
        print(f"📊 Estadísticas actuales del índice:")
        print(f"    Total de vectores en el índice: {stats['total_vector_count']}")
        if NAMESPACE in stats.get('namespaces', {}):
            print(f"    Vectores en namespace '{NAMESPACE}': {stats['namespaces'][NAMESPACE]['vector_count']}")
        else:
            print(f"    Namespace '{NAMESPACE}' no encontrado o vacío")
        return index
    except Exception as e:
        print(f"❌ Error al conectar con el índice: {str(e)}")
        raise

def generar_embedding(texto: str) -> List[float]:
    response = openai_client.embeddings.create(
        input=texto,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

def construir_texto_enriquecido(p: Dict[str, Any]) -> str:
    nombres = p.get("nombre del pictograma", [])
    if not isinstance(nombres, list):
        nombres = [nombres]
    nombres_str = ", ".join(nombres)

    definicion = p.get("definicion", "")
    ingredientes = ", ".join(p.get("ingredientes", [])) if p.get("ingredientes") else ""
    forma_servir = p.get("forma_de_servir", "")
    origen = p.get("origen", "")
    coccion = p.get("tipo_de_coccion", "")
    categoria = p.get("categoria", "")
    subcategoria = p.get("subcategoria", "")
    equivalentes = ", ".join(p.get("equivalentes", [])) if p.get("equivalentes") else ""

    return (
        f"Nombre del pictograma: {nombres_str}\n"
        f"Definición: {definicion}\n"
        f"Ingredientes: {ingredientes}\n"
        f"Forma de servir: {forma_servir}\n"
        f"Origen: {origen}\n"
        f"Tipo de cocción: {coccion}\n"
        f"Categoría: {categoria}\n"
        f"Subcategoría: {subcategoria}\n"
        f"Equivalentes: {equivalentes}"
    )

def insertar_pictogramas(datos: List[Dict[str, Any]], index):
    vectores = []
    total_pictogramas = len(datos)

    print(f"🚀 Procesando {total_pictogramas} pictogramas para el namespace '{NAMESPACE}'...")
    print("-" * 60)

    for idx, pictograma in enumerate(datos):
        if "id del pictograma de ARASAAC" not in pictograma:
            print(f"⚠️ Pictograma en índice {idx} no tiene ID de ARASAAC. Saltando...")
            continue

        id_pictograma = str(pictograma["id del pictograma de ARASAAC"])
        texto = construir_texto_enriquecido(pictograma)

        print(f"[{idx+1}/{total_pictogramas}] Generando embedding para ID {id_pictograma}")
        embedding = generar_embedding(texto)

        metadata = {
            "id": id_pictograma,
            "nombre del pictograma": ", ".join(pictograma.get("nombre del pictograma", [])) if isinstance(pictograma.get("nombre del pictograma"), list) else str(pictograma.get("nombre del pictograma", ""))
        }

        campos_extra = ["definicion", "categoria", "subcategoria", "origen", "tipo_de_coccion", "forma_de_servir"]
        for campo in campos_extra:
            valor = pictograma.get(campo)
            if valor is not None:
                metadata[campo] = str(valor)

        for campo_lista in ["ingredientes", "equivalentes"]:
            valor = pictograma.get(campo_lista)
            if isinstance(valor, list):
                lista_limpia = [str(v) for v in valor if isinstance(v, str)]
                if lista_limpia:
                    metadata[campo_lista] = lista_limpia

        vectores.append({
            "id": id_pictograma,
            "values": embedding,
            "metadata": metadata
        })

        if len(vectores) >= 30:
            print(f"🔄 Insertando lote de 30 vectores...")
            index.upsert(vectors=vectores, namespace=NAMESPACE)
            vectores = []

    if vectores:
        print(f"🔄 Insertando lote final de {len(vectores)} vectores...")
        index.upsert(vectors=vectores, namespace=NAMESPACE)

    print("🎉 Inserción finalizada.")

# Resto del código no necesita cambios

def buscar_pictograma(consulta: str, index_name=None, top_k: int = 5):
    """
    Busca pictogramas que coincidan semánticamente con la consulta.
    Búsqueda limitada al namespace 'pictogramas_ada'.
    """
    print(f"🔍 Buscando coincidencias para: '{consulta}' en namespace '{NAMESPACE}'")
    
    # Determinar el índice a usar
    if index_name is None:
        index = conectar_a_indice(INDEX_NAME)
    elif isinstance(index_name, str):
        index = conectar_a_indice(index_name)
    else:
        index = index_name
    
    if index is None:
        print("❌ No se pudo conectar al índice.")
        return []
    
    consulta_enriquecida = f"Plato o postre gastronómico: {consulta}. Buscar equivalentes y similares."
    print(f"🔍 Consulta enriquecida: '{consulta_enriquecida}'")
    
    inicio_tiempo = time.time()
    embedding_consulta = generar_embedding(consulta_enriquecida)
    tiempo_embedding = time.time() - inicio_tiempo
    print(f"✓ Embedding de consulta generado en {tiempo_embedding:.2f} segundos")
    
    inicio_tiempo = time.time()
    resultados = index.query(
        vector=embedding_consulta,
        top_k=top_k,
        include_metadata=True,
        namespace=NAMESPACE
    )
    tiempo_busqueda = time.time() - inicio_tiempo
    print(f"✓ Búsqueda completada en {tiempo_busqueda:.2f} segundos en namespace '{NAMESPACE}'")
    
    pictogramas_encontrados = []
    ids_unicos = set()
    
    print(f"📋 Encontrados {len(resultados['matches'])} coincidencias (antes de eliminar duplicados)")
    
    for match in resultados["matches"]:
        id_original = match["metadata"]["id"]
        
        if id_original in ids_unicos:
            continue
        ids_unicos.add(id_original)
        
        pictograma_info = {
            "id del pictograma de ARASAAC": int(id_original),
            "score": match["score"]
        }
        
        # ✅ Agregamos explícitamente los metadatos que estamos usando
        for campo in ["nombre del pictograma", "definicion", "categoria", "subcategoria", "equivalentes"]:
            if campo in match["metadata"]:
                pictograma_info[campo] = match["metadata"][campo]
        
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
        
        # Mostrar nombre del pictograma
        if "nombre del pictograma" in resultado:
            print(f"   Nombre(s): {resultado['nombre del pictograma']}")
        
        # Mostrar definición
        if "definicion" in resultado:
            print(f"   Definición: {resultado['definicion']}")
        
        # Mostrar categoría y subcategoría si existen
        if "categoria" in resultado and resultado["categoria"]:
            print(f"   Categoría: {resultado['categoria']}")
        if "subcategoria" in resultado and resultado["subcategoria"]:
            print(f"   Subcategoría: {resultado['subcategoria']}")
        
        # Mostrar equivalentes si hay
        if "equivalentes" in resultado and resultado["equivalentes"]:
            if isinstance(resultado["equivalentes"], list):
                equivalentes_str = ", ".join(resultado["equivalentes"])
            else:
                equivalentes_str = resultado["equivalentes"]
            print(f"   Equivalentes: {equivalentes_str}")
        
        # Mostrar score
        print(f"   Score: {resultado['score']:.4f}")
        print(f"Nombre(s): {resultado['nombre del pictograma']}")
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