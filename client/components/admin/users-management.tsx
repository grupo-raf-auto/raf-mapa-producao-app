"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient as api } from "@/lib/api-client";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
  ChevronDown,
  MailCheck,
  MailX,
  Settings2,
} from "lucide-react";
import { UserModelsModal } from "./user-models-modal";

interface User {
  _id: string;
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: "admin" | "user";
  status: "pending" | "approved" | "rejected";
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

interface Stats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [modelsModalOpen, setModelsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        api.users.getAll(),
        api.users.getStats(),
      ]);
      setUsers(usersData);
      setStats(statsData.stats);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await api.users.approve(userId);
      toast.success("Utilizador aprovado com sucesso");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao aprovar utilizador: " + error.message);
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      await api.users.reject(userId);
      toast.success("Utilizador rejeitado");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao rejeitar utilizador: " + error.message);
    }
  };

  const changeRole = async (userId: string, newRole: "admin" | "user") => {
    try {
      await api.users.update(userId, { role: newRole });
      toast.success("Role atualizado com sucesso");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao atualizar role: " + error.message);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este utilizador?")) return;
    try {
      await api.users.delete(userId);
      toast.success("Utilizador eliminado com sucesso");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao eliminar utilizador: " + error.message);
    }
  };

  const openModelsModal = (user: User) => {
    setSelectedUserId(user._id || user.id);
    setSelectedUserName(getUserDisplayName(user));
    setModelsModalOpen(true);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.firstName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (user.lastName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || user.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, filterStatus]);

  const getUserDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    if (user.name) return user.name;
    return user.email.split("@")[0];
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex items-center justify-center py-10">
          <Spinner variant="bars" className="w-6 h-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-2 border-transparent">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-amber-600">
                  {stats?.pendingUsers || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {stats?.approvedUsers || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-red-200 bg-red-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejeitados</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats?.rejectedUsers || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por email ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-muted"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(
              [
                { value: "all", label: "Todos" },
                { value: "pending", label: "Pendentes" },
                { value: "approved", label: "Aprovados" },
                { value: "rejected", label: "Rejeitados" },
              ] as const
            ).map((filter) => (
              <Button
                key={filter.value}
                variant={filterStatus === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(filter.value)}
                className="rounded-full"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">UTILIZADOR</TableHead>
              <TableHead className="font-semibold">EMAIL VERIFICADO</TableHead>
              <TableHead className="font-semibold">STATUS</TableHead>
              <TableHead className="font-semibold">ROLE</TableHead>
              <TableHead className="text-right font-semibold">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum utilizador encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user._id || user.id}>
                  {/* User Info */}
                  <TableCell>
                    <div>
                      <p className="font-medium">{getUserDisplayName(user)}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </TableCell>

                  {/* Email Verified */}
                  <TableCell>
                    {user.emailVerified ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <MailCheck className="w-4 h-4" />
                        <span className="text-sm">Verificado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MailX className="w-4 h-4" />
                        <span className="text-sm">Não verificado</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.status === "approved"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : user.status === "pending"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-red-200 bg-red-50 text-red-700"
                      }
                    >
                      {user.status === "approved"
                        ? "Aprovado"
                        : user.status === "pending"
                          ? "Pendente"
                          : "Rejeitado"}
                    </Badge>
                  </TableCell>

                  {/* Role Dropdown */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`gap-1 rounded-full ${
                            user.role === "admin"
                              ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {user.role === "admin" ? "ADMIN" : "USER"}
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={() => changeRole(user._id || user.id, "user")}
                          disabled={user.role === "user"}
                        >
                          USER
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => changeRole(user._id || user.id, "admin")}
                          disabled={user.role === "admin"}
                        >
                          ADMIN
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveUser(user._id || user.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                          >
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectUser(user._id || user.id)}
                            className="rounded-lg"
                          >
                            Rejeitar
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-lg"
                        onClick={() => openModelsModal(user)}
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Modelos</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteUser(user._id || user.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* User Models Modal */}
      {selectedUserId && (
        <UserModelsModal
          open={modelsModalOpen}
          onOpenChange={setModelsModalOpen}
          userId={selectedUserId}
          userName={selectedUserName}
        />
      )}
    </div>
  );
}
