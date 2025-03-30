import React from "react";

export default function EditPopup({ editingItem, customText, setCustomText, cancelEdit, saveEdit, popupRef }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={popupRef} className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-bold mb-4">Editar elemento</h3>
        
        <div className="flex items-center mb-4">
          <img
            src={`https://static.arasaac.org/pictograms/${editingItem.id}/${editingItem.id}_300.png`}
            alt={editingItem.nombre || "Pictograma"}
            className="w-16 h-16 object-contain mr-3"
          />
          <div className="font-bold">{editingItem.nombre || "Sin nombre"}</div>
        </div>
        
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          placeholder="Texto personalizado..."
        />
        
        <div className="flex justify-end gap-2">
          <button onClick={cancelEdit} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">Cancelar</button>
          <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
        </div>
      </div>
    </div>
  );
}
