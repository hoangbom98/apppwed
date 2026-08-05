import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/api/auth/register", {
        data: { name, email, password },
      });

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      toast.success("Registration successful!");
      navigate("/");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Something went wrong. Please check your information.",
      );
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
                Create an Account
              </h1>
              <p className="text-muted-foreground font-body text-sm">
                Join Dubai's premier real estate community
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none border border-border focus:border-gold transition-colors"
                  placeholder="John Doe"
                />
              </div>

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
                <p className="text-xs text-muted-foreground font-body leading-relaxed mt-1">
                  Password must be at least 12 characters and contain an
                  uppercase letter, lowercase letter, number, and special
                  character.
                </p>
              </div>

              <Button
                variant="gold"
                size="lg"
                className="w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Register"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground font-body text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-gold font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Register;
