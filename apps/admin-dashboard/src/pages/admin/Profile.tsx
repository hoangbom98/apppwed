import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  User as UserIcon,
  Shield,
  Key,
  Mail,
  Phone as PhoneIcon,
  Info,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface UserProfile {
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  about?: string;
  avatar?: string;
}

const AdminProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    about: "",
  });

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/api/auth/profile");
      setProfile(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phoneNumber: data.phoneNumber || "",
        about: data.about || "",
      });
    } catch (err) {
      console.error("Failed to fetch profile", err);
      toast.error("Failed to load profile settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Using PATCH/PUT as defined in backend routes
      await api.request("PUT", "/api/auth/profile", { data: formData });

      toast.success("Profile updated successfully");
      fetchProfile(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-gold/20 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground font-title">
          Account Settings
        </h1>
        <p className="text-muted-foreground font-body">
          Manage your personal information and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Quick View */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-xl p-8 shadow-sm border border-border text-center overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-gold/20 z-0"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center text-gold mx-auto mb-4 border-4 border-background shadow-lg overflow-hidden">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10" />
                )}
              </div>
              <h3 className="font-display font-bold text-xl text-foreground capitalize">
                {profile?.name || "Admin User"}
              </h3>
              <p className="text-sm text-muted-foreground font-body mb-6">
                Master Agent Account
              </p>
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-xs font-body text-muted-foreground">
                  <Mail className="w-4 h-4 text-gold shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-background rounded-xl p-8 shadow-sm border border-border"
          >
            <div className="flex items-center gap-3 pb-6 border-b border-border mb-6">
              <Shield className="w-5 h-5 text-gold" />
              <h4 className="font-display font-bold text-lg text-foreground uppercase tracking-widest">
                Personal Details
              </h4>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase flex items-center gap-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <PhoneIcon className="w-3 h-3 text-gold" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                    value={formData.phoneNumber}
                    placeholder="+971 -- --- ----"
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                    Email (Read-only)
                  </label>
                  <div className="w-full bg-muted/10 border border-border rounded-lg px-4 py-2.5 font-body text-sm text-muted-foreground opacity-60 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {profile?.email}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <Info className="w-3 h-3 text-gold" /> Short Bio
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                    value={formData.about}
                    placeholder="Tell clients about your expertise..."
                    onChange={(e) =>
                      setFormData({ ...formData, about: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="gold"
                  size="lg"
                  className="min-w-[160px] gap-2"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    "Updating..."
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
