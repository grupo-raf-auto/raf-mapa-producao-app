"use client";

import { useState, useEffect } from "react";
import { apiClient as api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  CheckCircle,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Document {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  processedAt?: string;
  vectorIds?: string[];
  isActive: boolean;
  chunksCount?: number;
}

export function DocumentsManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.documents.getAll();
      setDocuments(docs);
    } catch (error: any) {
      toast.error("Erro ao carregar documentos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Carregar documentos inicialmente
  useEffect(() => {
    loadDocuments();
  }, []);

  // Polling automático para documentos em processamento
  useEffect(() => {
    const hasProcessingDocuments = documents.some((doc) => !doc.processedAt);
    
    if (!hasProcessingDocuments) {
      return; // Não há documentos processando, não precisa de polling
    }

    // Polling a cada 3 segundos enquanto houver documentos processando
    const intervalId = setInterval(() => {
      loadDocuments();
    }, 3000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de ficheiro
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de ficheiro não suportado. Use PDF, DOCX, TXT ou MD.");
      return;
    }

    // Validar tamanho (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Ficheiro muito grande. Tamanho máximo: 50MB");
      return;
    }

    try {
      setUploading(true);
      const result = await api.documents.upload(file);
      toast.success(
        "Documento enviado com sucesso! Processamento em andamento...",
      );
      await loadDocuments();
      // Resetar input
      event.target.value = "";
    } catch (error: any) {
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await api.documents.delete(documentToDelete);
      toast.success("Documento deletado com sucesso");
      await loadDocuments();
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error: any) {
      toast.error("Erro ao deletar documento: " + error.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}, ${hours}:${minutes}`;
  };

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  // Calcular estatísticas
  const totalDocuments = documents.length;
  const indexedDocuments = documents.filter((d) => d.processedAt).length;
  const totalSections = documents.reduce(
    (sum, d) => sum + (d.chunksCount || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{totalDocuments}</div>
                <div className="text-sm text-muted-foreground">Documentos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">
                  {indexedDocuments}
                </div>
                <div className="text-sm text-muted-foreground">Indexados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{totalSections}</div>
                <div className="text-sm text-muted-foreground">Secções</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Upload de ficheiros
              </h3>
              <p className="text-sm text-muted-foreground">
                Formatos: PDF, DOCX, TXT (até 50MB) | Ou copia para
                backend/uploads/
              </p>
            </div>
            <div>
              <Input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById("file-upload")?.click()}
                className={uploading ? "opacity-75 cursor-not-allowed" : ""}
              >
                {uploading ? (
                  <>
                    <Spinner variant="bars" className="w-4 h-4 mr-2" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Carregar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">
              Documentos Indexados
            </h3>
            <p className="text-sm text-muted-foreground">
              Ficheiros disponíveis para pesquisa
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner variant="bars" className="w-6 h-6 text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhum documento indexado ainda
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>FICHEIRO</TableHead>
                    <TableHead>TAMANHO</TableHead>
                    <TableHead>SECÇÕES</TableHead>
                    <TableHead>ESTADO</TableHead>
                    <TableHead>DATA</TableHead>
                    <TableHead>AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {doc.originalName.length > 40
                                ? `${doc.originalName.substring(0, 40)}...`
                                : doc.originalName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              .{getFileExtension(doc.originalName)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(doc.size)}</TableCell>
                      <TableCell>
                        {doc.chunksCount || 0}{" "}
                        {doc.chunksCount === 1 ? "secção" : "secções"}
                      </TableCell>
                      <TableCell>
                        {doc.processedAt ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Indexado
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          >
                            <Spinner variant="bars" className="w-3 h-3 mr-1" />
                            Processando
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(
                          doc.processedAt || doc.uploadedAt,
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDocumentToDelete(doc._id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este documento? Esta ação não pode
              ser desfeita e todos os chunks associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
