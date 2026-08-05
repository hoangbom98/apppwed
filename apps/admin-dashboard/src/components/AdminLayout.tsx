import { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import { Navigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const token = localStorage.getItem("accessToken");
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Synchronize desktop/mobile state
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      // On desktop transition, open sidebar by default if closed
      if (desktop) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Set initial state correctly
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar on navigation on mobile
  useEffect(() => {
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isDesktop]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-muted/20 flex overflow-x-hidden relative">
      {/* Sidebar Overlay for Mobile/Tablet */}
      {!isDesktop && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component - z-70 to stay above overlay */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobile={!isDesktop}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isDesktop ? (isSidebarOpen ? "pl-64" : "pl-24") : "pl-0"
        }`}
      >
        {/* Mobile Navbar Top Bar */}
        {!isDesktop && (
          <header className="sticky top-0 z-50 w-full bg-primary border-b border-white/10 p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              <span className="text-white font-display font-bold text-sm tracking-widest uppercase">
                Admin
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 active:scale-90 transition-transform"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </header>
        )}

        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
