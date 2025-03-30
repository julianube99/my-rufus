"use client";

import React, { useState, useRef, useEffect } from "react";
import ImageUploadArea from "./(imageuploader)/ImageUploadArea";
import ImageActions from "./(imageuploader)/ImageActions";
import BadgeLocalStorage from "./(pictogramsearch)/BadgeLocalStorage";
import EditPopup from "./(pictogramsearch)/EditPopup";
import MenuBuilder from "./(pictogramsearch)/MenuBuilder";

export default function ImageUploader({ navigateToBar, menuItems, setMenuItems, menuTitle, setMenuTitle }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [serverResponse, setServerResponse] = useState(null);
  const [pictograms, setPictograms] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editTimeout, setEditTimeout] = useState(null);
  const [customText, setCustomText] = useState("");

  const fileInputRef = useRef(null);
  const menuAreaRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    try {
      const savedMenu = localStorage.getItem("gastronomic_menu_items");
      if (savedMenu) setMenuItems(JSON.parse(savedMenu));
      const savedTitle = localStorage.getItem("gastronomic_menu_title");
      if (savedTitle) setMenuTitle(savedTitle);
      const savedPictograms = localStorage.getItem("last_image_pictograms");
      if (savedPictograms) setPictograms(JSON.parse(savedPictograms));
    } catch (error) {
      console.error("Error al cargar datos guardados:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("gastronomic_menu_items", JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem("gastronomic_menu_title", menuTitle);
  }, [menuTitle]);

  useEffect(() => {
    localStorage.setItem("last_image_pictograms", JSON.stringify(pictograms));
  }, [pictograms]);

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
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("⚠️ El archivo seleccionado no es una imagen válida.");
      return;
    }
    setSelectedFile(file);
    setStatus("");
    setServerResponse(null);
    setPictograms([]);
    localStorage.removeItem("last_image_pictograms");
    const url = URL.createObjectURL(file);
    setPreviewURL(url);
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewURL(null);
    setServerResponse(null);
    setPictograms([]);
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    localStorage.removeItem("last_image_pictograms");
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

      const responseData = await response.text();
      try {
        const jsonData = JSON.parse(responseData);
        console.log(jsonData)
        setServerResponse(jsonData);
        if (Array.isArray(jsonData)) {
          const extracted = jsonData.map((item) => ({
            id: item.id,
            nombre: item.nombre,
            itemOriginal: item.item_original || "Sin texto original"
          }));
          setPictograms(extracted);
        }
      } catch (e) {
        setServerResponse({ rawText: responseData });
        console.error("Error al parsear la respuesta:", e);
      }

      setStatus(response.ok ? `✅ Imagen subida correctamente.` : `❌ Error al subir imagen. Código: ${response.status}`);
    } catch (error) {
      console.error("Error de carga:", error);
      setStatus("❌ Error al enviar la imagen. Verifique su conexión a internet.");
      setServerResponse({ error: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (!menuItems.some((item) => item.id === data.id && item.itemOriginal === data.itemOriginal)) {
        const newItem = { ...data, menuId: Date.now() };
        const updated = [...menuItems, newItem];
        setMenuItems(updated);
      }
    } catch (error) {
      console.error("Error al procesar el drop:", error);
    }
    setIsDragging(false);
  };

  const handleDragStart = (e, picto) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(picto));
    setIsDragging(true);
  };

  const handleDragEnd = () => setIsDragging(false);
  const handleDragOver = (e) => e.preventDefault();
  const handleDragLeave = (e) => e.preventDefault();

  const removeFromMenu = (menuId) => {
    const updated = menuItems.filter((item) => item.menuId !== menuId);
    setMenuItems(updated);
  };

  const clearMenu = () => setMenuItems([]);
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

  const saveEdit = () => {
    const updated = menuItems.map((item) =>
      item.menuId === editingItem.menuId ? { ...item, itemOriginal: customText } : item
    );
    setMenuItems(updated);
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setShowEditPopup(false);
    setCustomText("");
    if (editTimeout) clearTimeout(editTimeout);
  };

  const saveMenuAndNavigate = () => {
    localStorage.setItem("gastronomic_menu_items", JSON.stringify(menuItems));
    localStorage.setItem("gastronomic_menu_title", menuTitle);
    localStorage.setItem("lastComponent", "imageUploader");
    if (navigateToBar) navigateToBar();
  };

  return (
    <div className="p-6 border rounded-lg shadow-md max-w-6xl mx-auto space-y-6 bg-white">
      <h2 className="text-xl font-bold text-center">📷 Subir Imagen</h2>

      <ImageUploadArea
        selectedFile={selectedFile}
        previewURL={previewURL}
        triggerFileInput={triggerFileInput}
        resetForm={resetForm}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
      />

      <ImageActions
        selectedFile={selectedFile}
        uploading={uploading}
        handleUpload={handleUpload}
        triggerFileInput={triggerFileInput}
        status={status}
      />

      <BadgeLocalStorage />

      {pictograms.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mt-8 mb-2">Pictogramas encontrados:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pictograms.map((picto, index) => (
              <div
                key={index}
                className="border rounded p-3 shadow-sm bg-white cursor-move"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, picto)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={`https://static.arasaac.org/pictograms/${picto.id}/${picto.id}_300.png`}
                    alt={picto.nombre}
                    className="w-24 h-24 object-contain"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm">{picto.nombre}</div>
                    <div className="text-xs text-emerald-600">{picto.itemOriginal}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        handleItemMouseDown={handleItemLongPress}
        handleItemMouseUp={handleItemTouchEnd}
        handleItemTouchEnd={handleItemTouchEnd}
        handleItemLongPress={handleItemLongPress}
      />

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
