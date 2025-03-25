"use client";

import React, { useState } from "react";

export default function PictogramSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState("");
  const [serverResponse, setServerResponse] = useState(null);
  const [pictograms, setPictograms] = useState([]);

  const handleTextSearch = async () => {
    if (!searchTerm.trim()) {
      setStatus("⚠️ Por favor, escribe algo para buscar.");
      return;
    }

    try {
      setSearching(true);
      setStatus("⏳ Buscando pictograma...");
      setServerResponse(null);
      setPictograms([]);

      const response = await fetch("https://pulpo.website/webhook/buscar_pictograma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          elemento_principal: searchTerm.trim()
        }),
      });

      // Capturar la respuesta completa
      const responseData = await response.text();
      
      try {
        // Intentar parsear como JSON
        const jsonData = JSON.parse(responseData);
        setServerResponse(jsonData);
        
        // Procesar los datos para extraer los pictogramas
        if (Array.isArray(jsonData)) {
          const extractedPictograms = jsonData.map(item => {
            // Extraer la información relevante
            return {
              id: item.document.metadata.id,
              nombre: item.document.metadata["nombre del pictograma"],
              itemOriginal: item.item_original || searchTerm,
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
        setStatus(`✅ Búsqueda completada. Código: ${response.status}`);
      } else {
        setStatus(`❌ Error en la búsqueda. Código: ${response.status}`);
      }
    } catch (error) {
      console.error("Error de búsqueda:", error);
      setStatus("❌ Error al realizar la búsqueda. Verifique su conexión a internet.");
      setServerResponse({ error: error.message });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-6 border rounded shadow max-w-6xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-center">🔍 Buscar Pictograma</h2>

      <div className="flex flex-col items-center">
        <div className="flex w-full max-w-lg gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Escribe algo para buscar... (ej: croissant, porción de torta)"
            className="flex-grow p-2 border rounded"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTextSearch();
              }
            }}
          />
          <button
            onClick={handleTextSearch}
            disabled={searching || !searchTerm.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {status && (
          <p className={`text-sm mt-4 ${status.includes("✅") ? "text-green-600" : status.includes("❌") ? "text-red-600" : status.includes("⏳") ? "text-blue-600" : "text-yellow-600"}`}>
            {status}
          </p>
        )}
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