import { useState } from "react";
import { Plus, Edit2, Trash2, X, Building2, Droplet, RotateCw, Circle, GitBranch } from "lucide-react";
import type { Building } from "../data/mockData";

interface ManagementProps {
  buildings: Building[];
  onAddToast: (msg: string, type: "success" | "warning" | "error") => void;
}

type Tab = "buildings" | "tanks" | "pumps" | "valves" | "pipelines";

const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "buildings", label: "Buildings", icon: Building2 },
  { id: "tanks",     label: "Tanks",     icon: Droplet    },
  { id: "pumps",     label: "Pumps",     icon: RotateCw   },
  { id: "valves",    label: "Valves",    icon: Circle     },
  { id: "pipelines", label: "Pipelines", icon: GitBranch  },
];

const pipelineColors: Record<string, string> = {
  clean: "var(--accent-cyan)", recycled: "#10b981", sewage: "#8b5cf6",
};

const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 8px rgba(14,165,233,0.05)" };
const inputStyle = {
  background: "var(--bg-primary)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  outline: "none",
  width: "100%",
} as const;

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(30,58,138,0.12)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-2xl w-full max-w-md alert-enter" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", boxShadow: "0 16px 48px rgba(14,165,233,0.15)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
          <button onClick={onClose} className="hover:opacity-60 transition-opacity" style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

