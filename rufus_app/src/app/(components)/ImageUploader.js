"use client";

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

  const triggerFileInput = () => {
    fileInputRef.current.click();
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

      const response = await fetch("https://pulpo.website/webhook/send_image", {
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
        setStatus(`✅ Imagen subida correctamente.`);
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
    <div className="p-6 border rounded-lg shadow-md max-w-6xl mx-auto space-y-6 bg-white">
      <h2 className="text-xl font-bold text-center">📷 Subir Imagen</h2>

      <div className="flex flex-col items-center">
        {/* Input de archivo oculto */}
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          name="imagen"
          accept="image/*"
          onChange={handleFileChange}
        />
        
        {/* Área de selección de archivo mejorada */}
        <div className="w-full max-w-xl mx-auto mb-6">
          {!selectedFile ? (
            <div 
              onClick={triggerFileInput}
              className="cursor-pointer border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg p-6 text-center transition-colors"
            >
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-blue-600 font-medium text-lg mb-1">Seleccionar archivo</div>
                <div className="text-sm text-gray-500">o arrastrá y soltá una imagen aquí</div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB • {selectedFile.type}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={resetForm}
                  className="text-gray-500 hover:text-red-600 p-1"
                  title="Eliminar archivo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {previewURL && (
            <div className="border rounded p-2 shadow-sm">
              <img
                src={previewURL}
                alt="Vista previa"
                className="w-48 h-48 object-contain"
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[150px]"
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subiendo...
                  </span>
                ) : "Enviar imagen"}
              </button>
            )}

            {!selectedFile && (
              <button
                onClick={triggerFileInput}
                className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150 font-medium min-w-[150px]"
              >
                Seleccionar imagen
              </button>
            )}

            {status && (
              <p className={`text-sm ${status.includes("✅") ? "text-green-600" : status.includes("❌") ? "text-red-600" : status.includes("⏳") ? "text-blue-600" : "text-yellow-600"}`}>
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
              <div key={index} className="border rounded-lg shadow-sm p-3 flex flex-col hover:shadow-md transition-shadow duration-200 bg-white">
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
                <div className="mt-3 text-xs text-gray-700 border-t pt-2">
                  {picto.definicion ? (
                    picto.definicion.substring(0, 150) + (picto.definicion.length > 150 ? "..." : "")
                  ) : (
                    "Sin definición disponible"
                  )}
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
          <div className="bg-gray-100 p-4 rounded overflow-auto text-left max-h-80 border border-gray-300">
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