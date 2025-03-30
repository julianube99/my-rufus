import React from "react";

export default function ImageActions({
  selectedFile,
  uploading,
  handleUpload,
  triggerFileInput,
  status
}) {
  return (
    <div className="flex flex-col gap-3 items-center">
      {selectedFile ? (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Subiendo...
            </span>
          ) : (
            "Enviar imagen"
          )}
        </button>
      ) : (
        <button
          onClick={triggerFileInput}
          className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Seleccionar imagen
        </button>
      )}

      {status && (
        <p
          className={`text-sm ${
            status.includes("✅")
              ? "text-green-600"
              : status.includes("❌")
              ? "text-red-600"
              : status.includes("⏳")
              ? "text-blue-600"
              : "text-yellow-600"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}