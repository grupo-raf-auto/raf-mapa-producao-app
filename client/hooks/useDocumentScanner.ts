import { useState } from "react";

interface ScanResult {
  id: string;
  fileName: string;
  scoreTotal: number;
  nivelRisco: string;
  recomendacao: string;
  scores: { tecnicoScore: number; iaScore: number };
  flagsCriticas: Array<any>;
  justificacao: string;
  timestamp: string;
}

export function useDocumentScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const uploadAndScan = async (file: File) => {
    setScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/scanner/scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);

      const data = await response.json();

      // Poll for result
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const detailResponse = await fetch(`/api/scanner/scans/${data.id}`);
          if (detailResponse.ok) {
            const scanDetail = await detailResponse.json();
            if (scanDetail.scoreTotal !== undefined) {
              setResult(scanDetail);
              clearInterval(pollInterval);
              setScanning(false);
            }
          }
        } catch (err) {
          console.error("Erro ao buscar resultado:", err);
        }

        if (attempts >= 15) {
          clearInterval(pollInterval);
          setError("Timeout ao processar documento");
          setScanning(false);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setScanning(false);
    }
  };

  return { scanning, error, result, uploadAndScan };
}
