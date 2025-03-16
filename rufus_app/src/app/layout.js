// app/layout.js
import './globals.css';

export const metadata = {
  title: 'Buscador de Pictogramas',
  description: 'Aplicación para buscar pictogramas ARASAAC',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-100">
        {children}
      </body>
    </html>
  );
}