import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import BuildingDetail from "./pages/BuildingDetail";
import AlertsPage from "./pages/Alerts";
import LogsPage from "./pages/Logs";
import { useSimulation } from "./hooks/useSimulation";
import Login from "./pages/Login";
import { loadSession, logout as clearSession, type AuthUser } from "./auth/auth";

type Page = "dashboard" | "buildings" | "alerts" | "logs";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("aquaflow-theme") === "dark");
  const [detailBuildingId, setDetailBuildingId] = useState<string | null>(null);
  const [detailBuildingName, setDetailBuildingName] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(() => localStorage.getItem("aquaflow-site"));
  const [user, setUser] = useState<AuthUser | null>(() => loadSession());

  const {
    buildings,
    alerts,
    logs,
    wsConnected,
    acknowledgeAlert,
    toggleValve,
  } = useSimulation();

  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  useEffect(() => {
    localStorage.setItem("aquaflow-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleViewBuilding = (id: string, name: string) => {
    setDetailBuildingId(id);
    setDetailBuildingName(name);
    setCurrentPage("buildings");
  };

  const handleLogin = (u: AuthUser) => {
    setUser(u);
    setSelectedSite(null);
    localStorage.removeItem("aquaflow-site");
  };

  const handleLogout = () => {
    clearSession();
    localStorage.removeItem("aquaflow-site");
    setUser(null);
    setSelectedSite(null);
    setDetailBuildingId(null);
    setDetailBuildingName(null);
    setCurrentPage("dashboard");
  };

  const detailBuilding = detailBuildingId ? buildings.find((b) => b.id === detailBuildingId) : null;

  if (!user) {
    return (
      <div
        data-theme={darkMode ? "dark" : "light"}
        className="bg-app"
        style={{ fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif" }}
      >
        <Login
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          onLogin={handleLogin}
        />
      </div>
    );
  }

  return (
    <div
      data-theme={darkMode ? "dark" : "light"}
      className="flex h-screen overflow-hidden bg-app text-primary"
      style={{ fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif" }}
    >
      {/* Sidebar */}
      <div
        className={`${mobileSidebarOpen ? "flex" : "hidden md:flex"} fixed inset-y-0 left-0 z-40 h-full flex-shrink-0 md:relative md:inset-auto md:z-auto`}
      >
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            if (page !== "buildings") setDetailBuildingId(null);
            setMobileSidebarOpen(false);
          }}
          alertCount={unreadAlerts}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Navbar
          alerts={alerts}
          wsConnected={wsConnected}
          selectedSite={selectedSite}
          onSelectSite={(site) => {
            setSelectedSite(site);
            localStorage.setItem("aquaflow-site", site);
            setDetailBuildingId(null);
            setCurrentPage("dashboard");
          }}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          sidebarOpen={mobileSidebarOpen}
          onToggleSidebar={() => setMobileSidebarOpen((open) => !open)}
          user={user}
        />

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {currentPage === "dashboard" && (
            <Dashboard
              buildings={buildings}
              alerts={alerts}
              selectedSite={selectedSite}
              onSelectBuilding={handleViewBuilding}
            />
          )}

          {currentPage === "buildings" && (
            detailBuilding ? (
              <BuildingDetail
                building={detailBuildingName ? { ...detailBuilding, name: detailBuildingName } : detailBuilding}
                role={user.role}
                onBack={() => setDetailBuildingId(null)}
                onToggleValve={toggleValve}
              />
            ) : (
              <Dashboard
                buildings={buildings}
                alerts={alerts}
                selectedSite={selectedSite}
                onSelectBuilding={handleViewBuilding}
              />
            )
          )}

          {currentPage === "alerts" && (
            <AlertsPage alerts={alerts} onAcknowledge={acknowledgeAlert} />
          )}

          {currentPage === "logs" && <LogsPage logs={logs} />}
        </main>
      </div>

      {/* Toasts */}
      {/* <ToastContainer toasts={toasts} onDismiss={dismissToast} /> */}

      {/* Connection badge */}
      {!wsConnected && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono z-50"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", color: "#b45309" }}
        >
          <span className="w-2 h-2 rounded-full bg-yellow-400 pulse-glow" />
          Connecting to data stream...
        </div>
      )}
    </div>
  );
}
