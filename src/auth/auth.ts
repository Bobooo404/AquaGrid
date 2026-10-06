export type Role = "admin" | "user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface Account {
  password: string;
  name: string;
  role: Role;
}

export const ACCOUNTS: Record<string, Account> = {
  "admin@aquagrid.io": { password: "admin123", name: "Admin User", role: "admin" },
  "user@aquagrid.io": { password: "user123", name: "Site Viewer", role: "user" },
};

const STORAGE_KEY = "aquagrid-session";

export function login(email: string, password: string): AuthUser | null {
  const account = ACCOUNTS[email.trim().toLowerCase()];
  if (!account || account.password !== password) return null;

  const user: AuthUser = {
    id: email.trim().toLowerCase(),
    name: account.name,
    email: email.trim().toLowerCase(),
    role: account.role,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.email || (parsed.role !== "admin" && parsed.role !== "user")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}
