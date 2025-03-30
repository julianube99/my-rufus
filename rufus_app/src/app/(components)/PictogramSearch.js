"use client";

import React, { useState, useRef, useEffect } from "react";
import SearchBar from "./(pictogramsearch)/SearchBar";
import PictogramList from "./(pictogramsearch)/PictogramList";
import MenuBuilder from "./(pictogramsearch)/MenuBuilder";
import EditPopup from "./(pictogramsearch)/EditPopup";
import BadgeLocalStorage from "./(pictogramsearch)/BadgeLocalStorage";

export default function PictogramSearch({ navigateToBar, menuItems, setMenuItems, menuTitle, setMenuTitle }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState("");
  const [serverResponse, setServerResponse] = useState(null);
  const [pictograms, setPictograms] = useState([]);


  const [editingItem, setEditingItem] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editTimeout, setEditTimeout] = useState(null);
  const [customText, setCustomText] = useState("");

  const popupRef = useRef(null);
  const menuAreaRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    try {
      const savedMenu = localStorage.getItem('gastronomic_menu_items');
      if (savedMenu) setMenuItems(JSON.parse(savedMenu));

      const savedTitle = localStorage.getItem('gastronomic_menu_title');
      if (savedTitle) setMenuTitle(savedTitle);

      const lastSearch = localStorage.getItem('last_search_term');
      if (lastSearch) setSearchTerm(lastSearch);

      const lastResults = localStorage.getItem('last_search_results');
      if (lastResults) setPictograms(JSON.parse(lastResults));
    } catch (error) {
      console.error("Error al cargar datos guardados:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gastronomic_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('gastronomic_menu_title', menuTitle);
  }, [menuTitle]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        cancelEdit();
      }
    }

    if (showEditPopup) {
      document.addEventListener("mousedown", handleClickOutside);
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
      localStorage.setItem('last_search_term', searchTerm);

      const response = await fetch("https://pulpo.website/webhook/buscar_pictograma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elemento_principal: searchTerm.trim() }),
      });

      const responseData = await response.text();

      try {
        const jsonData = JSON.parse(responseData);
        setServerResponse(jsonData);

        if (Array.isArray(jsonData)) {
          const extracted = jsonData.map(item => ({
            id: item.id,
            nombre: item.nombre,
            itemOriginal: searchTerm
          }));
          setPictograms(extracted);
          localStorage.setItem('last_search_results', JSON.stringify(extracted));
        }
      } catch (e) {
        setServerResponse({ rawText: responseData });
        console.error("Error al parsear la respuesta:", e);
      }

      setStatus(response.ok ? `✅ Búsqueda completada. Código: ${response.status}` : `❌ Error en la búsqueda. Código: ${response.status}`);
    } catch (error) {
      console.error("Error de búsqueda:", error);
      setStatus("❌ Error al realizar la búsqueda. Verifique su conexión.");
      setServerResponse({ error: error.message });
    } finally {
      setSearching(false);
    }
  };

  const handleDragStart = (e, picto) => {
    e.dataTransfer.setData('application/json', JSON.stringify(picto));
    setIsDragging(true);
  };

  const handleDragEnd = () => setIsDragging(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (menuAreaRef.current) menuAreaRef.current.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (menuAreaRef.current) menuAreaRef.current.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (!menuItems.some(item => item.id === data.id && item.itemOriginal === data.itemOriginal)) {
        const newItem = { ...data, menuId: Date.now() };
        const updated = [...menuItems, newItem];
        setMenuItems(updated);
        localStorage.setItem('gastronomic_menu_items', JSON.stringify(updated));
      }
    } catch (error) {
      console.error("Error al agregar pictograma:", error);
    }

    setIsDragging(false);
    if (menuAreaRef.current) menuAreaRef.current.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const removeFromMenu = (menuId) => {
    const updated = menuItems.filter(item => item.menuId !== menuId);
    setMenuItems(updated);
    if (updated.length === 0) localStorage.removeItem('gastronomic_menu_items');
  };

  const clearMenu = () => {
    setMenuItems([]);
    localStorage.removeItem('gastronomic_menu_items');
  };

  const handleMenuTitleChange = (e) => setMenuTitle(e.target.value);

  const handleItemLongPress = (item) => {
    const timeout = setTimeout(() => {
      setEditingItem(item);
      setCustomText(item.itemOriginal);
      setShowEditPopup(true);
    }, 500);
    setEditTimeout(timeout);
  };

  const handleItemTouchEnd = () => {
    if (editTimeout) clearTimeout(editTimeout);
  };

  const handleItemMouseDown = (item) => handleItemLongPress(item);
  const handleItemMouseUp = () => handleItemTouchEnd();

  const saveEdit = () => {
    const updated = menuItems.map(item =>
      item.menuId === editingItem.menuId ? { ...item, itemOriginal: customText } : item
    );
    setMenuItems(updated);
    localStorage.setItem('gastronomic_menu_items', JSON.stringify(updated));
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setShowEditPopup(false);
    setCustomText("");
    if (editTimeout) clearTimeout(editTimeout);
  };

  const saveMenuAndNavigate = () => {
    localStorage.setItem('gastronomic_menu_items', JSON.stringify(menuItems));
    localStorage.setItem('gastronomic_menu_title', menuTitle);
    if (navigateToBar) navigateToBar();
  };

  return (
    <div className="p-6 border rounded-lg shadow-md max-w-6xl mx-auto space-y-6 bg-white">
      <h2 className="text-xl font-bold text-center">🔍 Buscador de Pictogramas</h2>

      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleTextSearch}
        status={status}
        searching={searching}
      />

      <BadgeLocalStorage />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2">
          {pictograms.length > 0 && (
            <>
              <p className="text-sm text-gray-600 mb-4">Arrastrá los pictogramas al área de menú a la derecha ⟶</p>
              <PictogramList
                pictograms={pictograms}
                handleDragStart={handleDragStart}
                handleDragEnd={handleDragEnd}
              />
            </>
          )}

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

        <div className="lg:col-span-1">
          <MenuBuilder
            menuItems={menuItems}
            removeFromMenu={removeFromMenu}
            clearMenu={clearMenu}
            menuTitle={menuTitle}
            handleMenuTitleChange={handleMenuTitleChange}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            isDragging={isDragging}
            menuAreaRef={menuAreaRef}
            saveMenuAndNavigate={saveMenuAndNavigate}
            handleItemMouseDown={handleItemMouseDown}
            handleItemMouseUp={handleItemMouseUp}
            handleItemTouchEnd={handleItemTouchEnd}
            handleItemLongPress={handleItemLongPress}
          />
        </div>
      </div>

      {showEditPopup && editingItem && (
        <EditPopup
          editingItem={editingItem}
          customText={customText}
          setCustomText={setCustomText}
          cancelEdit={cancelEdit}
          saveEdit={saveEdit}
          popupRef={popupRef}
        />
      )}
    </div>
  );
}
