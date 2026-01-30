import { useState, useRef, useCallback } from "react";

interface ScanFlag {
  type: string;
  description: string;
}

interface ScanResult {
  id: string;
  fileName: string;
  scoreTotal: number;
  technicalScore: number;
  iaScore: number;
  riskLevel: string;
  recommendation: string;
  flags: ScanFlag[];
  justification: string;
  createdAt: string;
}

const MAX_POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_ERROR = "Timeout ao processar documento (processamento demorado)";

export function useDocumentScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollForResult = useCallback(
    async (scanId: string) => {
      let attempts = 0;

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const detailResponse = await fetch(`/api/scanner/scan?id=${scanId}`, {
            signal: abortControllerRef.current?.signal,
          });

          if (detailResponse.ok) {
            const scanDetail = await detailResponse.json();
            if (scanDetail.scoreTotal !== undefined) {
              setResult(scanDetail);
              stopPolling();
              setScanning(false);
              return;
            }
          } else if (detailResponse.status === 404) {
            console.log(`[Attempt ${attempts}] Scan not ready yet, polling...`);
          } else {
            const errorData = await detailResponse
              .json()
              .catch(() => ({ error: detailResponse.statusText }));
            console.error(
              `Error fetching scan (${detailResponse.status}):`,
              errorData
            );
          }
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") {
            console.error("Erro ao buscar resultado:", err);
          }
        }

        if (attempts >= MAX_POLL_ATTEMPTS) {
          stopPolling();
          setError(POLL_TIMEOUT_ERROR);
          setScanning(false);
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  const uploadAndScan = useCallback(async (file: File) => {
    setScanning(true);
    setError(null);
    setResult(null);

    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/scanner/scan", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      await pollForResult(data.id);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Erro desconhecido");
        setScanning(false);
      }
    }
  }, [pollForResult]);

  const cleanup = useCallback(() => {
    stopPolling();
    abortControllerRef.current?.abort();
  }, [stopPolling]);

  // Cleanup on component unmount
  const unmountRef = useRef(false);
  if (!unmountRef.current) {
    unmountRef.current = true;
  }

  return { scanning, error, result, uploadAndScan, cleanup };
}
