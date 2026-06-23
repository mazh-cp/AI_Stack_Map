import { useEffect, useState } from "react";
import {
  UserCog,
  Users,
  Plus,
  Trash2,
  KeyRound,
  X,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { PageHeader } from "../components/layout/Layout";
import { api, type ManagedUser, type Role } from "../api/client";
import { LOCALES } from "../i18n";

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "owner", label: "Owner", desc: "Full access incl. user management" },
  { value: "appsec", label: "AppSec", desc: "Controls, risks, models, scans" },
  { value: "soc", label: "SOC", desc: "Risks, scans, inspections" },
  { value: "viewer", label: "Viewer", desc: "Read-only" },
];

export function Settings() {
  const { currentUser, settings, updateMySettings, projects, can, pushToast } =
    useStore();
  const canManageUsers = can("users:manage");

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Your profile, preferences, and (for owners) user management"
      />
      <div className="space-y-6 p-6">
        {/* ── Profile & session ── */}
        <section className="soc-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserCog className="h-4 w-4 text-accent" />
            <p className="stat-label">Profile &amp; Session</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Name">
              <p className="text-sm font-medium text-white">{currentUser?.name ?? "—"}</p>
            </Field>
            <Field label="Email">
              <p className="text-sm text-gray-300">{currentUser?.email ?? "—"}</p>
            </Field>
            <Field label="Role">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                <ShieldCheck className="h-3.5 w-3.5" />
                {ROLES.find((r) => r.value === currentUser?.role)?.label ?? currentUser?.role}
              </span>
            </Field>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            You are signed in with a private session (httpOnly cookie). Signing in
            elsewhere creates a separate session; your preferences below follow
            your account, not the browser.
          </p>
        </section>

        {/* ── Preferences (per-user, server-saved) ── */}
        <section className="soc-card p-5">
          <p className="stat-label mb-4">Preferences</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Language">
              <select
                value={settings.locale ?? "en"}
                onChange={(e) =>
                  updateMySettings({ locale: e.target.value as "en" | "es" })
                }
                className="input-soc"
              >
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-base-card">
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default project">
              <select
                value={settings.defaultProjectId ?? ""}
                onChange={(e) =>
                  updateMySettings({ defaultProjectId: e.target.value })
                }
                className="input-soc"
              >
                <option value="" className="bg-base-card">
                  None (first project)
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-base-card">
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <label className="mt-4 flex cursor-pointer items-center justify-between rounded-md border border-base-border bg-base-bg/40 px-3 py-2 text-sm text-gray-300 sm:max-w-sm">
            Email notifications
            <input
              type="checkbox"
              checked={!!settings.emailNotifications}
              onChange={(e) =>
                updateMySettings({ emailNotifications: e.target.checked })
              }
              className="toggle toggle-primary toggle-sm"
            />
          </label>
          <p className="mt-2 text-xs text-gray-500">
            Preferences save to your account automatically.
          </p>
        </section>

        {/* ── User management (owner only) ── */}
        {canManageUsers && <UserManagement pushToast={pushToast} />}
      </div>
    </div>
  );
}

