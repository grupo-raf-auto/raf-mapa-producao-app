"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDocumentScanner } from "@/hooks/useDocumentScanner";
import { ScannerResults } from "@/components/scanner-results";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  File,
  FileText,
  Image,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
}

type WizardStep = "upload" | "summary";

export function DocumentScanner() {
  const { scanning, error, result, uploadAndScan } = useDocumentScanner();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) {
      return <Image className="w-4 h-4" />;
    }
    if (type === "application/pdf") {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter((file) => {
      const isValidType = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ].includes(file.type);
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      return isValidType && isValidSize;
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttachFiles = async () => {
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      const uploadingFile: UploadingFile = {
        file,
        progress: 0,
        status: "uploading",
      };

      setUploadingFiles((prev) => [...prev, uploadingFile]);

      for (let i = 0; i <= 100; i += Math.random() * 30) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === file
              ? { ...uf, progress: Math.min(i, 100) }
              : uf
          )
        );
      }

      try {
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === file
              ? { ...uf, progress: 100, status: "completed" }
              : uf
          )
        );
        await uploadAndScan(file);
      } catch {
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === file
              ? { ...uf, status: "error" }
              : uf
          )
        );
      }
    }

    setSelectedFiles([]);
    setTimeout(() => setCurrentStep("summary"), 800);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
  };

  const handleReset = () => {
    setCurrentStep("upload");
    setSelectedFiles([]);
    setUploadingFiles([]);
  };


  return (
    <div className="w-full max-w-2xl mx-auto px-4">
          <AnimatePresence mode="wait">
            {currentStep === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-1">Carregar Documentos</h2>
                  <p className="text-sm text-muted-foreground">
                    Arraste ficheiros ou clique para selecionar
                  </p>
                </div>

                {/* Upload Area */}
                <label className="block cursor-pointer">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.png,.jpeg"
                      onChange={handleFileChange}
                      disabled={uploadingFiles.some((f) => f.status === "uploading")}
                      className="hidden"
                      multiple
                    />

                    <div className="flex justify-center mb-3">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">
                      Clique ou arraste ficheiros
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG • Máx 50MB
                    </p>
                  </div>
                </label>

                {/* Selected Files */}
                <AnimatePresence>
                  {selectedFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <p className="text-sm font-medium">
                        {selectedFiles.length} ficheiro(s) selecionado(s)
                      </p>
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center gap-2 p-2 rounded bg-primary/10"
                        >
                          {getFileIcon(file)}
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(idx)}
                            className="hover:bg-primary/20 p-1 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Uploading Progress */}
                <AnimatePresence>
                  {uploadingFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-4 border-t"
                    >
                      {uploadingFiles.map((uf, idx) => (
                        <div
                          key={`${uf.file.name}-${idx}`}
                          className="p-3 rounded border bg-muted/50"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {uf.status === "completed" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : uf.status === "error" ? (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            )}
                            <span className="text-sm font-medium flex-1 truncate">
                              {uf.file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {uf.progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${uf.progress}%` }}
                              transition={{ duration: 0.2 }}
                            />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-3 rounded bg-red-50 border border-red-200 flex gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAttachFiles}
                    disabled={
                      selectedFiles.length === 0 ||
                      uploadingFiles.some((f) => f.status === "uploading")
                    }
                  >
                    Analisar
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === "summary" && (
              <motion.div
                key="summary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <AnimatePresence>
                  {result && !scanning ? (
                    <ScannerResults result={result} onClose={handleReset} />
                  ) : (
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-12 h-12 border-3 border-slate-200 border-t-slate-900 rounded-full mx-auto mb-4"
                      />
                      <p className="text-sm text-slate-600 font-medium">
                        Processando análise...
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
    </div>
  );
}
