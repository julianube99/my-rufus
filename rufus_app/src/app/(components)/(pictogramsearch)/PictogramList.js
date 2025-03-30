import React from "react";

export default function PictogramList({ pictograms, handleDragStart, handleDragEnd }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {pictograms.map((picto, index) => (
        <div
          key={index}
          draggable
          onDragStart={(e) => handleDragStart(e, picto)}
          onDragEnd={handleDragEnd}
          className="p-3 border rounded shadow-sm bg-white cursor-move"
        >
          <img
            src={`https://static.arasaac.org/pictograms/${picto.id}/${picto.id}_300.png`}
            alt={picto.nombre}
            className="w-24 h-24 object-contain mb-2"
          />
          <div className="text-sm font-bold">{picto.nombre}</div>

          {/* Mostramos solo si existen */}
          {picto.itemOriginal && (
            <div className="text-xs mt-1 text-emerald-600">{picto.itemOriginal}</div>
          )}
          {picto.categoria && (
            <div className="text-xs text-gray-500">{picto.categoria}</div>
          )}
          {typeof picto.score === "number" && (
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded inline-block mt-1">
              {Math.round(picto.score * 100)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
