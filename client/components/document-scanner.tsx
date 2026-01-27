"use client";

import { useRef } from "react";
import { useDocumentScanner } from "@/hooks/useDocumentScanner";

export function DocumentScanner() {
  const { scanning, error, result, uploadAndScan } = useDocumentScanner();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAndScan(file);
    }
  };

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case "ALTO_RISCO":
        return "bg-red-100 text-red-800 border-red-300";
      case "MEDIO_ALTO":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIO":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "BAIXO":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Scan de Documentos</h2>

      <div className="mb-6">
        <label className="block">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-50 cursor-pointer transition">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={handleFileChange}
              disabled={scanning}
              className="hidden"
            />
            <p className="text-gray-600">
              {scanning ? "Processando..." : "Clique para selecionar PDF ou Imagem"}
            </p>
            <p className="text-sm text-gray-400">Máx 50MB</p>
          </div>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className={`border rounded-lg p-4 ${getRiskColor(result.nivelRisco)}`}>
            <div className="font-bold text-lg">{result.nivelRisco}</div>
            <div className="text-sm">Score: {result.scoreTotal}/100</div>
            <div className="text-sm">Técnico: {result.scores.tecnicoScore} | IA: {result.scores.iaScore}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-bold mb-2">Recomendação</h3>
            <p>{result.recomendacao}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-bold mb-2">Justificativa</h3>
            <p className="text-sm">{result.justificacao}</p>
          </div>

          {result.flagsCriticas.length > 0 && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-bold mb-2">Flags Críticas</h3>
              <ul className="space-y-2">
                {result.flagsCriticas.map((flag, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-semibold">{flag.tipo}</span>
                    {flag.confianca && (
                      <span className="text-gray-600 ml-2">
                        ({(flag.confianca * 100).toFixed(0)}%)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Escanear Outro Documento
          </button>
        </div>
      )}
    </div>
  );
}
