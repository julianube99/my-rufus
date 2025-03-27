"use client";

import { useState, useEffect } from 'react';
import ImageUploader from './(components)/ImageUploader';
import PictogramSearch from './(components)/PictogramSearch';
import Bar from './(components)/Bar';

export default function Page() {
  const [activeComponent, setActiveComponent] = useState('imageUploader');
  
  // Cargar el último componente activo cuando se inicia la página
  useEffect(() => {
    const lastComponent = localStorage.getItem('lastComponent');
    if (lastComponent) {
      setActiveComponent(lastComponent);
    }
    
    // Comprobar si hay un parámetro en la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('view')) {
      const view = urlParams.get('view');
      if (view === 'bar' || view === 'imageUploader' || view === 'pictogramSearch') {
        setActiveComponent(view);
      }
    }
  }, []);
  
  // Función para cambiar entre componentes
  const navigateTo = (component) => {
    setActiveComponent(component);
    
    // Guardar el componente en localStorage para recuperarlo después
    if (component !== 'bar') {
      localStorage.setItem('lastComponent', component);
    }
    
    // Actualizar la URL (opcional, para que coincida con el estado)
    const url = new URL(window.location);
    url.searchParams.set('view', component);
    window.history.pushState({}, '', url);
  };
  
  return (
    <main className="container mx-auto py-6 px-2 sm:py-10 sm:px-4 space-y-10">
      {activeComponent !== 'bar' && (
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => navigateTo('pictogramSearch')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeComponent === 'pictogramSearch'
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            🔤 Buscar por texto
          </button>
          <button
            onClick={() => navigateTo('imageUploader')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeComponent === 'imageUploader'
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            📷 Subir imagen
          </button>
        </div>
      )}

      {/* Renderizar componente según el estado */}
      {activeComponent === 'imageUploader' && <ImageUploader navigateToBar={() => navigateTo('bar')} />}
      {activeComponent === 'pictogramSearch' && <PictogramSearch navigateToBar={() => navigateTo('bar')} />}
      {activeComponent === 'bar' && <Bar goBack={() => navigateTo(localStorage.getItem('lastComponent') || 'pictogramSearch')} />}
    </main>
  );
}