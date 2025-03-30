import React from "react";

export default function SearchBar({ searchTerm, setSearchTerm, handleSearch, status, searching }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-lg gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Escribe algo para buscar..."
          className="flex-grow p-3 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={searching || !searchTerm.trim()}
          className="px-5 py-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50"
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </div>
      {status && <p className="text-sm mt-4">{status}</p>}
    </div>
  );
}