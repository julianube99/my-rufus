"use client";

import { useState } from 'react';
import ImageUploader from './(components)/ImageUploader';
import PictogramSearch from './(components)/PictogramSearch';

export default function Home() {
  // Estado para controlar qué componente mostrar
  const [showImageUploader, setShowImageUploader] = useState(true);
  
  return (
    <main className="container mx-auto py-6 px-2 sm:py-10 sm:px-4 space-y-10">
      {/* Selector para alternar entre componentes */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setShowImageUploader(false)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            !showImageUploader
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          🔤 Buscar por texto
        </button>
        <button
          onClick={() => setShowImageUploader(true)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            showImageUploader
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          📷 Subir imagen
        </button>
      </div>

      {/* Renderizar componente según el estado */}
      {showImageUploader ? <ImageUploader /> : <PictogramSearch />}
    </main>
  );
}