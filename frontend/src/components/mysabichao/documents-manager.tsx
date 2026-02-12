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
  FolderSync,
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
import { BorderRotate } from "@/components/ui/animated-gradient-border";

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

interface UploadingFile {
  id: string;
  name: string;
  size: number;
}

export function DocumentsManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

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

  const handleSyncFromDisk = async () => {
    try {
      setSyncing(true);
      const res = (await api.documents.syncFromDisk()) as {
        message?: string;
        created?: number;
      };
      toast.success(res?.message ?? "Sincronização concluída.");
      await loadDocuments();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao sincronizar ficheiros",
      );
    } finally {
      setSyncing(false);
    }
  };

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

    const uploadingFile: UploadingFile = {
      id: `uploading-${Date.now()}`,
      name: file.name,
      size: file.size,
    };

    try {
      setUploading(true);
      setUploadingFiles((prev) => [...prev, uploadingFile]);
      await api.documents.upload(file);
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
      setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFile.id));
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

  const isEmpty =
    !loading && uploadingFiles.length === 0 && documents.length === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Estatísticas — mobile: cards compactos com elevação; desktop: 3 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <BorderRotate gradientColors={{ primary: '#1e3a5f', secondary: '#3b82f6', accent: '#93c5fd' }} backgroundColor="var(--card)" borderRadius={16} borderWidth={2}>
        <Card className="rounded-2xl border-0 shadow-(--shadow-surface) overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center shrink-0 ring-1 ring-blue-500/10 dark:ring-blue-400/20">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">{totalDocuments}</div>
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">Documentos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        </BorderRotate>
        <BorderRotate gradientColors={{ primary: '#14532d', secondary: '#22c55e', accent: '#86efac' }} backgroundColor="var(--card)" borderRadius={16} borderWidth={2}>
        <Card className="rounded-2xl border-0 shadow-(--shadow-surface) overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/10 dark:ring-emerald-400/20">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">{indexedDocuments}</div>
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">Indexados</div>
              </div>
            </div>
          </CardContent>
        </Card>
        </BorderRotate>
        <BorderRotate gradientColors={{ primary: '#2d2d2d', secondary: '#6b7280', accent: '#d1d5db' }} backgroundColor="var(--card)" borderRadius={16} borderWidth={2}>
        <Card className="rounded-2xl border-0 shadow-(--shadow-surface) overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-500/10 dark:bg-slate-400/10 flex items-center justify-center shrink-0 ring-1 ring-slate-500/10 dark:ring-slate-400/20">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">{totalSections}</div>
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">Secções</div>
              </div>
            </div>
          </CardContent>
        </Card>
        </BorderRotate>
      </div>

      {/* Upload — mobile/tablet: stack; desktop: row */}
      <Card className="rounded-2xl border border-border/70 shadow-(--shadow-surface) overflow-hidden min-w-0">
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:gap-0 lg:flex-row lg:items-center lg:justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                Upload de ficheiros
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                PDF, DOCX, TXT, MD (até 50MB). Ou copia para backend/uploads/ e usa Sincronizar.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto lg:w-auto">
              <Button
                variant="outline"
                size="default"
                disabled={syncing}
                onClick={handleSyncFromDisk}
                title="Registar na base de dados os ficheiros em backend/uploads/"
                className="w-full sm:w-auto min-h-[48px] rounded-xl border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/50 font-medium"
              >
                {syncing ? (
                  <>
                    <Spinner variant="bars" className="h-4 w-4 shrink-0" />
                    <span>A sincronizar…</span>
                  </>
                ) : (
                  <>
                    <FolderSync className="h-4 w-4 shrink-0" />
                    <span>Sincronizar pasta</span>
                  </>
                )}
              </Button>
              <Input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <Button
                disabled={uploading}
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full sm:w-auto min-h-[48px] rounded-xl touch-manipulation font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {uploading ? (
                  <>
                    <Spinner variant="bars" className="h-4 w-4 shrink-0" />
                    <span>A carregar...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 shrink-0" />
                    <span>Carregar ficheiro</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos Indexados */}
      <Card className="rounded-2xl border border-border/70 shadow-(--shadow-surface) overflow-hidden">
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="mb-4 sm:mb-5">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
              Documentos Indexados
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Ficheiros disponíveis para pesquisa no assistente
            </p>
          </div>

          {loading && uploadingFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-3">
              <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">A carregar lista...</p>
            </div>
          ) : isEmpty ? (
            <div className="text-center py-12 sm:py-16 px-4 rounded-xl bg-muted/30 border border-dashed border-border">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/70 mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">Nenhum documento indexado</p>
              <p className="text-xs text-muted-foreground">Carregue ficheiros ou use Sincronizar pasta.</p>
            </div>
          ) : (
            <>
              {/* Mobile e tablet: cards (até lg) */}
              <div className="lg:hidden space-y-4 min-w-0">
                {uploadingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-2xl border border-border/70 bg-muted/20 dark:bg-muted/10 p-4 flex items-center gap-4 shadow-(--shadow-surface)"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {file.name.length > 40 ? `${file.name.slice(0, 40)}…` : file.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        .{getFileExtension(file.name)} · {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-400/20 dark:text-blue-300 dark:border-blue-800">
                      <Spinner variant="bars" className="w-3 h-3 mr-1.5" />
                      A carregar
                    </Badge>
                  </div>
                ))}
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-(--shadow-surface) active:shadow-(--shadow-elevated) transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {doc.originalName.length > 40 ? `${doc.originalName.slice(0, 40)}…` : doc.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          .{getFileExtension(doc.originalName)} · {formatFileSize(doc.size)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {doc.chunksCount ?? 0} {doc.chunksCount === 1 ? "secção" : "secções"}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatDate(doc.processedAt || doc.uploadedAt)}
                        </span>
                        {doc.processedAt ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-400/20 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1.5 shrink-0" />
                            Indexado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-800">
                            <Spinner variant="bars" className="w-3 h-3 mr-1.5 shrink-0" />
                            Processando
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDocumentToDelete(doc._id);
                          setDeleteDialogOpen(true);
                        }}
                        className="min-h-[44px] rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 shrink-0"
                        aria-label="Eliminar documento"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop (lg+): tabela com scroll horizontal se necessário */}
              <div className="hidden lg:block rounded-xl border border-border/60 overflow-hidden min-w-0">
                <div className="overflow-x-auto overscroll-x-contain min-w-0" style={{ WebkitOverflowScrolling: "touch" }}>
                  <Table className="min-w-[680px]">
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold whitespace-nowrap">FICHEIRO</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap">TAMANHO</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap">SECÇÕES</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap">ESTADO</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap">DATA</TableHead>
                        <TableHead className="font-semibold w-[80px] whitespace-nowrap">AÇÕES</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadingFiles.map((file) => (
                        <TableRow key={file.id} className="bg-muted/20">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate max-w-[200px]">{file.name}</div>
                                <div className="text-xs text-muted-foreground">.{getFileExtension(file.name)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatFileSize(file.size)}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300">
                              <Spinner variant="bars" className="w-3 h-3 mr-1" />
                              A carregar...
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">-</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" disabled className="opacity-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {documents.map((doc) => (
                        <TableRow key={doc._id} className="border-border/40">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate max-w-[220px]">{doc.originalName}</div>
                                <div className="text-xs text-muted-foreground">.{getFileExtension(doc.originalName)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatFileSize(doc.size)}</TableCell>
                          <TableCell>
                            {doc.chunksCount ?? 0} {doc.chunksCount === 1 ? "secção" : "secções"}
                          </TableCell>
                          <TableCell>
                            {doc.processedAt ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Indexado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                                <Spinner variant="bars" className="w-3 h-3 mr-1" />
                                Processando
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(doc.processedAt || doc.uploadedAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDocumentToDelete(doc._id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] min-w-[44px] rounded-lg"
                              aria-label="Eliminar documento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="z-[300] max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar este documento? A ação não pode ser desfeita e todos os chunks associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
