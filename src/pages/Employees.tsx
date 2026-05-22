import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getEPPDeliveries,
  addEPPDelivery,
  signEPPDelivery,
  getEPPItems,
  getSignatureUrl,
  generateForm299PDF,
  type Employee,
  type EPPDelivery,
  type EPPItem,
} from "@/services/eppService";
import { useAuth } from "@/contexts/AuthContext";
import { SignaturePad } from "@/components/SignaturePad";
import {
  Search,
  Plus,
  UserPlus,
  FileDown,
  Edit2,
  Trash2,
  Phone,
  Briefcase,
  IdCard,
  FileSignature,
  Eye,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export default function Employees() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const companyId = profile?.company_id;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [eppItems, setEppItems] = useState<EPPItem[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<EPPDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);

  // Detail Modal states
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [sigUrls, setSigUrls] = useState<Record<string, string>>({});

  // Quick delivery state inside details
  const [quickEppId, setQuickEppId] = useState("");
  const [quickQty, setQuickQty] = useState(1);
  const [quickNotes, setQuickNotes] = useState("");
  const [savingQuickDelivery, setSavingQuickDelivery] = useState(false);

  // In-situ signature inside details
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [deliveryToSign, setDeliveryToSign] = useState<EPPDelivery | null>(null);

  // General Form states
  const [name, setName] = useState("");
  const [dniCuil, setDniCuil] = useState("");
  const [fileNumber, setFileNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("activo");
  const [jobDescription, setJobDescription] = useState("");
  const [requiredEpps, setRequiredEpps] = useState("");

  useEffect(() => {
    if (!companyId) return;
    loadData();

    // Auto-reload data on voice change event
    const handleDataChange = () => {
      loadData();
    };

    window.addEventListener("epp-data-changed", handleDataChange);
    return () => {
      window.removeEventListener("epp-data-changed", handleDataChange);
    };
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empList, eppList, delList] = await Promise.all([
        getEmployees(companyId!),
        getEPPItems(companyId!),
        getEPPDeliveries(companyId!),
      ]);
      setEmployees(empList);
      setEppItems(eppList);
      setAllDeliveries(delList);
    } catch (err: any) {
      toast.error("Error al cargar datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load signature URLs whenever deliveries change
  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      const signedDels = allDeliveries.filter((d) => d.status === "firmado" && d.signature_path);
      for (const del of signedDels) {
        if (del.signature_path && !sigUrls[del.id]) {
          try {
            const url = await getSignatureUrl(del.signature_path);
            urls[del.id] = url;
          } catch (err) {
            console.error(err);
          }
        }
      }
      setSigUrls((prev) => ({ ...prev, ...urls }));
    };
    loadUrls();
  }, [allDeliveries]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleOpenAdd = () => {
    setName("");
    setDniCuil("");
    setFileNumber("");
    setJobTitle("");
    setPhone("");
    setStatus("activo");
    setJobDescription("");
    setRequiredEpps("");
    setIsOpenAdd(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dniCuil) {
      toast.warning("Nombre y DNI/CUIL son obligatorios");
      return;
    }
    try {
      await addEmployee(companyId!, {
        name,
        dni_cuil: dniCuil,
        file_number: fileNumber || null,
        job_title: jobTitle || null,
        phone: phone || null,
        status,
        job_description: jobDescription || null,
        required_epps: requiredEpps || null,
      });
      toast.success("Trabajador registrado con éxito");
      setIsOpenAdd(false);
      loadData();
    } catch (err: any) {
      toast.error("Error al agregar operario: " + err.message);
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setActiveEmployee(emp);
    setName(emp.name);
    setDniCuil(emp.dni_cuil);
    setFileNumber(emp.file_number || "");
    setJobTitle(emp.job_title || "");
    setPhone(emp.phone || "");
    setStatus(emp.status);
    setJobDescription(emp.job_description || "");
    setRequiredEpps(emp.required_epps || "");
    setIsOpenEdit(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;
    if (!name || !dniCuil) {
      toast.warning("Nombre y DNI/CUIL son obligatorios");
      return;
    }
    try {
      await updateEmployee(activeEmployee.id, {
        name,
        dni_cuil: dniCuil,
        file_number: fileNumber || null,
        job_title: jobTitle || null,
        phone: phone || null,
        status,
        job_description: jobDescription || null,
        required_epps: requiredEpps || null,
      });
      toast.success("Trabajador actualizado");
      setIsOpenEdit(false);
      loadData();

      // If details dialog is active, update the displayed employee ref
      if (selectedEmployeeForDetail?.id === activeEmployee.id) {
        const updatedEmp = employees.find((x) => x.id === activeEmployee.id);
        if (updatedEmp) {
          setSelectedEmployeeForDetail(updatedEmp);
        }
      }
    } catch (err: any) {
      toast.error("Error al actualizar operario: " + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = window.confirm(`¿Está seguro que desea dar de baja al operario ${name}?`);
    if (!confirm) return;

    try {
      await deleteEmployee(id);
      toast.success("Operario de baja");
      loadData();
    } catch (err: any) {
      toast.error("Error al eliminar: " + err.message);
    }
  };

  // Open worker details delivery log
  const handleOpenDetails = (emp: Employee) => {
    setSelectedEmployeeForDetail(emp);
    setQuickEppId(eppItems[0]?.id || "");
    setQuickQty(1);
    setQuickNotes("");
    setShowDetailDialog(true);
  };

  const handleAddQuickDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForDetail || !quickEppId) {
      toast.warning("Seleccione un EPP");
      return;
    }

    try {
      setSavingQuickDelivery(true);
      const newDel = await addEPPDelivery(companyId!, {
        employee_id: selectedEmployeeForDetail.id,
        epp_item_id: quickEppId,
        quantity: quickQty,
        delivery_date: new Date().toISOString().split("T")[0],
        supervisor_id: user!.id,
        status: "pendiente",
        notes: quickNotes || "Entrega directa desde ficha de operario",
      });

      toast.success("Entrega registrada. Lista para firmar.");
      setQuickQty(1);
      setQuickNotes("");
      
      // Reload lists
      await loadData();

      // Trigger signature dialog immediately for this delivery!
      setDeliveryToSign(newDel);
      setShowSignatureDialog(true);
    } catch (err: any) {
      toast.error("Error al registrar entrega: " + err.message);
    } finally {
      setSavingQuickDelivery(false);
    }
  };

  const handleOpenSignature = (del: EPPDelivery) => {
    setDeliveryToSign(del);
    setShowSignatureDialog(true);
  };

  const handleSaveSignature = async (sigBase64: string) => {
    if (!deliveryToSign) return;
    try {
      toast.loading("Guardando firma...");
      await signEPPDelivery(deliveryToSign.id, sigBase64);
      toast.dismiss();
      toast.success("Entrega firmada correctamente.");
      setShowSignatureDialog(false);
      setDeliveryToSign(null);
      await loadData();
    } catch (err: any) {
      toast.dismiss();
      toast.error("Error al guardar firma: " + err.message);
    }
  };

  const handleDownloadF299 = async (emp: Employee) => {
    try {
      toast.loading(`Generando Planilla 299 para ${emp.name}...`);
      const signedDeliveries = allDeliveries.filter(
        (d) => d.employee_id === emp.id && d.status === "firmado"
      );

      if (signedDeliveries.length === 0) {
        toast.dismiss();
        toast.warning(`No hay entregas firmadas para ${emp.name}. Por favor, firme las entregas pendientes primero.`);
        return;
      }

      const companyInfo = {
        name: profile?.company_name || "Constructora Sentinel",
        cuit: profile?.company_cuit || "30-12345678-9",
      };
      await generateForm299PDF(companyInfo, emp, signedDeliveries);
      toast.dismiss();
      toast.success("Planilla 299 descargada");
    } catch (err: any) {
      toast.dismiss();
      toast.error("Error al generar PDF: " + err.message);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.dni_cuil.includes(searchQuery) ||
        (e.job_title && e.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [employees, searchQuery]);

  // Filter deliveries for the currently focused worker detail modal
  const activeEmployeeDeliveries = useMemo(() => {
    if (!selectedEmployeeForDetail) return [];
    return allDeliveries.filter((d) => d.employee_id === selectedEmployeeForDetail.id);
  }, [allDeliveries, selectedEmployeeForDetail]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#04060a] text-slate-800 dark:text-slate-200 transition-colors duration-250">
      <Header
        userName={profile?.name || user?.email || "Usuario"}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        userPlan={profile?.plan}
      />

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Operarios de Obra</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500">Registrá y gestioná el personal de campo para la entrega de EPP.</p>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl h-11 px-5 font-semibold text-sm shadow-sm border-0"
          >
            <Plus size={16} /> Registrar Operario
          </Button>
        </div>

        {/* Filter and search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-450 dark:text-slate-500" />
          <Input
            placeholder="Buscar por nombre, DNI o cargo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white dark:bg-[#080b11] border-slate-250 dark:border-slate-900 rounded-xl text-slate-900 dark:text-white text-sm shadow-sm focus-visible:ring-emerald-500/20"
          />
        </div>

        {/* Workers Table */}
        <div className="bg-white dark:bg-[#080b11] rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Cargando operarios...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <UserPlus size={40} className="text-slate-300 dark:text-slate-800 mb-3" />
              <p className="font-semibold text-slate-600 dark:text-slate-400 text-base mb-1">No se encontraron operarios</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Cargá a los trabajadores para poder registrar sus entregas.</p>
              <Button onClick={handleOpenAdd} variant="outline" className="rounded-xl border-slate-250 dark:border-slate-800 dark:text-slate-300">
                Registrar primer operario
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-900">
                    <TableRow>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-350">Nombre</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-350">DNI / CUIL</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-350">Puesto</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-350">Legajo</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-350">Estado</TableHead>
                      <TableHead className="text-right font-bold text-slate-700 dark:text-slate-350">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 border-b border-slate-100 dark:border-slate-900/80">
                        <TableCell className="font-semibold text-slate-900 dark:text-white">
                          <button
                            onClick={() => handleOpenDetails(emp)}
                            className="hover:underline text-left text-emerald-600 hover:text-emerald-700 font-bold"
                          >
                            {emp.name}
                          </button>
                        </TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 font-mono text-xs">{emp.dni_cuil}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">{emp.job_title || "General"}</TableCell>
                        <TableCell className="text-slate-455 dark:text-slate-500 text-xs font-semibold">{emp.file_number || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              emp.status === "activo"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30"
                                : "bg-slate-105 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            {emp.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDetails(emp)}
                              title="Ficha y Entrega"
                              className="h-8 w-8 text-slate-400 hover:text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                            >
                              <Eye size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadF299(emp)}
                              title="Descargar Planilla Legal 299"
                              className="h-8 w-8 text-slate-400 hover:text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                            >
                              <FileDown size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(emp)}
                              title="Editar"
                              className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(emp.id, emp.name)}
                              title="Dar de baja"
                              className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-900 bg-white dark:bg-[#080b11]">
                {filteredEmployees.map((emp) => (
                  <div key={emp.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => handleOpenDetails(emp)}
                          className="hover:underline text-left text-emerald-650 dark:text-emerald-500 font-bold text-base"
                        >
                          {emp.name}
                        </button>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mt-0.5">{emp.job_title || "General"}</p>
                        <p className="text-slate-455 dark:text-slate-500 font-mono text-xs mt-1">
                          DNI: {emp.dni_cuil} | Legajo: {emp.file_number || "-"}
                        </p>
                      </div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          emp.status === "activo"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30"
                            : "bg-slate-105 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-900/60">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Acciones</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(emp)}
                          className="h-8 text-xs gap-1 rounded-lg text-emerald-600 hover:bg-emerald-55 dark:hover:bg-emerald-500/10"
                        >
                          <Eye size={12} /> Ficha
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadF299(emp)}
                          className="h-8 text-xs gap-1 rounded-lg text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          <FileDown size={12} /> F299
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(emp)}
                          className="h-8 text-xs gap-1 rounded-lg text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          <Edit2 size={12} /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="h-8 text-xs gap-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Worker Detail & EPP History Modal */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800">
          {selectedEmployeeForDetail && (
            <>
              <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <DialogTitle className="flex items-center justify-between text-slate-900 dark:text-white text-lg">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedEmployeeForDetail.name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-405 mt-1 font-mono">
                      DNI: {selectedEmployeeForDetail.dni_cuil} | Legajo: {selectedEmployeeForDetail.file_number || "-"}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDownloadF299(selectedEmployeeForDetail)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs gap-1 px-3 border-0 h-9 font-bold"
                  >
                    <FileDown size={12} /> Planilla 299
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Job Info Card */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Puesto / Especialidad</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedEmployeeForDetail.job_title || "General"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Descripción de Tareas</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {selectedEmployeeForDetail.job_description || "Sin descripción cargada."}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">EPP Requeridos</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {selectedEmployeeForDetail.required_epps || "Sin requerimientos cargados."}
                    </p>
                  </div>
                </div>

                {/* Record EPP Quick Form */}
                <form onSubmit={handleAddQuickDelivery} className="bg-slate-50/50 dark:bg-[#0f1423] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Entregar EPP a este trabajador</h3>
                  
                  {eppItems.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">No hay EPP catalogados en inventario.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] text-slate-450 dark:text-slate-450 font-bold uppercase">Elemento</label>
                          <select
                            value={quickEppId}
                            onChange={(e) => setQuickEppId(e.target.value)}
                            className="select-field select-field-sm dark:bg-[#070b13]"
                          >
                            {eppItems.map((item) => (
                              <option key={item.id} value={item.id} className="dark:bg-[#0c101d]">
                                {item.name} (Stock: {item.stock})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-455 dark:text-slate-450 font-bold uppercase">Cantidad</label>
                          <Input
                            type="number"
                            min="1"
                            value={quickQty}
                            onChange={(e) => setQuickQty(Number(e.target.value))}
                            className="h-9 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070b13] text-slate-900 dark:text-white text-xs rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-450 dark:text-slate-450 font-bold uppercase">Notas</label>
                        <Input
                           placeholder="Reemplazo, desgaste, etc."
                          value={quickNotes}
                          onChange={(e) => setQuickNotes(e.target.value)}
                          className="h-9 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070b13] text-slate-900 dark:text-white text-xs rounded-lg"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={savingQuickDelivery}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white w-full rounded-lg text-xs h-9 font-bold border-0 mt-1"
                      >
                        {savingQuickDelivery ? "Registrando..." : "Registrar y Firmar Entrega"}
                      </Button>
                    </>
                  )}
                </form>

                {/* EPP History Log */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Historial de Entregas</h3>
                  
                  {activeEmployeeDeliveries.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No hay entregas registradas para este operario.</p>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/40">
                      {activeEmployeeDeliveries.map((del) => (
                        <div key={del.id} className="p-3.5 flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-850 dark:text-slate-200">
                                {del.quantity} u. de {del.epp_item?.name || "EPP"}
                              </span>
                              <span className="text-[9px] text-slate-450 dark:text-slate-500">{del.delivery_date}</span>
                            </div>
                            {del.notes && <p className="text-[10px] text-slate-450 dark:text-slate-500 italic mt-0.5">"{del.notes}"</p>}
                            
                            {/* Hand-drawn signature preview */}
                            {del.status === "firmado" && sigUrls[del.id] && (
                              <div className="mt-2 flex items-center gap-1.5">
                                <span className="text-[9px] text-slate-450 dark:text-slate-550">Firma:</span>
                                <img
                                  src={sigUrls[del.id]}
                                  className="h-7 object-contain bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-800 rounded px-1"
                                  alt="Firma"
                                />
                              </div>
                            )}
                          </div>

                          <div className="shrink-0">
                            {del.status === "firmado" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30 px-2 py-0.5 rounded-full">
                                <Check size={10} /> Firmado
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleOpenSignature(del)}
                                className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-7 px-2.5 rounded-lg border-0 gap-1 font-bold"
                              >
                                <FileSignature size={11} /> Firmar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
                <Button
                  onClick={() => setShowDetailDialog(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs px-4 border-0"
                >
                  Cerrar Ficha
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Worker Dialog */}
      <Dialog open={isOpenAdd} onOpenChange={setIsOpenAdd}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Registrar Operario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAdd} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo *</label>
              <Input
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-905 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">DNI / CUIL *</label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="20-12345678-9"
                    value={dniCuil}
                    onChange={(e) => setDniCuil(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-905 dark:text-white font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Legajo (Opcional)</label>
                <Input
                  placeholder="Ej. 1045"
                  value={fileNumber}
                  onChange={(e) => setFileNumber(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-905 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Puesto / Cargo</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Ej. Oficial Carpintero"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-905 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="+54 9..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-905 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase">Breve descripción del puesto de trabajo</label>
              <textarea
                placeholder="Ej. Operario de Tareas Generales en Obra: Excavación Manual y Movimiento de Suelos..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full min-h-[70px] p-3 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl text-slate-900 dark:text-white text-xs shadow-sm resize-none focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase">EPPs Requeridos / Necesarios</label>
              <textarea
                placeholder="Ej. Casco de Seguridad / Gafas Transparentes / Guantes de Vaqueta / Protectores Auditivos..."
                value={requiredEpps}
                onChange={(e) => setRequiredEpps(e.target.value)}
                className="w-full min-h-[70px] p-3 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl text-slate-900 dark:text-white text-xs shadow-sm resize-none focus:outline-none focus:border-emerald-500"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpenAdd(false)} className="rounded-xl border-slate-200 dark:border-slate-800 dark:text-slate-350">
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 font-bold">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Worker Dialog */}
      <Dialog open={isOpenEdit} onOpenChange={setIsOpenEdit}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Editar Operario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo *</label>
              <Input
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">DNI / CUIL *</label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="20-12345678-9"
                    value={dniCuil}
                    onChange={(e) => setDniCuil(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Legajo</label>
                <Input
                  placeholder="Ej. 1045"
                  value={fileNumber}
                  onChange={(e) => setFileNumber(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Puesto / Cargo</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Ej. Oficial Carpintero"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="+54 9..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase">Breve descripción del puesto de trabajo</label>
              <textarea
                placeholder="Ej. Operario de Tareas Generales en Obra: Excavación Manual y Movimiento de Suelos..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full min-h-[70px] p-3 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl text-slate-900 dark:text-white text-xs shadow-sm resize-none focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase">EPPs Requeridos / Necesarios</label>
              <textarea
                placeholder="Ej. Casco de Seguridad / Gafas Transparentes / Guantes de Vaqueta / Protectores Auditivos..."
                value={requiredEpps}
                onChange={(e) => setRequiredEpps(e.target.value)}
                className="w-full min-h-[70px] p-3 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl text-slate-900 dark:text-white text-xs shadow-sm resize-none focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="select-field select-field-md"
              >
                <option value="activo" className="dark:bg-[#0c101d]">Activo</option>
                <option value="inactivo" className="dark:bg-[#0c101d]">Inactivo</option>
              </select>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpenEdit(false)} className="rounded-xl border-slate-200 dark:border-slate-800 dark:text-slate-350">
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 font-bold">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signature Capture Pad Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d]">
          <SignaturePad
            title={`Firma de ${deliveryToSign?.employee?.name || "Operario"}`}
            onSave={handleSaveSignature}
            onCancel={() => setShowSignatureDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
