'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const res = await fetch('/api/webhook/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
      
      const data = await res.text();
      console.log('Raw response:', data);
      
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed response:', jsonData);
        
        if (!res.ok) {
          throw new Error(jsonData.error || `Error del servidor: ${res.status}`);
        }

        setResponse(jsonData);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        setResponse(data); // Mostrar la respuesta raw si no es JSON
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('No se pudo encontrar un pictograma para esta palabra. Por favor, intenta con otra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Buscador de Pictogramas</h1>
      
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
              Búsqueda:
            </label>
            <input
              type="text"
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa una palabra o frase para buscar"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
          >
            {loading ? 'Buscando pictograma...' : 'Buscar Pictograma'}
          </button>
        </form>

        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {response && (
          <div className="mt-6">
            <div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="relative w-full aspect-square flex items-center justify-center bg-gray-50 rounded-lg mb-4 overflow-hidden">
                <img 
                  src={response.pictogram_url}
                  alt={response.keyword}
                  className="max-w-full max-h-full object-contain p-4"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400?text=Imagen+no+disponible';
                  }}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center capitalize">
                {response.keyword}
              </h3>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}