import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Properties", path: "/properties" },
  { label: "Blog", path: "/blog" },
  { label: "Contact", path: "/contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [user, setUser] = useState<{
    role: string | null;
    isLoggedIn: boolean;
  }>({
    role: localStorage.getItem("userRole"),
    isLoggedIn: !!localStorage.getItem("accessToken"),
  });

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    setUser({ role: null, isLoggedIn: false });
    window.location.href = "/";
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome ? "bg-gradient-hero backdrop-blur-md" : "bg-primary"}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="OMNIS Properties"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-body text-sm tracking-wide transition-colors duration-200 hover:text-gold ${
                  location.pathname === link.path
                    ? "text-gold"
                    : "text-primary-foreground/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="hero-outline" size="sm" asChild>
              <a href="tel:+971588251088">
                <Phone className="w-4 h-4" />
                +971 58 825 1088
              </a>
            </Button>

            {user.isLoggedIn ? (
              <>
                <Button variant="hero-outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
                <Button variant="gold" size="sm" asChild>
                  <Link to="/admin">Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="gold" size="sm" asChild>
                  <Link to="/contact">Enquire Now</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-primary-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-primary border-t border-emerald-light/20"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="font-body text-primary-foreground/80 hover:text-gold py-2 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {user.isLoggedIn ? (
                <>
                  <Button
                    variant="hero-outline"
                    size="lg"
                    className="mt-6"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                  <Button
                    variant="gold"
                    size="lg"
                    asChild
                    className="mt-2 text-primary"
                  >
                    <Link to="/admin" onClick={() => setIsOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="gold"
                    size="lg"
                    asChild
                    className="mt-6 text-primary"
                  >
                    <Link to="/contact" onClick={() => setIsOpen(false)}>
                      Enquire Now
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
