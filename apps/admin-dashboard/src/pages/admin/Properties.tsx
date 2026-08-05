import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit2,
  Trash2,
  Search as SearchIcon,
  MapPin,
  Tag,
  MoreHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import DirhamIcon from "@/components/icons/DirhamIcon";
import { toast } from "sonner";
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

interface Property {
  id: string;
  _id?: string;
  title: string;
  location: string;
  price: number;
  category: string;
  status: string;
  listedIn?: string;
}

const ManageProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      const { data } = await api.get("/api/dashboard/properties");
      const mappedProperties = (data.properties || []).map((p: any) => ({
        ...p,
        id: p._id || p.id,
      }));
      setProperties(mappedProperties);
    } catch (err) {
      console.error("Failed to fetch properties", err);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      await api.delete(`/api/dashboard/properties/${propertyToDelete}`);
      setProperties(properties.filter((p) => p.id !== propertyToDelete));
      toast.success("Property deleted successfully");
    } catch (err) {
      toast.error("Failed to delete property");
    } finally {
      setPropertyToDelete(null);
    }
  };

  const filteredProperties = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Property Inventory
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            List, edit, and track your property showcase.
          </p>
        </div>
        <Button
          variant="gold"
          asChild
          className="gap-2 w-full sm:w-auto py-6 sm:py-2"
        >
          <Link to="/admin/properties/add">
            <Plus className="w-5 h-5 sm:w-4 sm:h-4" /> Add Property
          </Link>
        </Button>
      </div>

      <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border bg-muted/5">
          <div className="relative max-w-md w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title or location..."
              className="w-full pl-10 pr-4 py-3 md:py-2 rounded-xl bg-background border border-border font-body text-sm outline-none focus:border-gold transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/10 border-b border-border text-[11px] uppercase tracking-[0.15em] font-body font-bold text-muted-foreground">
                <th className="px-6 py-5">Property & Portfolio</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Valuation</th>
                <th className="px-6 py-5">Context</th>
                <th className="px-6 py-5">Listing Status</th>
                <th className="px-6 py-5 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-20 text-center text-muted-foreground animate-pulse"
                  >
                    Scanning database...
                  </td>
                </tr>
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-20 text-center text-muted-foreground"
                  >
                    Zero properties records found.
                  </td>
                </tr>
              ) : (
                filteredProperties.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/5 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="font-display font-bold text-foreground text-sm group-hover:text-gold transition-colors">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        UUID: {p.id.slice(-8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-body text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 opacity-50" />
                        {p.location}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-display font-medium text-gold flex items-center gap-1.5">
                      <DirhamIcon size={14} className="opacity-70" />
                      {p.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-bold rounded border border-primary/10">
                        {p.listedIn || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-[9px] uppercase font-black tracking-tighter rounded-full border ${
                          p.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${p.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`}
                        />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:bg-gold/10 hover:text-gold border border-transparent hover:border-gold/20"
                          asChild
                        >
                          <Link to={`/admin/properties/edit/${p.id}`}>
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setPropertyToDelete(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden divide-y divide-border">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground italic">
              Synchronizing assets...
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              Empty results.
            </div>
          ) : (
            filteredProperties.map((p) => (
              <div key={p.id} className="p-4 space-y-4 hover:bg-muted/5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-bold text-foreground leading-tight">
                      {p.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                      REF: {p.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-border"
                      asChild
                    >
                      <Link to={`/admin/properties/edit/${p.id}`}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-border text-destructive hover:bg-destructive/5"
                      onClick={() => setPropertyToDelete(p.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Price
                    </span>
                    <p className="text-sm font-display font-bold text-gold flex items-center gap-1.5">
                      <DirhamIcon size={12} className="opacity-70" />
                      {p.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Status
                    </span>
                    <div>
                      <span
                        className={`inline-flex items-center text-[9px] font-black tracking-wider uppercase ${p.status === "active" ? "text-emerald-600" : "text-amber-600"}`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{p.location}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-primary px-2 py-0.5 text-white rounded uppercase">
                    {p.listedIn || "N/A"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AlertDialog
        open={!!propertyToDelete}
        onOpenChange={(open) => !open && setPropertyToDelete(null)}
      >
        <AlertDialogContent className="font-body max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold text-xl text-foreground">
              Delete Property
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-2">
              Are you absolutely sure you want to delete this property? This
              action cannot be undone and will permanently remove this property
              from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <AlertDialogCancel className="font-bold uppercase tracking-wider text-[11px] rounded-full px-6 flex-1 sm:flex-none">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold uppercase tracking-wider text-[11px] rounded-full px-6 flex-1 sm:flex-none border-none"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ManageProperties;
