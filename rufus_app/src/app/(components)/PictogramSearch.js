"use client";

import React, { useState, useRef, useEffect } from "react";

export default function PictogramSearch({ navigateToBar }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState("");
  const [serverResponse, setServerResponse] = useState(null);
  const [pictograms, setPictograms] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [menuTitle, setMenuTitle] = useState("Mi Menú Gastronómico");
  const menuAreaRef = useRef(null);
  
  // Estado para edición de elementos
  const [editingItem, setEditingItem] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editTimeout, setEditTimeout] = useState(null);
  const [customText, setCustomText] = useState("");
  const popupRef = useRef(null);

  // Cargar datos guardados al iniciar
  useEffect(() => {
    try {
      // Recuperar menú guardado
      const savedMenu = localStorage.getItem('gastronomic_menu_items');
      if (savedMenu) {
        setMenuItems(JSON.parse(savedMenu));
      }
      
      // Recuperar título guardado
      const savedTitle = localStorage.getItem('gastronomic_menu_title');
      if (savedTitle) {
        setMenuTitle(savedTitle);
      }
      
      // Recuperar última búsqueda
      const lastSearch = localStorage.getItem('last_search_term');
      if (lastSearch) {
        setSearchTerm(lastSearch);
      }
      
      // Recuperar últimos resultados
      const lastResults = localStorage.getItem('last_search_results');
      if (lastResults) {
        setPictograms(JSON.parse(lastResults));
      }
    } catch (error) {
      console.error("Error al cargar datos guardados:", error);
    }
  }, []);

  // Guardar menú cuando cambia
  useEffect(() => {
    if (menuItems.length > 0) {
      localStorage.setItem('gastronomic_menu_items', JSON.stringify(menuItems));
    }
  }, [menuItems]);

  // Guardar título cuando cambia
  useEffect(() => {
    localStorage.setItem('gastronomic_menu_title', menuTitle);
  }, [menuTitle]);

  // Cerrar el popup al hacer clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        cancelEdit();
      }
    }

    if (showEditPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEditPopup]);

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

      // Guardar término de búsqueda
      localStorage.setItem('last_search_term', searchTerm);

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
          
          // Guardar resultados
          localStorage.setItem('last_search_results', JSON.stringify(extractedPictograms));
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

  // Funciones para manejar el drag and drop
  const handleDragStart = (e, picto) => {
    e.dataTransfer.setData('application/json', JSON.stringify(picto));
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (menuAreaRef.current) {
      menuAreaRef.current.classList.add('border-blue-500');
      menuAreaRef.current.classList.add('bg-blue-50');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (menuAreaRef.current) {
      menuAreaRef.current.classList.remove('border-blue-500');
      menuAreaRef.current.classList.remove('bg-blue-50');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      // Agregar al menú solo si no existe ya
      if (!menuItems.some(item => item.id === data.id && item.itemOriginal === data.itemOriginal)) {
        const newMenuItems = [...menuItems, {
          ...data,
          menuId: Date.now() // Añadir un ID único para el menú
        }];
        setMenuItems(newMenuItems);
        localStorage.setItem('gastronomic_menu_items', JSON.stringify(newMenuItems));
      }
    } catch (error) {
      console.error('Error al procesar el pictograma arrastrado:', error);
    }
    
    setIsDragging(false);
    if (menuAreaRef.current) {
      menuAreaRef.current.classList.remove('border-blue-500');
      menuAreaRef.current.classList.remove('bg-blue-50');
    }
  };

  const removeFromMenu = (menuId) => {
    const updatedItems = menuItems.filter(item => item.menuId !== menuId);
    setMenuItems(updatedItems);
    localStorage.setItem('gastronomic_menu_items', JSON.stringify(updatedItems));
    
    // Si el menú queda vacío, eliminar el ítem de localStorage
    if (updatedItems.length === 0) {
      localStorage.removeItem('gastronomic_menu_items');
    }
  };

  const clearMenu = () => {
    setMenuItems([]);
    localStorage.removeItem('gastronomic_menu_items');
  };

  const handleMenuTitleChange = (e) => {
    const newTitle = e.target.value;
    setMenuTitle(newTitle);
    localStorage.setItem('gastronomic_menu_title', newTitle);
  };

  // Funciones para la edición de elementos
  const handleItemLongPress = (item) => {
    // Establecer un timeout para detectar el press largo
    const timeout = setTimeout(() => {
      setEditingItem(item);
      setCustomText(item.itemOriginal);
      setShowEditPopup(true);
    }, 500); // 500ms para considerar como press largo
    
    setEditTimeout(timeout);
  };

  const handleItemTouchEnd = () => {
    // Limpiar el timeout si el usuario suelta antes de tiempo
    if (editTimeout) {
      clearTimeout(editTimeout);
      setEditTimeout(null);
    }
  };

  const handleItemMouseDown = (item) => {
    handleItemLongPress(item);
  };

  const handleItemMouseUp = () => {
    handleItemTouchEnd();
  };

  const saveEdit = () => {
    // Actualizar el ítem con el nuevo texto
    const updatedItems = menuItems.map(item => {
      if (item.menuId === editingItem.menuId) {
        return { ...item, itemOriginal: customText };
      }
      return item;
    });
    
    setMenuItems(updatedItems);
    localStorage.setItem('gastronomic_menu_items', JSON.stringify(updatedItems));
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setShowEditPopup(false);
    setCustomText("");
    if (editTimeout) {
      clearTimeout(editTimeout);
      setEditTimeout(null);
    }
  };

  // Navegar a la página Bar para construir frases
  const saveMenuAndNavigate = () => {
    // Asegurarnos de que los datos estén guardados
    localStorage.setItem('gastronomic_menu_items', JSON.stringify(menuItems));
    localStorage.setItem('gastronomic_menu_title', menuTitle);
    
    // Llamar a la función de navegación proporcionada por el componente padre
    if (navigateToBar) {
      navigateToBar();
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-md max-w-6xl mx-auto space-y-6 bg-white">
      <h2 className="text-xl font-bold text-center">🔍 Buscador de Pictogramas</h2>

      <div className="flex flex-col items-center">
        <div className="flex w-full max-w-lg gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Escribe algo para buscar... (ej: croissant, porción de torta)"
            className="flex-grow p-3 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTextSearch();
              }
            }}
          />
          <button
            onClick={handleTextSearch}
            disabled={searching || !searchTerm.trim()}
            className="px-5 py-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {searching ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buscando...
              </span>
            ) : "Buscar"}
          </button>
        </div>

        {status && (
          <p className={`text-sm mt-4 ${status.includes("✅") ? "text-green-600" : status.includes("❌") ? "text-red-600" : status.includes("⏳") ? "text-blue-600" : "text-yellow-600"}`}>
            {status}
          </p>
        )}
      </div>

      {/* Badge para indicar que los datos se guardan localmente */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Datos guardados automáticamente en este dispositivo
        </div>
      </div>

      {/* Contenedor principal de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Columna izquierda: Resultados de búsqueda */}
        <div className="lg:col-span-2">
          {pictograms.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Pictogramas encontrados:</h3>
              <p className="text-sm text-gray-600 mb-4">
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Arrastrá los pictogramas al área de menú a la derecha ⟶
                </span>
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pictograms.map((picto, index) => (
                  <div 
                    key={index} 
                    className="border rounded-lg shadow-sm p-3 flex flex-col hover:shadow-md transition-shadow duration-200 bg-white cursor-move relative"
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, picto)}
                    onDragEnd={handleDragEnd}
                  >
                    {/* Indicador de arrastrable */}
                    <div className="absolute top-2 right-2 text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                    
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
        
        {/* Columna derecha: Área para construir el menú */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-4 sticky top-4">
            <div className="flex justify-between items-center mb-3">
              <input 
                type="text" 
                value={menuTitle} 
                onChange={handleMenuTitleChange}
                className="font-bold text-lg bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-2 py-1 w-full"
              />
              {menuItems.length > 0 && (
                <button 
                  onClick={clearMenu}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Borrar todo
                </button>
              )}
            </div>
            
            <div 
              ref={menuAreaRef}
              className={`min-h-[300px] border-2 border-dashed rounded-lg p-4 transition-colors ${
                isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {menuItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="font-medium">Arrastrá pictogramas aquí para armar tu menú</p>
                  <p className="text-sm mt-2">Los pictogramas aparecerán en esta área</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {menuItems.map((item) => (
                    <div 
                      key={item.menuId} 
                      className="flex items-center bg-white p-2 rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 relative"
                      onMouseDown={() => handleItemMouseDown(item)}
                      onMouseUp={handleItemMouseUp}
                      onMouseLeave={handleItemMouseUp}
                      onTouchStart={() => handleItemLongPress(item)}
                      onTouchEnd={handleItemTouchEnd}
                    >
                      {/* Indicador de acción editable */}
                      <div className="absolute top-1 right-1 text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      
                      <img
                        src={`https://static.arasaac.org/pictograms/${item.id}/${item.id}_300.png`}
                        alt={item.nombre}
                        className="w-16 h-16 object-contain mr-3"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/150?text=No+disponible";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{item.nombre}</div>
                        <div className="text-xs text-emerald-600 truncate">{item.itemOriginal}</div>
                      </div>
                      <button 
                        onClick={() => removeFromMenu(item.menuId)}
                        className="ml-2 text-gray-400 hover:text-red-600 p-1"
                        title="Quitar del menú"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {menuItems.length > 0 && (
              <div className="mt-4 text-right">
                <button 
                  onClick={saveMenuAndNavigate}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  Armar frases con este menú
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pop-up de edición */}
      {showEditPopup && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={popupRef}
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
          >
            <h3 className="text-lg font-bold mb-4">Editar elemento de menú</h3>
            
            <div className="flex items-center mb-4">
              <img
                src={`https://static.arasaac.org/pictograms/${editingItem.id}/${editingItem.id}_300.png`}
                alt={editingItem.nombre}
                className="w-16 h-16 object-contain mr-3"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150?text=No+disponible";
                }}
              />
              <div>
                <div className="font-bold">{editingItem.nombre}</div>
                <div className="text-sm text-gray-500">{editingItem.categoria}</div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto personalizado:
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ingrese texto personalizado..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}