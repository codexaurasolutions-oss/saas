import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { Shield, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  pagePermissions: []
};

const PAGE_GROUP_LABELS = {
  "Platform Command": ["dashboard", "salons", "plans", "subscriptions"],
  "Operations": ["demo-leads", "support-tickets", "traffic"],
  "System": ["settings", "audit-logs", "staff"]
};

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [availablePages, setAvailablePages] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [staffData, pagesData] = await Promise.all([
        api.get("/super-admin/staff"),
        api.get("/super-admin/available-pages")
      ]);
      setStaff(staffData.data);
      setAvailablePages(pagesData.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load staff."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setIsModalOpen(false);
    setShowPassword(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setStatus({ error: "Name is required.", success: "" });
      return;
    }
    if (!editingId && !form.email.trim()) {
      setStatus({ error: "Email is required.", success: "" });
      return;
    }
    if (!editingId && !form.password.trim()) {
      setStatus({ error: "Password is required.", success: "" });
      return;
    }
    if (form.pagePermissions.length === 0) {
      setStatus({ error: "Select at least one page access.", success: "" });
      return;
    }

    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        pagePermissions: form.pagePermissions
      };
      if (!editingId) {
        payload.email = form.email.trim();
        payload.password = form.password;
      } else if (form.password.trim()) {
        payload.password = form.password;
      }

      if (editingId) {
        await api.patch(`/super-admin/staff/${editingId}`, payload);
        setStatus({ error: "", success: "Staff updated successfully." });
      } else {
        await api.post("/super-admin/staff", { ...payload, email: form.email.trim(), password: form.password });
        setStatus({ error: "", success: "Staff created successfully." });
      }
      resetForm();
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save staff member"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      email: row.email,
      password: "",
      pagePermissions: row.pagePermissions || []
    });
    setIsModalOpen(true);
  };

  const deleteStaff = async (id, name) => {
    if (!window.confirm(`Delete staff "${name}"? This cannot be undone.`)) return;
    setStatus({ error: "", success: "" });
    try {
      await api.delete(`/super-admin/staff/${id}`);
      setStatus({ error: "", success: "Staff deleted." });
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not delete staff member"), success: "" });
    }
  };

  const togglePagePermission = (pageKey) => {
    setForm((prev) => {
      const current = prev.pagePermissions;
      const next = current.includes(pageKey)
        ? current.filter((p) => p !== pageKey)
        : [...current, pageKey];
      return { ...prev, pagePermissions: next };
    });
  };

  const toggleGroupPermissions = (pageKeys) => {
    setForm((prev) => {
      const allSelected = pageKeys.every((k) => prev.pagePermissions.includes(k));
      const next = allSelected
        ? prev.pagePermissions.filter((k) => !pageKeys.includes(k))
        : [...new Set([...prev.pagePermissions, ...pageKeys])];
      return { ...prev, pagePermissions: next };
    });
  };

  if (loading) {
    return (
      <div className="page-shell super-admin-page">
        <PageLoader title="Loading staff" message="Fetching staff accounts..." />
      </div>
    );
  }

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Staff Management</h1>
            <p style={{ marginBottom: 0 }}>Create and manage staff accounts with specific page access permissions.</p>
          </div>
          <div className="badge-row">
            <span className="badge">Total Staff {staff.length}</span>
          </div>
        </div>
      </div>

      {status.error && <div className="alert alert-error">{status.error}</div>}
      {status.success && <div className="alert alert-success">{status.success}</div>}

      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary"
          onClick={() => { setForm(emptyForm); setEditingId(""); setIsModalOpen(true); }}
        >
          <Plus size={16} style={{ marginRight: 6 }} />
          Add Staff
        </button>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          title="No Staff Members"
          message="Create your first staff account to get started."
        />
      ) : (
        <div className="panel-card" style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Pages Access</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontSize: 13, fontWeight: 700
                      }}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>{s.email}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {(s.pagePermissions || []).map((pk) => (
                        <span key={pk} style={badgeStyle}>
                          {availablePages.find((p) => p.key === pk)?.label || pk}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 12,
                      fontSize: 12, fontWeight: 600,
                      background: s.isActive ? "#dcfce7" : "#fee2e2",
                      color: s.isActive ? "#166534" : "#991b1b"
                    }}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => startEdit(s)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-danger-outline"
                        onClick={() => deleteStaff(s.id, s.name)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div
            className="modal-content-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600 }}
          >
            <div className="modal-header">
              <h3>{editingId ? "Edit Staff Member" : "Add Staff Member"}</h3>
              <button type="button" className="modal-close-btn" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={submit} className="form-grid" style={{ padding: "0 24px 24px" }}>
              <label>
                <span>Name *</span>
                <input
                  placeholder="Staff member name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>Email *</span>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editingId}
                  required={!editingId}
                />
              </label>
              <label>
                <span>{editingId ? "New Password (leave blank to keep)" : "Password *"}</span>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={editingId ? "••••••" : "Min 6 characters"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editingId}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#64748b"
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Shield size={16} style={{ color: "#6366f1" }} />
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>Page Access Permissions *</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 12 }}>
                  Select which pages this staff member can access. They will only see these pages in their sidebar.
                </p>

                {Object.entries(PAGE_GROUP_LABELS).map(([group, pageKeys]) => (
                  <div key={group} style={{ marginBottom: 12 }}>
                    <div
                      onClick={() => toggleGroupPermissions(pageKeys)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                        background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
                        cursor: "pointer", marginBottom: 6
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={pageKeys.every((k) => form.pagePermissions.includes(k))}
                        onChange={() => toggleGroupPermissions(pageKeys)}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>{group}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 20 }}>
                      {pageKeys.map((pk) => {
                        const page = availablePages.find((p) => p.key === pk);
                        if (!page) return null;
                        return (
                          <label
                            key={pk}
                            style={{
                              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                              border: `1px solid ${form.pagePermissions.includes(pk) ? "#6366f1" : "#e2e8f0"}`,
                              borderRadius: 8, cursor: "pointer", fontSize: "0.8rem",
                              background: form.pagePermissions.includes(pk) ? "#eef2ff" : "white",
                              color: form.pagePermissions.includes(pk) ? "#4338ca" : "#475569",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={form.pagePermissions.includes(pk)}
                              onChange={() => togglePagePermission(pk)}
                              style={{ cursor: "pointer" }}
                            />
                            {page.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Staff" : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "2px solid #e2e8f0"
};

const tdStyle = {
  padding: "12px 16px",
  fontSize: "0.88rem",
  color: "#334155",
  verticalAlign: "middle"
};

const badgeStyle = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 6,
  fontSize: "0.72rem",
  fontWeight: 600,
  background: "#eef2ff",
  color: "#4338ca",
  whiteSpace: "nowrap"
};
