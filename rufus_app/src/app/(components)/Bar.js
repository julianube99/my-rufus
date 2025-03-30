"use client";

import React, { useState, useEffect } from "react";

export default function Bar({ goBack, menuItems, menuTitle }) {
  const [selectedItem, setSelectedItem] = useState(null);

  // Solo cargamos el item seleccionado al iniciar
  useEffect(() => {
    try {
      const savedSelectedItem = localStorage.getItem('selected_bar_item');
      if (savedSelectedItem) {
        setSelectedItem(JSON.parse(savedSelectedItem));
      }
    } catch (error) {
      console.error("Error al cargar item seleccionado:", error);
    }
  }, []);

  // Guardar el item seleccionado cuando cambia
  useEffect(() => {
    if (selectedItem) {
      localStorage.setItem('selected_bar_item', JSON.stringify(selectedItem));
    } else {
      localStorage.removeItem('selected_bar_item');
    }
  }, [selectedItem]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const clearSelectedItem = () => {
    setSelectedItem(null);
  };

  return (
    <div className="p-6 border rounded-lg shadow-md max-w-6xl mx-auto space-y-6 bg-white">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goBack} className="text-blue-600 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-center">{menuTitle || ""}</h2>
        <div className="w-5" />
      </div>

      {/* Frase con ítems fijos */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-6 md:gap-8 mb-6">
          <img src="/yo.png" className="w-24 sm:w-32 md:w-40 object-contain" alt="yo" />
          <img src="/yo quiero.png" className="w-24 sm:w-32 md:w-40 object-contain" alt="yo quiero" />
          <img src="/comer.png" className="w-24 sm:w-32 md:w-40 object-contain" alt="comer" />
          <div className="flex flex-col items-center justify-center">
            {selectedItem ? (
              <div className="relative">
                <button 
                  onClick={clearSelectedItem}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-100 z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <img
                  src={`https://static.arasaac.org/pictograms/${selectedItem.id}/${selectedItem.id}_300.png`}
                  alt=""
                  className="w-24 sm:w-32 md:w-40 object-contain rounded-lg bg-white p-2 border-2 border-green-500 shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/150?text=";
                  }}
                />
              </div>
            ) : (
              <div className="w-24 sm:w-32 md:w-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de pictogramas guardados */}
      <div className="border rounded-lg p-4">
        {menuItems.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {menuItems.map((item) => (
              <div 
                key={item.menuId} 
                className={`border rounded-lg p-3 bg-white cursor-pointer transition-all duration-200 ${
                  selectedItem && selectedItem.menuId === item.menuId 
                    ? 'ring-4 ring-blue-500 shadow-lg transform scale-105' 
                    : 'hover:shadow-md hover:border-blue-300'
                }`}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex flex-col items-center">
                  <img
                    src={`https://static.arasaac.org/pictograms/${item.id}/${item.id}_300.png`}
                    alt=""
                    className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 object-contain" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150?text=";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        .selected-item {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