function UserManagement({
  pushToast,
}: {
  pushToast: (t: { kind: "error" | "success" | "info"; message: string }) => void;
}) {
  const currentUser = useStore((s) => s.currentUser);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [resetFor, setResetFor] = useState<ManagedUser | null>(null);

  const load = async () => {
    try {
      setUsers(await api.users.list());
    } catch {
      pushToast({ kind: "error", message: "Couldn't load users." });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeRole = async (u: ManagedUser, role: Role) => {
    try {
      await api.users.update(u.id, { role });
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role } : x)));
      pushToast({ kind: "success", message: `${u.name} is now ${role}.` });
    } catch (e) {
      pushToast({
        kind: "error",
        message:
          (e as { status?: number }).status === 400
            ? "Cannot demote the last owner."
            : "Couldn't update role.",
      });
    }
  };

  const remove = async (u: ManagedUser) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})?`)) return;
    try {
      await api.users.remove(u.id);
      setUsers((list) => list.filter((x) => x.id !== u.id));
      pushToast({ kind: "success", message: `${u.name} deleted.` });
    } catch {
      pushToast({ kind: "error", message: "Couldn't delete user." });
    }
  };

  return (
    <section className="soc-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <p className="stat-label">User Management</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-[#0f172a] hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" /> Add user
        </button>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-gray-500">Loading users…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-border text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Role</th>
                <th className="px-2 py-2 font-medium">Created</th>
                <th className="px-2 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-base-border/60">
                  <td className="px-2 py-2.5 font-medium text-white">
                    {u.name}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-[10px] text-gray-500">(you)</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-gray-400">{u.email}</td>
                  <td className="px-2 py-2.5">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      className="rounded-md border border-base-border bg-base-bg px-2 py-1 text-xs text-gray-200 outline-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value} className="bg-base-card">
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2.5 text-gray-500">{u.createdAt}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setResetFor(u)}
                        aria-label={`Reset password for ${u.name}`}
                        title="Reset password"
                        className="rounded-md border border-base-border p-1.5 text-gray-500 hover:bg-base-hover hover:text-gray-300"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(u)}
                        aria-label={`Delete ${u.name}`}
                        title="Delete user"
                        className="rounded-md border border-base-border p-1.5 text-gray-500 hover:bg-status-critical/10 hover:text-status-critical"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onCreated={(u) => {
            setUsers((list) => [...list, u]);
            setShowAdd(false);
            pushToast({ kind: "success", message: `${u.name} created.` });
          }}
          onError={(m) => pushToast({ kind: "error", message: m })}
        />
      )}
      {resetFor && (
        <ResetPasswordModal
          user={resetFor}
          onClose={() => setResetFor(null)}
          onDone={() => {
            setResetFor(null);
            pushToast({ kind: "success", message: "Password updated." });
          }}
          onError={(m) => pushToast({ kind: "error", message: m })}
        />
      )}
    </section>
  );
}

function AddUserModal({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void;
  onCreated: (u: ManagedUser) => void;
  onError: (m: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !name.trim() || password.length < 8) return;
    setBusy(true);
    try {
      const u = await api.users.create({
        email: email.trim(),
        name: name.trim(),
        role,
        password,
      });
      onCreated(u);
    } catch (e) {
      onError(
        (e as { status?: number }).status === 409
          ? "A user with that email already exists."
          : "Couldn't create user (check the fields)."
      );
      setBusy(false);
    }
  };

  return (
    <Modal title="Add user" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-soc" autoFocus />
        </Field>
        <Field label="Email">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input-soc" placeholder="user@checkpoint.com" />
        </Field>
        <Field label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="input-soc">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value} className="bg-base-card">
                {r.label} — {r.desc}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Temporary password (min 8 chars)">
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="text" className="input-soc font-mono" placeholder="At least 8 characters" />
        </Field>
      </div>
      <ModalActions
        onClose={onClose}
        onSubmit={submit}
        submitLabel={busy ? "Creating…" : "Create user"}
        disabled={busy || !email.trim() || !name.trim() || password.length < 8}
      />
    </Modal>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onDone,
  onError,
}: {
  user: ManagedUser;
  onClose: () => void;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (password.length < 8) return;
    setBusy(true);
    try {
      await api.users.update(user.id, { password });
      onDone();
    } catch {
      onError("Couldn't reset password.");
      setBusy(false);
    }
  };
  return (
    <Modal title={`Reset password — ${user.name}`} onClose={onClose}>
      <Field label="New password (min 8 chars)">
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="text"
          autoFocus
          className="input-soc font-mono"
          placeholder="At least 8 characters"
        />
      </Field>
      <ModalActions
        onClose={onClose}
        onSubmit={submit}
        submitLabel={busy ? "Saving…" : "Set password"}
        disabled={busy || password.length < 8}
      />
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="stat-label mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-base-border bg-base-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-base-border px-5 py-4">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-gray-500 hover:bg-base-hover">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({
  onClose,
  onSubmit,
  submitLabel,
  disabled,
}: {
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled: boolean;
}) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button onClick={onClose} className="rounded-lg border border-base-border px-4 py-2 text-sm text-gray-300 hover:bg-base-hover">
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#0f172a] hover:bg-accent/90 disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </div>
  );
}
