import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import BuildingDetail from "./pages/BuildingDetail";
import AlertsPage from "./pages/Alerts";
import LogsPage from "./pages/Logs";
import Management from "./pages/Management";
import { useSimulation } from "./hooks/useSimulation";
import Login from "./pages/Login";
import { loadSession, logout as clearSession, type AuthUser } from "./auth/auth";

type Page = "dashboard" | "buildings" | "alerts" | "logs" | "management";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("aquaflow-theme") === "dark");
  const [detailBuildingId, setDetailBuildingId] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [showBrandFooter, setShowBrandFooter] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => loadSession());

  useEffect(() => {
    const onScroll = () => setShowBrandFooter(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const {
    buildings,
    alerts,
    logs,
    wsConnected,
    acknowledgeAlert,
    togglePump,
    toggleValve,
    addToast,
  } = useSimulation();

  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  useEffect(() => {
    localStorage.setItem("aquaflow-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleViewBuilding = (id: string) => {
    setDetailBuildingId(id);
    setCurrentPage("buildings");
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setDetailBuildingId(null);
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
          onLogin={(u) => setUser(u)}
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
      {showBrandFooter && (
        <div
          className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 text-xs font-medium tracking-[0.12em] transition-opacity duration-200"
          style={{ color: "var(--text-muted)", opacity: showBrandFooter ? 1 : 0 }}
        >
          <span style={{ color: "var(--text-muted)" }}>Product by</span>
          <span
            style={{
              background: "linear-gradient(90deg, #ff2227 0%, #9f0000 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            MANU
          </span>
          <span
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.49) 0%, rgba(60, 64, 65, 1) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            Robotics
          </span>
        </div>
      )}
      {/* Sidebar */}
      <div className={`flex-shrink-0 h-full ${sidebarCollapsed ? "hidden md:flex" : "flex"}`}
        style={{ display: sidebarCollapsed ? undefined : "flex" }}
      >
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            if (page !== "buildings") setDetailBuildingId(null);
          }}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
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
            setDetailBuildingId(null);
            setCurrentPage("dashboard");
          }}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
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
                building={detailBuilding}
                role={user.role}
                onBack={() => setDetailBuildingId(null)}
                onTogglePump={togglePump}
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

          {currentPage === "management" && (
            <Management buildings={buildings} onAddToast={addToast} />
          )}
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
