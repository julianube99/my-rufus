import React from "react";

export default function MenuBuilder({
  menuItems,
  removeFromMenu,
  clearMenu,
  menuTitle,
  handleMenuTitleChange,
  handleDrop,
  handleDragOver,
  handleDragLeave,
  isDragging,
  menuAreaRef,
  saveMenuAndNavigate,
  handleItemMouseDown,
  handleItemMouseUp,
  handleItemTouchEnd,
  handleItemLongPress,
}) {
  return (
    <div className="border rounded-lg p-4 sticky top-4">
      <div className="flex justify-between items-center mb-3">
        <input
          type="text"
          value={menuTitle}
          onChange={handleMenuTitleChange}
          className="font-bold text-lg bg-transparent border-b hover:border-gray-300 focus:border-blue-500 px-2 py-1 w-full"
        />
        {menuItems.length > 0 && (
          <button onClick={clearMenu} className="text-xs text-red-600 hover:text-red-800">
            Borrar todo
          </button>
        )}
      </div>

      <div
        ref={menuAreaRef}
        className={`min-h-[300px] border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {menuItems.length === 0 ? (
          <p className="text-center text-gray-400">Arrastrá pictogramas aquí</p>
        ) : (
          <div className="space-y-3">
            {menuItems.map((item) => (
              <div
                key={item.menuId}
                className="flex items-center bg-white p-2 rounded-lg border shadow-sm"
                onMouseDown={() => handleItemMouseDown(item)}
                onMouseUp={handleItemMouseUp}
                onMouseLeave={handleItemMouseUp}
                onTouchStart={() => handleItemLongPress(item)}
                onTouchEnd={handleItemTouchEnd}
              >
                <img
                  src={`https://static.arasaac.org/pictograms/${item.id}/${item.id}_300.png`}
                  alt={item.nombre || "Pictograma"}
                  className="w-16 h-16 object-contain mr-3"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{item.nombre}</div>
                  {item.itemOriginal && (
                    <div className="text-xs text-emerald-600 truncate">{item.itemOriginal}</div>
                  )}
                </div>
                <button
                  onClick={() => removeFromMenu(item.menuId)}
                  className="ml-2 text-gray-400 hover:text-red-600"
                >
                  ✕
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
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Armar frases
          </button>
        </div>
      )}
    </div>
  );
}
