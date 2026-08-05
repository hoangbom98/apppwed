import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  MessageCircle,
  Hash,
  Youtube,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Channel {
  _id: string;
  name: string;
  url: string;
  icon: string;
  isActive: boolean;
  order: number;
}

const IconOptions = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "telegram", label: "Telegram", icon: Share2 },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "x", label: "X / Twitter", icon: Hash },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "link", label: "Globe / Web", icon: Globe },
];

const ManageChannels = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    icon: "whatsapp",
    isActive: true,
    order: 0,
  });

  const fetchChannels = async () => {
    try {
      const { data } = await api.get("/api/dashboard/channels");
      setChannels(data.channels || []);
    } catch (err) {
      console.error("Failed to fetch channels", err);
      toast.error("Failed to load social channels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleOpenAdd = () => {
    setEditingChannel(null);
    setFormData({
      name: "",
      url: "",
      icon: "whatsapp",
      isActive: true,
      order: channels.length,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      url: channel.url,
      icon: channel.icon,
      isActive: channel.isActive,
      order: channel.order,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this channel?")) return;

    try {
      await api.delete(`/api/dashboard/channels/${id}`);
      toast.success("Channel deleted");
      setChannels(channels.filter((c) => c._id !== id));
    } catch (err) {
      toast.error("Failed to delete channel");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingChannel) {
        const { data } = await api.patch(
          `/api/dashboard/channels/${editingChannel._id}`,
          { data: formData },
        );
        toast.success("Channel updated");
        setChannels(
          channels.map((c) => (c._id === editingChannel._id ? data.channel : c)),
        );
      } else {
        const { data } = await api.post("/api/dashboard/channels", {
          data: formData,
        });
        toast.success("Channel created");
        setChannels([...channels, data.channel]);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed to save channel");
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground font-title">
            Social Channels
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            Manage footer social links and communication channels.
          </p>
        </div>
        <Button variant="gold" onClick={handleOpenAdd} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Add Channel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-20 text-muted-foreground font-body">
            Loading channels...
          </div>
        ) : channels.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground font-body bg-muted/5 rounded-2xl border-2 border-dashed border-border/50">
            <Share2 className="w-12 h-12 mx-auto opacity-20 mb-3" />
            <p>No social channels configured.</p>
          </div>
        ) : (
          channels.map((channel, i) => {
            const iconObj =
              IconOptions.find((io) => io.id === channel.icon) || IconOptions[0];
            const IconComp = iconObj.icon;

            return (
              <motion.div
                key={channel._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-background rounded-xl border p-4 md:p-5 flex flex-col justify-between gap-4 transition-all shadow-sm ${!channel.isActive ? "opacity-60 grayscale border-dashed" : "border-border"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-gold">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base">
                        {channel.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-body truncate max-w-[150px]">
                        {channel.url}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${channel.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}
                  >
                    {channel.isActive ? "Active" : "Hidden"}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-[10px] text-muted-foreground font-body uppercase tracking-tighter">
                    Order: {channel.order}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a href={channel.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(channel)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-3.5 h-3.5 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(channel._id)}
                      className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal / Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 md:p-8"
            >
              <h2 className="text-xl font-bold font-display mb-6">
                {editingChannel ? "Edit Channel" : "Add New Channel"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold font-body">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WhatsApp Support"
                    className="w-full px-4 py-2 rounded-lg bg-muted/20 border-border border focus:ring-1 ring-gold/50 outline-none font-body text-sm"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold font-body">URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-lg bg-muted/20 border-border border focus:ring-1 ring-gold/50 outline-none font-body text-sm"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold font-body">Icon</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg bg-muted/20 border-border border focus:ring-1 ring-gold/50 outline-none font-body text-sm appearance-none"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                    >
                      {IconOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold font-body">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg bg-muted/20 border-border border focus:ring-1 ring-gold/50 outline-none font-body text-sm"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-border text-gold focus:ring-gold"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium font-body"
                  >
                    Visible in Footer
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gold" className="flex-1">
                    {editingChannel ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default ManageChannels;
