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
INPUT_JSON = "pictogramas_adicionales.json"
OUTPUT_JSON = "pictogramas_enriquecidos2.json"
LOTE = 5
SLEEP_TIME = 2
LOG_FILE = "proceso_enriquecimiento.log"

def setup_logging():
    import logging
    logging.basicConfig(
        filename=LOG_FILE,
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger('enriquecedor')

def normalizar_nombre(nombre):
    if isinstance(nombre, list):
        nombre = nombre[0]
    return nombre.split(",")[0].strip()

def generar_etiquetas_lote(nombres: list, logger) -> list:
    lista = "\n".join([f"{i+1}. {n}" for i, n in enumerate(nombres)])
    
    prompt = (
        "Genera una descripción detallada y etiquetas para los siguientes alimentos. "
        "Responde en formato JSON como una lista. Cada elemento debe tener los siguientes campos:\n"
        "- nombre\n"
        "- definicion\n"
        "- categoria\n"
        "- subcategoria\n"
        "- origen\n"
        "- tipo_de_coccion\n"
        "- ingredientes (lista)\n"
        "- forma_de_servir\n"
        "- equivalentes (lista)\n\n"
        f"Alimentos:\n{lista}"
    )
    try:
        logger.info(f"Solicitando enriquecimiento para: {nombres}")
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.7
        )
        contenido = response.choices[0].message.content.strip()
        if contenido.startswith("```"):
            contenido = re.sub(r"^```(?:json)?\n", "", contenido)
            contenido = re.sub(r"\n```$", "", contenido)
        
        with open("debug_respuesta_lote.txt", "w", encoding="utf-8") as f:
            f.write(contenido)

        return json.loads(contenido)
    except Exception as e:
        logger.error(f"Error generando lote: {e}")
        return []

def enriquecer_en_lotes(pictogramas, logger, existentes):
    enriquecidos = existentes.copy()
    ids_existentes = {p["id del pictograma de ARASAAC"] for p in existentes}
    nuevos = [p for p in pictogramas if p["id del pictograma de ARASAAC"] not in ids_existentes]
    
    print(f"📋 Pictogramas NUEVOS a enriquecer: {len(nuevos)}")
    
    for i in range(0, len(nuevos), LOTE):
        lote_actual = nuevos[i:i+LOTE]
        nombres_lote = [normalizar_nombre(p["nombre del pictograma"]) for p in lote_actual]
        print(f"\n🔄 Procesando lote {i//LOTE + 1}: {nombres_lote}")

        resultados = generar_etiquetas_lote(nombres_lote, logger)

        if not resultados:
            print("⚠️ Lote omitido por error en la respuesta.")
            continue

        for j, result in enumerate(resultados):
            if j >= len(lote_actual):
                continue
            picto = lote_actual[j]
            for campo, valor in result.items():
                if campo != "nombre":
                    picto[campo] = valor
            enriquecidos.append(picto)
        
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(enriquecidos, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Lote {i//LOTE + 1} enriquecido y guardado")
        time.sleep(SLEEP_TIME)

    return enriquecidos

def main():
    logger = setup_logging()
    logger.info("=== INICIO DEL PROCESO DE ENRIQUECIMIENTO ===")
    
    try:
        print(f"🔍 Cargando archivo de entrada: {INPUT_JSON}")
        with open(INPUT_JSON, "r", encoding="utf-8") as f:
            nuevos_pictogramas = json.load(f)

        if os.path.exists(OUTPUT_JSON):
            with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
                existentes = json.load(f)
        else:
            existentes = []

        base_final = enriquecer_en_lotes(nuevos_pictogramas, logger, existentes)

        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(base_final, f, ensure_ascii=False, indent=2)

        print(f"\n✅ Archivo actualizado: {OUTPUT_JSON}")
        logger.info(f"Archivo enriquecido actualizado: {len(base_final)} pictogramas")
    
    except Exception as e:
        logger.error(f"❌ Error en el proceso principal: {e}")
        print(f"\n❌ Error: {e}")

    logger.info("=== FIN DEL PROCESO DE ENRIQUECIMIENTO ===")

if __name__ == "__main__":
    main()
