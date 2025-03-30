import React from "react";

export default function BadgeLocalStorage() {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Datos guardados automáticamente en este dispositivo
      </div>
    </div>
  );
}
