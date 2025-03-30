"use client";

import { useState, useEffect } from 'react';
import ImageUploader from './(components)/ImageUploader';
import PictogramSearch from './(components)/PictogramSearch';
import Bar from './(components)/Bar';

export default function Page() {
  const [activeComponent, setActiveComponent] = useState('imageUploader');
  const [menuItems, setMenuItems] = useState([]);
  const [menuTitle, setMenuTitle] = useState("Mi Menú Gastronómico");

  useEffect(() => {
    const lastComponent = localStorage.getItem('lastComponent');
    if (lastComponent) {
      setActiveComponent(lastComponent);
    }

    const savedItems = localStorage.getItem("gastronomic_menu_items");
    if (savedItems) setMenuItems(JSON.parse(savedItems));

    const savedTitle = localStorage.getItem("gastronomic_menu_title");
    if (savedTitle) setMenuTitle(savedTitle);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('view')) {
      const view = urlParams.get('view');
      if (view === 'bar' || view === 'imageUploader' || view === 'pictogramSearch') {
        setActiveComponent(view);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("gastronomic_menu_items", JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem("gastronomic_menu_title", menuTitle);
  }, [menuTitle]);

  const navigateTo = (component) => {
    setActiveComponent(component);
    if (component !== 'bar') {
      localStorage.setItem('lastComponent', component);
    }
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

      {activeComponent === 'imageUploader' && (
        <ImageUploader
          navigateToBar={() => navigateTo('bar')}
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          menuTitle={menuTitle}
          setMenuTitle={setMenuTitle}
        />
      )}

      {activeComponent === 'pictogramSearch' && (
        <PictogramSearch
          navigateToBar={() => navigateTo('bar')}
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          menuTitle={menuTitle}
          setMenuTitle={setMenuTitle}
        />
      )}

      {activeComponent === 'bar' && (
        <Bar
          goBack={() => navigateTo(localStorage.getItem('lastComponent') || 'pictogramSearch')}
          menuItems={menuItems}
          menuTitle={menuTitle}
        />
      )}
    </main>
  );
}
