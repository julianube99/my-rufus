import requests
from PIL import Image
from io import BytesIO
import sys

def obtener_imagen_arasaac(id_pictograma):
    """ Obtiene la imagen de un pictograma de ARASAAC por su ID """
    url = f"https://api.arasaac.org/v1/pictograms/{id_pictograma}"
    response = requests.get(url)
    
    if response.status_code == 200:
        img = Image.open(BytesIO(response.content)).convert("RGBA")
        return img
    else:
        print(f"⚠️ Error al obtener la imagen con ID {id_pictograma}. Código HTTP: {response.status_code}")
        return None

def superponer_imagenes(id_base, id_superpuesta):
    """ Descarga y superpone la imagen superpuesta abajo a la derecha """
    # Obtener imágenes
    base_img = obtener_imagen_arasaac(id_base)
    superpuesta_img = obtener_imagen_arasaac(id_superpuesta)

    if base_img is None or superpuesta_img is None:
        print("❌ No se pudo obtener una o ambas imágenes.")
        return

    # Redimensionar la imagen superpuesta para que ocupe 1/4 del pictograma base
    factor = 3 # Reducimos la imagen superpuesta a 1/4 del tamaño de la base
    superpuesta_resized = superpuesta_img.resize(
        (base_img.width // factor, base_img.height // factor),
        Image.LANCZOS
    )

    # Crear un lienzo del mismo tamaño que la imagen base
    combined = Image.new("RGBA", (base_img.width, base_img.height), (0, 0, 0, 0))

    # Pegar la imagen base
    combined.paste(base_img, (0, 0), base_img)

    # Calcular posición para colocar la imagen superpuesta en la esquina inferior derecha
    x_offset = base_img.width - superpuesta_resized.width - 10  # 10px de margen
    y_offset = base_img.height - superpuesta_resized.height - 10  # 10px de margen

    # Pegar la imagen superpuesta en la nueva posición
    combined.paste(superpuesta_resized, (x_offset, y_offset), superpuesta_resized)

    # Guardar el resultado
    output_filename = f"superpuesto_{id_base}_{id_superpuesta}.png"
    combined.save(output_filename, format="PNG")

    # Mostrar el resultado
    combined.show()

    print(f"✅ Imagen superpuesta guardada como {output_filename}")

# Ejecutar el script con IDs específicos (puedes cambiar estos valores o recibirlos como argumentos)
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("❌ Uso: python script.py <ID_BASE> <ID_SUPERPUESTA>")
    else:
        id_base = sys.argv[1]
        id_superpuesta = sys.argv[2]
        superponer_imagenes(id_base, id_superpuesta)

