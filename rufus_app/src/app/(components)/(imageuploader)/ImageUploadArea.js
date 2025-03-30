"use client";

import React, { useState, useRef, useEffect } from "react";

export default function ImageUploadArea({
  selectedFile,
  previewURL,
  triggerFileInput,
  resetForm,
  fileInputRef,
  handleFileChange,
  setMenuItems = () => {} // Valor por defecto para evitar errores si no se pasa la prop
}) {
  useEffect(() => {
    try {
      const savedMenu = localStorage.getItem("gastronomic_menu_items");
      if (savedMenu) setMenuItems(JSON.parse(savedMenu));
    } catch (error) {
      console.error("Error al cargar datos guardados en ImageUploadArea:", error);
    }
  }, [setMenuItems]);

  return (
    <div className="w-full max-w-xl mx-auto mb-6">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        name="imagen"
        accept="image/*"
        onChange={handleFileChange}
      />

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

      {previewURL && (
        <div className="mt-4 border rounded p-2 shadow-sm text-center">
          <img
            src={previewURL}
            alt="Vista previa"
            className="w-48 h-48 object-contain mx-auto"
          />
        </div>
      )}
    </div>
  );
}