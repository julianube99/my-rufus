import json
import os
import time
import re
from dotenv import load_dotenv
from openai import OpenAI

# Cargar variables de entorno
load_dotenv()
openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

# === CONFIGURACIÓN ===
INPUT_JSON = "items_claude_sin_nombres.json"
OUTPUT_JSON = "pictogramas_enriquecidos.json"
LOTE = 5  # cantidad de pictogramas por lote
SLEEP_TIME = 2  # segundos entre llamadas
LOG_FILE = "proceso_enriquecimiento.log"

def setup_logging():
    """Configura el registro de actividad en archivo."""
    import logging
    logging.basicConfig(
        filename=LOG_FILE,
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger('enriquecedor')

def normalizar_nombre(nombre):
    """Normaliza el nombre de un pictograma."""
    if isinstance(nombre, list):
        nombre = nombre[0]  # Tomar el primer nombre si es una lista
    return nombre.split(",")[0].strip()

def generar_etiquetas_lote(nombres: list, logger) -> list:
    """Llama a OpenAI para enriquecer un lote de nombres de alimentos."""
    lista = "\n".join([f"{i+1}. {n}" for i, n in enumerate(nombres)])
    
    prompt = (
        "Genera una descripción detallada y etiquetas para los siguientes alimentos. "
        "Responde en formato JSON como una lista, uno por cada alimento. Cada elemento debe tener los siguientes campos:\n"
        "- nombre\n"
        "- definicion (mínimo 2 oraciones)\n"
        "- categoria (ej: postres, carnes, bebidas, etc.)\n"
        "- subcategoria (ej: para carnes: vacuna, cerdo, etc.)\n"
        "- origen (país o región de origen, si es relevante)\n"
        "- tipo_de_coccion (frito, horneado, a la parrilla, etc.)\n"
        "- ingredientes (lista de ingredientes principales)\n"
        "- forma_de_servir (cómo se sirve típicamente)\n"
        "- equivalentes (otros nombres por los que se conoce)\n\n"
        f"Alimentos:\n{lista}"
    )
    try:
        logger.info(f"Enviando solicitud para lote: {nombres}")
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,  # Aumentado para respuestas más completas
            temperature=0.7   # Reducido para mayor consistencia
        )
        contenido = response.choices[0].message.content.strip()
        
        # Eliminar bloque markdown ```json ... ```
        if contenido.startswith("```"):
            contenido = re.sub(r"^```(?:json)?\n", "", contenido)
            contenido = re.sub(r"\n```$", "", contenido)
        
        # Guardar para debug
        with open("debug_respuesta_lote.txt", "w", encoding="utf-8") as f:
            f.write(contenido)
        
        resultados = json.loads(contenido)
        logger.info(f"Lote procesado correctamente, {len(resultados)} elementos")
        return resultados
    except json.JSONDecodeError as e:
        logger.error(f"Error decodificando JSON: {e}")
        logger.error(f"Contenido problemático: {contenido}")
        return []
    except Exception as e:
        logger.error(f"Error generando lote: {e}")
        return []

def enriquecer_en_lotes(pictogramas, logger):
    """Procesa todos los pictogramas en lotes."""
    enriquecidos = pictogramas.copy()
    total = len(enriquecidos)
    logger.info(f"Iniciando enriquecimiento de {total} pictogramas")
    print(f"📋 Pictogramas totales a enriquecer: {total}")
    
    for i in range(0, total, LOTE):
        lote_actual = enriquecidos[i:i+LOTE]
        nombres_lote = [normalizar_nombre(p["nombre del pictograma"]) for p in lote_actual]
        print(f"\n🔄 Procesando lote {i//LOTE + 1}/{(total+LOTE-1)//LOTE}: {nombres_lote}")
        
        # Intentos máximos en caso de fallo
        intentos = 0
        max_intentos = 3
        resultados = []
        
        while intentos < max_intentos and not resultados:
            if intentos > 0:
                logger.warning(f"Reintentando lote ({intentos}/{max_intentos})")
                print(f"⚠️ Reintentando lote ({intentos}/{max_intentos})")
                time.sleep(SLEEP_TIME * 2)  # Esperar más tiempo en reintentos
                
            resultados = generar_etiquetas_lote(nombres_lote, logger)
            intentos += 1
        
        if not resultados:
            logger.error(f"Lote omitido después de {max_intentos} intentos")
            print("⚠️ Lote omitido por error en la respuesta después de varios intentos.")
            continue
        
        for j, result in enumerate(resultados):
            if j >= len(lote_actual):
                logger.warning("Más resultados que entradas. Saltando extra.")
                print("⚠️ Más resultados que entradas. Saltando extra.")
                continue
                
            picto = lote_actual[j]
            
            # Conservar campos originales
            id_original = picto.get("id del pictograma de ARASAAC")
            nombres_originales = picto.get("nombre del pictograma")
            
            # Agregar enriquecimiento
            for campo, valor in result.items():
                if campo != "nombre":  # No sobrescribir el nombre original
                    picto[campo] = valor
            
            # Restaurar campos originales
            picto["id del pictograma de ARASAAC"] = id_original
            picto["nombre del pictograma"] = nombres_originales
            
            # Guardar progreso parcial cada lote completado
            if (i + LOTE >= total) or ((i + LOTE) % 20 == 0):
                with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
                    json.dump(enriquecidos, f, ensure_ascii=False, indent=2)
                logger.info(f"Guardado progreso: {i + min(LOTE, total-i)}/{total} pictogramas")
                
        print(f"✅ Lote completado: {len(resultados)} pictogramas enriquecidos")
        
        # Esperar entre lotes para no sobrecargar la API
        if i + LOTE < total:
            time.sleep(SLEEP_TIME)
    
    return enriquecidos

def main():
    """Función principal"""
    logger = setup_logging()
    logger.info("=== INICIO DEL PROCESO DE ENRIQUECIMIENTO ===")
    
    try:
        # Cargar pictogramas originales
        print(f"🔍 Cargando archivo de entrada: {INPUT_JSON}")
        with open(INPUT_JSON, "r", encoding="utf-8") as f:
            pictogramas = json.load(f)
        
        # Proceso de enriquecimiento
        base_enriquecida = enriquecer_en_lotes(pictogramas, logger)
        
        # Guardar resultado final
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(base_enriquecida, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Proceso completado. Archivo enriquecido guardado como '{OUTPUT_JSON}'")
        logger.info(f"Proceso completado. Se enriquecieron {len(base_enriquecida)} pictogramas")
    
    except Exception as e:
        logger.error(f"Error en el proceso principal: {e}")
        print(f"\n❌ Error en el proceso: {e}")
    
    logger.info("=== FIN DEL PROCESO DE ENRIQUECIMIENTO ===")

if __name__ == "__main__":
    main()