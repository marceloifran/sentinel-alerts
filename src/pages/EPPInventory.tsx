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
  getEPPItems,
  addEPPItem,
  updateEPPItem,
  deleteEPPItem,
  type EPPItem,
} from "@/services/eppService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Boxes,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "cabeza", label: "Protección Craneana (Cascos)" },
  { value: "manos", label: "Protección de Manos (Guantes)" },
  { value: "pies", label: "Protección de Pies (Calzado)" },
  { value: "ocular", label: "Protección Ocular (Anteojos)" },
  { value: "auditivo", label: "Protección Auditiva (Tapones/Copas)" },
  { value: "respiratorio", label: "Protección Respiratoria (Semimáscaras)" },
  { value: "altura", label: "Trabajo en Altura (Arneses)" },
  { value: "cuerpo", label: "Ropa de Trabajo / Cuerpo" },
  { value: "otro", label: "Otros Elementos / Herramientas" },
];

export default function EPPInventory() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const companyId = profile?.company_id;

  const [items, setItems] = useState<EPPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialog states
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [activeItem, setActiveItem] = useState<EPPItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("cabeza");
  const [stock, setStock] = useState(0);
  const [typeModel, setTypeModel] = useState("");
  const [brand, setBrand] = useState("");
  const [certified, setCertified] = useState("Si");

  useEffect(() => {
    if (!companyId) return;
    loadItems();

    // Auto-reload data on voice change event
    const handleDataChange = () => {
      loadItems();
    };

    window.addEventListener("epp-data-changed", handleDataChange);
    return () => {
      window.removeEventListener("epp-data-changed", handleDataChange);
    };
  }, [companyId]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getEPPItems(companyId!);
      setItems(data);
    } catch (err: any) {
      toast.error("Error al cargar inventario: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleOpenAdd = () => {
    setName("");
    setDescription("");
    setCategory("cabeza");
    setStock(0);
    setTypeModel("");
    setBrand("");
    setCertified("Si");
    setIsOpenAdd(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.warning("El nombre del EPP es obligatorio");
      return;
    }
    try {
      await addEPPItem(companyId!, {
        name,
        description: description || null,
        category,
        stock,
        type_model: typeModel || null,
        brand: brand || null,
        certified,
      });
      toast.success("Elemento catalogado con éxito");
      setIsOpenAdd(false);
      loadItems();
    } catch (err: any) {
      toast.error("Error al catalogar: " + err.message);
    }
  };

  const handleOpenEdit = (item: EPPItem) => {
    setActiveItem(item);
    setName(item.name);
    setDescription(item.description || "");
    setCategory(item.category);
    setStock(item.stock);
    setTypeModel(item.type_model || "");
    setBrand(item.brand || "");
    setCertified(item.certified);
    setIsOpenEdit(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    if (!name) {
      toast.warning("El nombre del EPP es obligatorio");
      return;
    }
    try {
      await updateEPPItem(activeItem.id, {
        name,
        description: description || null,
        category,
        stock,
        type_model: typeModel || null,
        brand: brand || null,
        certified,
      });
      toast.success("Catálogo actualizado");
      setIsOpenEdit(false);
      loadItems();
    } catch (err: any) {
      toast.error("Error al actualizar: " + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = window.confirm(`¿Está seguro que desea eliminar ${name} del catálogo?`);
    if (!confirm) return;
    try {
      await deleteEPPItem(id);
      toast.success("Elemento eliminado");
      loadItems();
    } catch (err: any) {
      toast.error("Error al eliminar: " + err.message);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.type_model && item.type_model.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, categoryFilter]);

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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Catálogo de EPP</h1>
            <p className="text-sm text-slate-400 dark:text-slate-550">Administrá el stock y tipos de Elementos de Protección Personal habilitados.</p>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl h-11 px-5 font-semibold text-sm shadow-sm border-0"
          >
            <Plus size={16} /> Catalogar EPP
          </Button>
        </div>

        {/* Filter and search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-450 dark:text-slate-500" />
            <Input
              placeholder="Buscar EPP por nombre, modelo, marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white dark:bg-[#080b11] border-slate-250 dark:border-slate-900 rounded-xl text-slate-900 dark:text-white text-sm shadow-sm focus-visible:ring-emerald-500/20"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select-field select-field-lg"
            >
              <option value="all" className="dark:bg-[#0c101d]">Todas las categorías</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="dark:bg-[#0c101d]">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white dark:bg-[#080b11] rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Cargando catálogo...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <Boxes size={40} className="text-slate-300 dark:text-slate-800 mb-3" />
              <p className="font-semibold text-slate-650 dark:text-slate-400 text-base mb-1">No se encontraron elementos de protección</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Cargá artículos a tu inventario para poder asignarlos.</p>
              <Button onClick={handleOpenAdd} variant="outline" className="rounded-xl border-slate-250 dark:border-slate-800 dark:text-slate-300">
                Catalogar primer EPP
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-900">
                    <TableRow>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-350">Elemento</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-350">Marca / Modelo</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-350">Certificación</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-350">Stock</TableHead>
                      <TableHead className="text-right font-bold text-slate-700 dark:text-slate-350">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const catLabel = CATEGORIES.find((c) => c.value === item.category)?.label || "Otro";
                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 border-b border-slate-100 dark:border-slate-900/80">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                              <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">
                                {catLabel}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {item.brand || "-"} {item.type_model ? `/ ${item.type_model}` : ""}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                              item.certified === "Si" 
                                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" 
                                : "bg-slate-105 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                            }`}>
                              {item.certified === "Si" ? "Homologado (Sí)" : "No"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-mono font-bold text-sm ${
                                item.stock <= 5 ? "text-amber-600 dark:text-amber-400 font-extrabold" : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {item.stock} u.
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(item)}
                                title="Editar"
                                className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                              >
                                <Edit2 size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id, item.name)}
                                title="Eliminar"
                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-900 bg-white dark:bg-[#080b11]">
                {filteredItems.map((item) => {
                  const catLabel = CATEGORIES.find((c) => c.value === item.category)?.label || "Otro";
                  return (
                    <div key={item.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white text-base truncate">{item.name}</p>
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-550 text-xs mt-0.5">
                            {catLabel}
                          </span>
                          <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                            Marca/Modelo: <span className="font-semibold text-slate-800 dark:text-white">{item.brand || "-"} {item.type_model ? `/ ${item.type_model}` : ""}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            item.certified === "Si" 
                              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" 
                              : "bg-slate-105 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                          }`}>
                            {item.certified === "Si" ? "Homologado" : "No"}
                          </span>
                          <span
                            className={`font-mono font-bold text-xs ${
                              item.stock <= 5 ? "text-amber-600 dark:text-amber-400 font-extrabold" : "text-slate-650 dark:text-slate-405"
                            }`}
                          >
                            Stock: <span className="text-sm font-extrabold">{item.stock} u.</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-900/60">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Acciones</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 text-xs gap-1 rounded-lg text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900"
                          >
                            <Edit2 size={12} /> Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id, item.name)}
                            className="h-8 text-xs gap-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 size={12} /> Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add EPP Dialog */}
      <Dialog open={isOpenAdd} onOpenChange={setIsOpenAdd}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Catalogar EPP</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAdd} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nombre del EPP *</label>
              <Input
                placeholder="Ej. Casco de Seguridad Amarillo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-field select-field-md"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="dark:bg-[#0c101d]">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Marca</label>
                <Input
                  placeholder="Ej. MSA"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Modelo / Tipo</label>
                <Input
                  placeholder="Ej. H-700"
                  value={typeModel}
                  onChange={(e) => setTypeModel(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Stock Inicial</label>
                <div className="relative">
                  <PackageCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Homologado / Certificado?</label>
                <select
                  value={certified}
                  onChange={(e) => setCertified(e.target.value)}
                  className="select-field select-field-md"
                >
                  <option value="Si" className="dark:bg-[#0c101d]">Sí</option>
                  <option value="No" className="dark:bg-[#0c101d]">No</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Descripción / Especificaciones</label>
              <Input
                placeholder="Ej. Talle M, homologado SRT, filtro UV"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpenAdd(false)} className="rounded-xl border-slate-200 dark:border-slate-800 dark:text-slate-355">
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 font-bold">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit EPP Dialog */}
      <Dialog open={isOpenEdit} onOpenChange={setIsOpenEdit}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Editar EPP</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nombre del EPP *</label>
              <Input
                placeholder="Ej. Casco de Seguridad Amarillo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-field select-field-md"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="dark:bg-[#0c101d]">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Marca</label>
                <Input
                  placeholder="Ej. MSA"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Modelo / Tipo</label>
                <Input
                  placeholder="Ej. H-700"
                  value={typeModel}
                  onChange={(e) => setTypeModel(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Stock</label>
                <div className="relative">
                  <PackageCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Homologado / Certificado?</label>
                <select
                  value={certified}
                  onChange={(e) => setCertified(e.target.value)}
                  className="select-field select-field-md"
                >
                  <option value="Si" className="dark:bg-[#0c101d]">Sí</option>
                  <option value="No" className="dark:bg-[#0c101d]">No</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Descripción / Especificaciones</label>
              <Input
                placeholder="Ej. Talle M, homologado SRT, filtro UV"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpenEdit(false)} className="rounded-xl border-slate-200 dark:border-slate-800 dark:text-slate-355">
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 font-bold">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
