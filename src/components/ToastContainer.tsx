import { CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "warning" | "error";
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const icons = { success: CheckCircle, warning: AlertTriangle, error: XCircle };
const colors = {
  success: { bg: "var(--success-surface)", border: "var(--success-border)", icon: "var(--success-text)", text: "#15803d" },
  warning: { bg: "var(--warning-surface)", border: "var(--warning-border)", icon: "var(--warning-text)", text: "#b45309" },
  error:   { bg: "var(--danger-surface)", border: "var(--danger-border)", icon: "var(--danger-text)", text: "#b91c1c" },
};

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[100] pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        const c = colors[toast.type];
        return (
          <div
            key={toast.id}
            className="toast-enter pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl max-w-sm"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <Icon size={16} style={{ color: c.icon, flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm flex-1 leading-snug font-medium" style={{ color: c.text }}>{toast.message}</p>
            <button onClick={() => onDismiss(toast.id)} className="flex-shrink-0 transition-opacity hover:opacity-60" style={{ color: c.icon }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
