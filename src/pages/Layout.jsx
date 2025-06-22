

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Wallet, LifeBuoy, Settings, Users, MessageSquare, Calculator, LogOut, PlayCircle } from "lucide-react";
import { User } from "@/api/entities";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "Dashboard" },
    { name: "Bankrolls", icon: Wallet, path: "Bankrolls" },
    { name: "Calculadora Surebet", icon: Calculator, path: "SurebetCalculator" },
    { name: "Tutoriais", icon: PlayCircle, path: "Tutorials" },
    { name: "Suporte", icon: LifeBuoy, path: "Support" },
  ];

  if (user?.role === "admin") {
    menuItems.push(
      { name: "Admin", icon: Users, path: "Admin" },
      { name: "Tickets", icon: MessageSquare, path: "AdminTickets" }
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 bg-[#1a1d27] text-white flex flex-col">
        <div className="p-3 border-b border-gray-700">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">B</span>
            </div>
            <span className="text-lg font-bold">BetTracker</span>
          </Link>
        </div>
        
        <nav className="p-3 space-y-1 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                currentPageName === item.path
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="p-3 border-t border-gray-700">
            <Link
              to={createPageUrl("Settings")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm mb-1 border border-blue-700 bg-blue-600 hover:bg-blue-700 ${
                currentPageName === "Settings"
                  ? "bg-blue-500 text-white"
                  : "text-white"
              }`}
            >
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                {user.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="truncate">{user.full_name || "Usuário"}</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm w-full text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto bg-[#12141c]">
        {children}
      </main>
    </div>
  );
}

