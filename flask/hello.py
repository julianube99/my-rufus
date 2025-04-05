import json
import os
from openai import OpenAI
from typing import List, Dict, Any
import time
from pinecone import Pinecone
from dotenv import load_dotenv
from flask import Flask, request, jsonify

load_dotenv()

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
NAMESPACE = "pictogramas_ada_enriquecidos2"
INDEX_NAME = "rufusmenu"
DIMENSION = 1536

pc = Pinecone(api_key=PINECONE_API_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

app = Flask(__name__)

def construir_texto_enriquecido(p: Dict[str, Any]) -> str:
    nombres = p.get("nombre", [])
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

@app.route('/enriquecer', methods=['POST'])
def enriquecer():
    try:
        data = request.get_json()
        texto = construir_texto_enriquecido(data)
        return jsonify({"texto_enriquecido": texto})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
