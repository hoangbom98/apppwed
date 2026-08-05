import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/api/auth/login", {
        data: { email, password },
      });

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userRole", data.role);

      toast.success("Logged in successfully!");
      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="relative min-h-screen flex items-center justify-center py-20">
        <div className="absolute inset-0 bg-primary/95 z-0" />
        <div className="relative z-10 w-full max-w-md px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-xl shadow-luxury p-8"
          >
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Welcome Back
              </h1>
              <p className="text-muted-foreground font-body text-sm">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none border border-border focus:border-gold transition-colors"
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">
                    Password
                  </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-muted rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none border border-border focus:border-gold transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <Button
                variant="gold"
                size="lg"
                className="w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Login;
