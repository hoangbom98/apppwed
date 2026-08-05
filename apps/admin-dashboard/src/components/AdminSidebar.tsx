import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  User,
  LogOut,
  ChevronRight,
  ChevronLeft,
  X,
  Menu,
  FileText,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile?: boolean;
}

const AdminSidebar = ({ isOpen, setIsOpen, isMobile }: AdminSidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Properties", icon: Building2, path: "/admin/properties" },
    { label: "Lead Management", icon: MessageSquare, path: "/admin/inquiries" },
    { label: "KYC Management", icon: FileText, path: "/admin/kyc" },
    { label: "Blogs", icon: FileText, path: "/admin/blogs" },
    { label: "Social Channels", icon: Share2, path: "/admin/channels" },
    { label: "Profile", icon: User, path: "/admin/profile" },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={`h-screen bg-primary border-r border-white/10 flex flex-col fixed left-0 top-0 transition-all duration-300 z-[70] ${
        isMobile
          ? isOpen
            ? "translate-x-0 w-[280px]"
            : "-translate-x-full w-[280px]"
          : isOpen
            ? "w-64"
            : "w-24"
      }`}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between min-h-[64px] bg-primary/20">
        <Link
          to="/"
          onClick={handleLinkClick}
          className="flex items-center gap-3 overflow-hidden group"
        >
          <img
            src="/logo.png"
            alt="Logo"
            className={`h-8 w-auto min-w-[32px] transition-transform group-hover:scale-110 ${!isOpen && !isMobile ? "mx-auto" : ""}`}
          />
          {(isOpen || isMobile) && (
            <span className="text-white font-display font-black text-xs tracking-widest uppercase"></span>
          )}
        </Link>

        {(isOpen || isMobile) && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white/50 hover:text-gold transition-all"
            aria-label="Toggle Sidebar"
          >
            {isMobile ? (
              <X className="w-5 h-5" />
            ) : isOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-3 mt-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              title={!isOpen && !isMobile ? item.label : ""}
              className={`flex items-center p-3 rounded-xl transition-all ${
                isActive
                  ? "bg-gold text-accent-foreground shadow-lg shadow-gold/20 translate-x-1"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              } ${!isOpen && !isMobile ? "justify-center" : "justify-between"}`}
            >
              <div className="flex items-center gap-4">
                <item.icon
                  className={`w-5 h-5 ${!isOpen && !isMobile ? "mx-auto" : ""}`}
                />
                {(isOpen || isMobile) && (
                  <span className="font-body text-sm font-bold whitespace-nowrap tracking-wide">
                    {item.label}
                  </span>
                )}
              </div>
              {(isOpen || isMobile) && isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 bg-primary/10">
        <Button
          variant="ghost"
          className={`w-full text-white/50 hover:bg-red-500/10 hover:text-red-500 gap-4 py-6 rounded-xl transition-all ${
            !isOpen && !isMobile ? "px-0 justify-center" : "justify-start"
          }`}
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
          }}
          title={!isOpen && !isMobile ? "Logout" : ""}
        >
          <LogOut className="w-5 h-5" />
          {(isOpen || isMobile) && (
            <span className="text-sm font-bold tracking-widest uppercase">
              Logout
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
