import React, { useState, useRef } from "react";

export default function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef(null);
  const [serverResponse, setServerResponse] = useState(null);
  const [pictograms, setPictograms] = useState([]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      setStatus("⚠️ Por favor, seleccioná una imagen primero.");
      return;
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setStatus("⚠️ El archivo seleccionado no es una imagen válida.");
      return;
    }

    setSelectedFile(file);
    setStatus("");
    setServerResponse(null);
    setPictograms([]);

    // Crear URL para preview
    const url = URL.createObjectURL(file);
    setPreviewURL(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus("⚠️ Por favor, seleccioná una imagen primero.");
      return;
    }

    const formData = new FormData();
    formData.append("imagen", selectedFile);

    try {
      setUploading(true);
      setStatus("⏳ Subiendo imagen...");
      setServerResponse(null);
      setPictograms([]);

      const response = await fetch("https://pulpo.website/webhook-test/send_image", {
        method: "POST",
        body: formData,
      });

      // Capturar la respuesta completa
      const responseData = await response.text();
      
      try {
        // Intentar parsear como JSON
        const jsonData = JSON.parse(responseData);
        setServerResponse(jsonData);
        
        // Procesar los datos para extraer los pictogramas con el nuevo formato
        if (Array.isArray(jsonData)) {
          const extractedPictograms = jsonData.map(item => {
            // Extraer la información relevante
            return {
              id: item.document.metadata.id,
              nombre: item.document.metadata["nombre del pictograma"],
              itemOriginal: item.item_original || "Sin texto original",
              score: item.score || 0,
              categoria: item.document.metadata.categoria,
              definicion: item.document.metadata.definicion
            };
          });
          
          setPictograms(extractedPictograms);
        }
      } catch (e) {
        // Si no es JSON, mostrar como texto
        setServerResponse({ rawText: responseData });
        console.error("Error al parsear la respuesta:", e);
      }

      if (response.ok) {
        setStatus(`✅ Imagen subida correctamente. Código: ${response.status}`);
      } else {
        setStatus(`❌ Error al subir imagen. Código: ${response.status}`);
      }
    } catch (error) {
      console.error("Error de carga:", error);
      setStatus("❌ Error al enviar la imagen. Verifique su conexión a internet.");
      setServerResponse({ error: error.message });
    } finally {
      setUploading(false);
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewURL(null);
    setServerResponse(null);
    setPictograms([]);
    setStatus("");
    
    // Limpiar el input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 border rounded shadow max-w-6xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-center">🧁 Subir Imagen</h2>

      <div className="flex flex-col items-center">
        <input
          ref={fileInputRef}
          name="imagen"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mx-auto mb-4"
        />

        <div className="flex items-center gap-6">
          {previewURL && (
            <div className="border rounded p-2">
              <img
                src={previewURL}
                alt="Vista previa"
                className="w-48 h-48 object-contain"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Subiendo..." : "Enviar imagen"}
            </button>

            {selectedFile && (
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                disabled={uploading}
              >
                Cancelar
              </button>
            )}

            {status && (
              <p className={`text-sm mt-2 ${status.includes("✅") ? "text-green-600" : status.includes("❌") ? "text-red-600" : status.includes("⏳") ? "text-blue-600" : "text-yellow-600"}`}>
                {status}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sección para mostrar los pictogramas */}
      {pictograms.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Pictogramas encontrados:</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pictograms.map((picto, index) => (
              <div key={index} className="border rounded-lg shadow p-3 flex flex-col">
                <div className="flex items-center gap-4">
                  <img
                    src={`https://static.arasaac.org/pictograms/${picto.id}/${picto.id}_300.png`}
                    alt={picto.nombre}
                    className="w-24 h-24 object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150?text=No+disponible";
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm">{picto.nombre}</div>
                    <div className="text-xs text-gray-500">{picto.categoria}</div>
                    
                    <div className="flex justify-between items-center mt-2 border-t pt-2">
                      <div className="text-xs font-medium text-emerald-600">
                        <span className="font-bold">{picto.itemOriginal}</span>
                      </div>
                      <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded inline-block">
                        {picto.score ? Math.round(picto.score * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mostrar respuesta JSON cruda solo si no hay pictogramas o hay un error */}
      {serverResponse && pictograms.length === 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Respuesta del servidor:</h3>
          <div className="bg-gray-100 p-4 rounded overflow-auto text-left max-h-80">
            <pre className="text-xs whitespace-pre-wrap break-words">
              {typeof serverResponse === 'object' 
                ? JSON.stringify(serverResponse, null, 2) 
                : serverResponse}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}