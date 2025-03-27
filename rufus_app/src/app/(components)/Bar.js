"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Bar() {
  const [menuItems, setMenuItems] = useState([]);
  const [menuTitle, setMenuTitle] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef(null);
  const router = useRouter();

  // Cargar datos guardados al iniciar
  useEffect(() => {
    try {
      // Recuperar menú guardado
      const savedMenu = localStorage.getItem('gastronomic_menu_items');
      if (savedMenu) {
        setMenuItems(JSON.parse(savedMenu));
      } else {
        // Si no hay menú guardado, redirigir a la página de búsqueda
        router.push("/");
      }
      
      // Recuperar título guardado
      const savedTitle = localStorage.getItem('gastronomic_menu_title');
      if (savedTitle) {
        setMenuTitle(savedTitle);
      }
    } catch (error) {
      console.error("Error al cargar datos guardados:", error);
    }
  }, [router]);

  // Funciones para drag and drop
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-blue-500');
      dropZoneRef.current.classList.add('bg-blue-50');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500');
      dropZoneRef.current.classList.remove('bg-blue-50');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      setSelectedItem(data);
    } catch (error) {
      console.error('Error al procesar el pictograma arrastrado:', error);
    }
    
    setIsDragging(false);
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500');
      dropZoneRef.current.classList.remove('bg-blue-50');
    }
  };

  const clearSelectedItem = () => {
    setSelectedItem(null);
  };

  const goBack = () => {
    router.push("/");
  };

  return (
    <div className="p-6 border rounded-lg shadow-md max-w-6xl mx-auto space-y-6 bg-white">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goBack} className="text-blue-600 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a búsqueda
        </button>
        <h2 className="text-xl font-bold text-center">{menuTitle || "Mi Menú Gastronómico"}</h2>
        <div className="w-24"></div> {/* Espacio para equilibrar el header */}
      </div>

      {/* Secuencia de pictogramas fija */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-medium mb-4">Armá tu frase con pictogramas:</h3>
        
        <div className="flex items-center flex-wrap gap-4 mb-6">
          {/* Pictogramas fijos */}
          <div className="flex flex-col items-center justify-center">
            <img
              src="/yo.png"
              alt="Yo"
              className="w-20 h-20 object-contain"
            />
            <span className="text-sm font-medium mt-1">yo</span>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <img
              src="/yo quiero.png"
              alt="Quiero"
              className="w-20 h-20 object-contain"
            />
            <span className="text-sm font-medium mt-1">quiero</span>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <img
              src="/comer.png"
              alt="Comer"
              className="w-20 h-20 object-contain"
            />
            <span className="text-sm font-medium mt-1">comer</span>
          </div>
          
          {/* Zona para arrastrar el elemento seleccionado */}
          <div 
            ref={dropZoneRef}
            className={`w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } ${selectedItem ? 'border-green-500 bg-green-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedItem ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <button 
                  onClick={clearSelectedItem}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-100"
                  title="Quitar pictograma"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <img
                  src={`https://static.arasaac.org/pictograms/${selectedItem.id}/${selectedItem.id}_300.png`}
                  alt={selectedItem.nombre}
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/150?text=No+disponible";
                  }}
                />
                <span className="text-xs text-center mt-1 text-emerald-600 font-medium">{selectedItem.itemOriginal}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Arrastrá aquí</span>
            )}
          </div>
        </div>
        
        {/* Mensaje de instrucción */}
        <div className="text-center text-sm text-gray-500 mb-4">
          {selectedItem ? (
            <p className="p-2 bg-green-100 text-green-800 rounded-lg">
              <span className="font-medium">Yo quiero comer {selectedItem.itemOriginal}</span>
            </p>
          ) : (
            <p>Arrastrá un pictograma desde tu menú para completar la frase</p>
          )}
        </div>
      </div>

      {/* Lista de pictogramas guardados */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-4">Tus pictogramas guardados:</h3>
        
        {menuItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hay pictogramas guardados. Por favor, vuelve a la búsqueda para agregar algunos.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {menuItems.map((item) => (
              <div 
                key={item.menuId} 
                className="border rounded-lg p-2 shadow-sm hover:shadow-md cursor-move bg-white transition-shadow duration-200"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex flex-col items-center">
                  <img
                    src={`https://static.arasaac.org/pictograms/${item.id}/${item.id}_300.png`}
                    alt={item.nombre}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150?text=No+disponible";
                    }}
                  />
                  <div className="mt-2 text-center">
                    <div className="text-xs text-gray-500 truncate w-full">{item.nombre}</div>
                    <div className="text-xs font-medium text-emerald-600 truncate w-full">{item.itemOriginal}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}