export default function Management({ buildings, onAddToast }: ManagementProps) {
  const [activeTab, setActiveTab] = useState<Tab>("buildings");
  const [modal, setModal] = useState<{ type: string; item?: Record<string, unknown> } | null>(null);

  const openAdd  = (type: string) => setModal({ type });
  const openEdit = (type: string, item: Record<string, unknown>) => setModal({ type, item });
  const closeModal = () => setModal(null);
  const handleSave   = () => { onAddToast(`${modal?.item ? "Updated" : "Added"} successfully`, "success"); closeModal(); };
  const handleDelete = (name: string) => { onAddToast(`"${name}" deleted`, "warning"); };

  const headerStyle = {
    background: "var(--bg-primary)",
    borderBottom: "1px solid var(--border)",
    color: "var(--text-muted)",
  };

  const rowHover = "hover:bg-blue-50 transition-colors";

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Management</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Configure buildings, tanks, pumps, valves, and pipelines</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", width: "fit-content" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono transition-all"
              style={{
                background: active ? "var(--bg-subtle)" : "transparent",
                color:      active ? "var(--accent-blue)" : "var(--text-muted)",
                border:     active ? "1px solid var(--border-strong)" : "1px solid transparent",
              }}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Buildings */}
      {activeTab === "buildings" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => openAdd("building")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono font-bold text-white hover:opacity-90"
              style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}>
              <Plus size={14} /> Add Building
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="grid text-xs font-mono uppercase tracking-wider px-5 py-3"
              style={{ gridTemplateColumns: "1fr 1fr 80px 100px", ...headerStyle }}>
              <span>Name</span><span>Location</span><span>Floors</span><span>Actions</span>
            </div>
            {buildings.map((b) => (
              <div key={b.id} className={`grid items-center px-5 py-4 ${rowHover}`}
                style={{ gridTemplateColumns: "1fr 1fr 80px 100px", borderBottom: "1px solid var(--bg-primary)" }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{b.name}</div>
                  <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{b.id}</div>
                </div>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{b.location}</span>
                <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{b.floors}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit("building", b as unknown as Record<string, unknown>)} className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors" style={{ color: "var(--accent-cyan)" }}><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(b.name)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: "#ef4444" }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tanks */}
      {activeTab === "tanks" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => openAdd("tank")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono font-bold text-white hover:opacity-90"
              style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}>
              <Plus size={14} /> Add Tank
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="grid text-xs font-mono uppercase tracking-wider px-5 py-3"
              style={{ gridTemplateColumns: "1fr 1fr 80px 80px 80px 100px", ...headerStyle }}>
              <span>Building</span><span>Tank</span><span>Type</span><span>Capacity</span><span>Level</span><span>Actions</span>
            </div>
            {buildings.flatMap((b) => b.tanks.map((t) => (
              <div key={t.id} className={`grid items-center px-5 py-3 ${rowHover}`}
                style={{ gridTemplateColumns: "1fr 1fr 80px 80px 80px 100px", borderBottom: "1px solid var(--bg-primary)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{b.name}</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.name}</span>
                <span className="text-xs font-mono" style={{ color: t.type === "overhead" ? "var(--accent-cyan)" : "#10b981" }}>{t.type.toUpperCase()}</span>
                <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{(t.capacity / 1000).toFixed(0)}kL</span>
                <span className="text-xs font-mono font-bold" style={{ color: t.currentLevel < t.criticalThreshold ? "var(--danger-text)" : t.currentLevel < t.lowThreshold ? "var(--warning-text)" : "#10b981" }}>
                  {Math.round(t.currentLevel)}%
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit("tank", t as unknown as Record<string, unknown>)} className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors" style={{ color: "var(--accent-cyan)" }}><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(t.name)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: "#ef4444" }}><Trash2 size={14} /></button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Pumps */}
      {activeTab === "pumps" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => openAdd("pump")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono font-bold text-white hover:opacity-90"
              style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}>
              <Plus size={14} /> Add Pump
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="grid text-xs font-mono uppercase tracking-wider px-5 py-3"
              style={{ gridTemplateColumns: "1fr 1fr 90px 90px 90px 100px", ...headerStyle }}>
              <span>Building</span><span>Pump</span><span>Status</span><span>Flow</span><span>Runtime</span><span>Actions</span>
            </div>
            {buildings.flatMap((b) => b.pumps.map((p) => (
              <div key={p.id} className={`grid items-center px-5 py-3 ${rowHover}`}
                style={{ gridTemplateColumns: "1fr 1fr 90px 90px 90px 100px", borderBottom: "1px solid var(--bg-primary)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{b.name}</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                <span className="text-xs font-mono font-bold" style={{ color: p.status === "running" ? "var(--accent-cyan)" : p.status === "fault" ? "var(--danger-text)" : "#94a3b8" }}>
                  {p.status.toUpperCase()}
                </span>
                <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{p.flowRate} L/m</span>
                <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{p.runtime}h</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit("pump", p as unknown as Record<string, unknown>)} className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors" style={{ color: "var(--accent-cyan)" }}><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(p.name)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: "#ef4444" }}><Trash2 size={14} /></button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Valves */}
      {activeTab === "valves" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => openAdd("valve")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono font-bold text-white hover:opacity-90"
              style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}>
              <Plus size={14} /> Add Valve
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="grid text-xs font-mono uppercase tracking-wider px-5 py-3"
              style={{ gridTemplateColumns: "1fr 1fr 90px 90px 80px 100px", ...headerStyle }}>
              <span>Building</span><span>Valve</span><span>Status</span><span>Pipeline</span><span>Override</span><span>Actions</span>
            </div>
            {buildings.flatMap((b) => b.valves.map((v) => (
              <div key={v.id} className={`grid items-center px-5 py-3 ${rowHover}`}
                style={{ gridTemplateColumns: "1fr 1fr 90px 90px 80px 100px", borderBottom: "1px solid var(--bg-primary)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{b.name}</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{v.name}</span>
                <span className="text-xs font-mono font-bold" style={{ color: v.status === "open" ? "#10b981" : v.status === "stuck" ? "var(--danger-text)" : "#94a3b8" }}>
                  {v.status.toUpperCase()}
                </span>
                <span className="text-xs font-mono" style={{ color: pipelineColors[v.pipelineType] }}>{v.pipelineType.toUpperCase()}</span>
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{v.manualOverride ? "MANUAL" : "AUTO"}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit("valve", v as unknown as Record<string, unknown>)} className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors" style={{ color: "var(--accent-cyan)" }}><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(v.name)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: "#ef4444" }}><Trash2 size={14} /></button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Pipelines */}
      {activeTab === "pipelines" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => openAdd("pipeline")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono font-bold text-white hover:opacity-90"
              style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}>
              <Plus size={14} /> Add Pipeline
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="grid text-xs font-mono uppercase tracking-wider px-5 py-3"
              style={{ gridTemplateColumns: "1fr 1fr 80px 80px 80px 100px", ...headerStyle }}>
              <span>Building</span><span>Pipeline</span><span>Type</span><span>Active</span><span>Flow</span><span>Actions</span>
            </div>
            {buildings.flatMap((b) => b.pipelines.map((pl) => (
              <div key={pl.id} className={`grid items-center px-5 py-3 ${rowHover}`}
                style={{ gridTemplateColumns: "1fr 1fr 80px 80px 80px 100px", borderBottom: "1px solid var(--bg-primary)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{b.name}</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{pl.name}</span>
                <span className="text-xs font-mono" style={{ color: pipelineColors[pl.type] }}>{pl.type.toUpperCase()}</span>
                <span className="text-xs font-mono font-bold" style={{ color: pl.isActive ? "#10b981" : "#94a3b8" }}>{pl.isActive ? "YES" : "NO"}</span>
                <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{pl.flowRate} L/m</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit("pipeline", pl as unknown as Record<string, unknown>)} className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors" style={{ color: "var(--accent-cyan)" }}><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(pl.name)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: "#ef4444" }}><Trash2 size={14} /></button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={`${modal.item ? "Edit" : "Add"} ${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}`} onClose={closeModal}>
          <div className="flex flex-col gap-4">
            {modal.type === "building" && (
              <>
                <FieldRow label="Building Name"><input style={inputStyle} defaultValue={(modal.item?.name as string) ?? ""} placeholder="e.g. Block A" /></FieldRow>
                <FieldRow label="Location"><input style={inputStyle} defaultValue={(modal.item?.location as string) ?? ""} placeholder="e.g. North Campus" /></FieldRow>
                <FieldRow label="Number of Floors"><input style={inputStyle} type="number" defaultValue={(modal.item?.floors as number) ?? 1} min="1" /></FieldRow>
              </>
            )}
            {modal.type === "tank" && (
              <>
                <FieldRow label="Tank Name"><input style={inputStyle} defaultValue={(modal.item?.name as string) ?? ""} placeholder="e.g. Overhead Tank" /></FieldRow>
                <FieldRow label="Type">
                  <select style={inputStyle} defaultValue={(modal.item?.type as string) ?? "overhead"}>
                    <option value="overhead">Overhead</option>
                    <option value="ground">Ground</option>
                  </select>
                </FieldRow>
                <FieldRow label="Capacity (Liters)"><input style={inputStyle} type="number" defaultValue={(modal.item?.capacity as number) ?? 50000} /></FieldRow>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Low Threshold %"><input style={inputStyle} type="number" defaultValue={(modal.item?.lowThreshold as number) ?? 30} min="0" max="100" /></FieldRow>
                  <FieldRow label="Critical Threshold %"><input style={inputStyle} type="number" defaultValue={(modal.item?.criticalThreshold as number) ?? 15} min="0" max="100" /></FieldRow>
                </div>
              </>
            )}
            {modal.type === "pump" && (
              <>
                <FieldRow label="Pump Name"><input style={inputStyle} defaultValue={(modal.item?.name as string) ?? ""} placeholder="e.g. Main Pump" /></FieldRow>
                <FieldRow label="Flow Rate (L/min)"><input style={inputStyle} type="number" defaultValue={(modal.item?.flowRate as number) ?? 400} /></FieldRow>
              </>
            )}
            {modal.type === "valve" && (
              <>
                <FieldRow label="Valve Name"><input style={inputStyle} defaultValue={(modal.item?.name as string) ?? ""} placeholder="e.g. Inlet Valve" /></FieldRow>
                <FieldRow label="Pipeline Type">
                  <select style={inputStyle} defaultValue={(modal.item?.pipelineType as string) ?? "clean"}>
                    <option value="clean">Clean Water</option>
                    <option value="recycled">Recycled</option>
                    <option value="sewage">Sewage</option>
                  </select>
                </FieldRow>
              </>
            )}
            {modal.type === "pipeline" && (
              <>
                <FieldRow label="Pipeline Name"><input style={inputStyle} defaultValue={(modal.item?.name as string) ?? ""} placeholder="e.g. Clean Water Main" /></FieldRow>
                <FieldRow label="Type">
                  <select style={inputStyle} defaultValue={(modal.item?.type as string) ?? "clean"}>
                    <option value="clean">Clean Water</option>
                    <option value="recycled">Recycled</option>
                    <option value="sewage">Sewage</option>
                  </select>
                </FieldRow>
                <FieldRow label="Flow Rate (L/min)"><input style={inputStyle} type="number" defaultValue={(modal.item?.flowRate as number) ?? 300} /></FieldRow>
              </>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 px-4 py-2 rounded-xl text-sm font-mono hover:bg-blue-50 transition-colors"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-xl text-sm font-mono font-bold text-white hover:opacity-90"
                style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}>
                {modal.item ? "Save Changes" : "Add"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
