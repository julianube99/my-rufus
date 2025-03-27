"use client";

import React, { useState, useRef, useEffect } from "react";

export default function ImageUploader({ navigateToBar }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef(null);
  const [serverResponse, setServerResponse] = useState(null);
  const [pictograms, setPictograms] = useState([]);
  
  // Estados para el menú gastronómico
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
      
      // Recuperar pictogramas guardados
      const savedPictograms = localStorage.getItem('last_image_pictograms');
      if (savedPictograms) {
        setPictograms(JSON.parse(savedPictograms));
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

  // Guardar pictogramas cuando cambian
  useEffect(() => {
    if (pictograms.length > 0) {
      localStorage.setItem('last_image_pictograms', JSON.stringify(pictograms));
    }
  }, [pictograms]);

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
    
    // Borrar pictogramas guardados al cargar una nueva imagen
    localStorage.removeItem('last_image_pictograms');

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
    
    // Borrar pictogramas guardados al resetear
    localStorage.removeItem('last_image_pictograms');
  };

  // Funciones para manejar el drag and drop
  const handleDragStart = (e, picto) => {
    // Usar 'text/plain' es más compatible con todos los navegadores
    e.dataTransfer.setData('text/plain', JSON.stringify(picto));
    // Configuración adicional para mejorar la compatibilidad
    e.dataTransfer.effectAllowed = 'copy';
    setIsDragging(true);
    
    // Añadir una imagen fantasma personalizada para arrastrar (opcional)
    const ghostElement = document.createElement('div');
    ghostElement.classList.add('drag-ghost');
    ghostElement.textContent = picto.nombre;
    document.body.appendChild(ghostElement);
    ghostElement.style.position = 'absolute';
    ghostElement.style.top = '-1000px';
    e.dataTransfer.setDragImage(ghostElement, 0, 0);
    
    // Limpiar el elemento fantasma después
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Visual feedback más destacado
    if (menuAreaRef.current) {
      menuAreaRef.current.classList.add('border-blue-500');
      menuAreaRef.current.classList.add('bg-blue-50');
    }
    // Indicar que es una operación válida
    e.dataTransfer.dropEffect = 'copy';
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
      // Obtener los datos como texto plano
      const stringData = e.dataTransfer.getData('text/plain');
      if (!stringData) {
        console.error('No se recibieron datos en el evento drop');
        return;
      }
      
      const data = JSON.parse(stringData);
      console.log("Datos recibidos:", data); // Para depuración
      
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

  // Función alternativa para añadir al menú sin arrastrar (más confiable)
  const addToMenu = (picto) => {
    if (!menuItems.some(item => item.id === picto.id && item.itemOriginal === picto.itemOriginal)) {
      const newMenuItems = [...menuItems, {
        ...picto,
        menuId: Date.now()
      }];
      setMenuItems(newMenuItems);
      localStorage.setItem('gastronomic_menu_items', JSON.stringify(newMenuItems));
    }
  };

  // Navegar a la página Bar para construir frases
  const saveMenuAndNavigate = () => {
    // Asegurarnos de que los datos estén guardados
    localStorage.setItem('gastronomic_menu_items', JSON.stringify(menuItems));
    localStorage.setItem('gastronomic_menu_title', menuTitle);
    
    // Guardar el componente actual para volver después
    localStorage.setItem('lastComponent', 'imageUploader');
    
    // Llamar a la función de navegación proporcionada por el componente padre
    console.log('Navegando a Bar', navigateToBar); // Depuración
    if (navigateToBar) {
      navigateToBar();
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
                    <div className="mt-3 text-xs text-gray-700 border-t pt-2">
                      {picto.definicion ? (
                        picto.definicion.substring(0, 150) + (picto.definicion.length > 150 ? "..." : "")
                      ) : (
                        "Sin definición disponible"
                      )}
                    </div>
                    
                    {/* Botón alternativo para añadir al menú */}
                    <div className="mt-2 text-center">
                      <button
                        onClick={() => addToMenu(picto)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
                      >
                        Añadir al menú
                      </button>
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
      
      {/* Estilos para mejorar el drag & drop */}
      <style jsx global>{`
        [draggable="true"] {
          cursor: move;
          -webkit-user-drag: element;
          user-select: none;
        }
        
        @keyframes pulse-border {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
          }
          70% {
            box-shadow: 0 0 0 5px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        .border-blue-500 {
          animation: pulse-border 1.5s infinite;
        }
      `}</style>
    </div>
  );
}