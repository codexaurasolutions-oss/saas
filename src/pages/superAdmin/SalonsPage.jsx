import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import IndianPhoneInput from "../../components/IndianPhoneInput";

const businessTypes = ["Salon", "Spa", "Beauty Clinic", "Nail Studio", "Tattoo Studio", "Pet Grooming", "Wellness Center"];
const featureFlagKeys = [
  "pos", "appointments", "inventory", "crm", "campaigns", "ecommerce",
  "digitalCatalog", "catalogAnalytics", "feedback", "reports", "memberships",
  "packages", "loyalty", "couponsGiftCards", "whatsapp", "enquiries",
  "expenses", "payroll", "customerPortal", "publicCatalog", "onlineOrders", "messageTemplates"
];
const defaultFlags = {
  pos: true, appointments: false, inventory: false, crm: true, campaigns: false,
  ecommerce: false, digitalCatalog: false, catalogAnalytics: false, feedback: false,
  reports: true, memberships: false, packages: false, loyalty: false, couponsGiftCards: false,
  whatsapp: false, enquiries: false, expenses: false, payroll: false, customerPortal: false,
  publicCatalog: true, onlineOrders: false, messageTemplates: false
};
const emptyForm = {
  name: "", slug: "", businessType: "Salon", email: "", phone: "", address: "",
  city: "", country: "", timezone: "", currency: "INR", taxRate: 0,
  trialStartsAt: "", trialEndsAt: "", internalNote: "",
  ownerName: "", ownerEmail: "", ownerPassword: ""
};

export default function SalonsPage() {
  const [salons, setSalons] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const setQuery = (val) => {
    setSearchParams((prev) => {
      if (val) prev.set("q", val); else prev.delete("q");
      return prev;
    });
  };
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [featureFlags, setFeatureFlags] = useState(defaultFlags);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  const load = async (nextQuery = query, nextStatus = statusFilter) => {
    setLoading(true);
    setStatus({ error: "", success: "" });
    try {
      const res = await api.get("/super-admin/salons", {
        params: { ...(nextQuery ? { q: nextQuery } : {}), ...(nextStatus ? { status: nextStatus } : {}) }
      });
      setSalons(res.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load salons."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(query, statusFilter);
  }, [query, statusFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setFeatureFlags(defaultFlags);
    setEditingId("");
    setIsModalOpen(false);
  };

  const createOrUpdateSalon = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setStatus({ error: "Salon name is required.", success: "" });
      return;
    }
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      const finalSlug = form.slug?.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const payload = { ...form, slug: finalSlug, taxRate: Number(form.taxRate || 0), featureFlags };
      if (editingId) {
        await api.patch(`/super-admin/salons/${editingId}`, payload);
        setStatus({ error: "", success: "Salon updated successfully." });
      } else {
        await api.post("/super-admin/salons", payload);
        setStatus({ error: "", success: "Salon created successfully." });
      }
      resetForm();
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save salon"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (salonId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/super-admin/salons/${salonId}`);
      setSelectedSalon(res.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load salon detail."), success: "" });
    } finally {
      setDetailLoading(false);
    }
  };

  const startEdit = (salon) => {
    setEditingId(salon.id);
    setForm({
      name: salon.name || "", slug: salon.slug || "", businessType: salon.businessType || "Salon",
      email: salon.email || "", phone: salon.phone || "", address: salon.address || "",
      city: salon.city || "", country: salon.country || "", timezone: salon.timezone || "",
      currency: salon.currency || "INR", taxRate: Number(salon.taxRate || 0),
      trialStartsAt: salon.trialStartsAt ? new Date(salon.trialStartsAt).toISOString().slice(0, 10) : "",
      trialEndsAt: salon.trialEndsAt ? new Date(salon.trialEndsAt).toISOString().slice(0, 10) : "",
      internalNote: salon.internalNote || "", ownerName: "", ownerEmail: "", ownerPassword: ""
    });
    setFeatureFlags({ ...defaultFlags, ...(salon.featureFlags || {}) });
    setIsModalOpen(true);
  };

  const updateStatus = async (salonId, nextStatus) => {
    const label = nextStatus === "SUSPENDED" ? "suspend" : "activate";
    if (!window.confirm(`Are you sure you want to ${label} this salon?`)) return;
    setBusyId(salonId);
    try {
      await api.patch(`/super-admin/salons/${salonId}/status`, { status: nextStatus });
      setStatus({ error: "", success: `Salon ${label}d successfully.` });
      await load();
      if (selectedSalon?.id === salonId) await openDetail(salonId);
    } catch (err) {
      setStatus({ error: formatApiError(err, `Could not ${label} salon`), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const toggleFeature = async (salonId, key, currentFlags) => {
    const nextFlags = { ...defaultFlags, ...(currentFlags || {}), [key]: !currentFlags?.[key] };
    try {
      await api.patch(`/super-admin/salons/${salonId}/features`, { featureFlags: nextFlags });
      await load();
      if (selectedSalon?.id === salonId) await openDetail(salonId);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not toggle feature"), success: "" });
    }
  };

  const impersonate = async (salonId) => {
    setBusyId(salonId);
    try {
      const res = await api.post(`/super-admin/salons/${salonId}/impersonate`);
      setStatus({ error: "", success: res.data.message });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not impersonate salon"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Salons</h1>
            <p style={{ marginBottom: 0 }}>Create, activate, suspend, and inspect every tenant from one control surface.</p>
          </div>
          <div className="badge-row">
            <span className="badge">Total {salons.length}</span>
          </div>
        </div>
      </div>
      <div className="panel-card" style={{ marginBottom: 18, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <input 
              value={query} 
              placeholder="Search salon, slug, email, phone, city..." 
              onChange={(e) => setQuery(e.target.value)} 
              style={{ width: "100%", minHeight: 40, padding: "8px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc" }}
            />
          </div>
          <div style={{ width: 180 }}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "100%", minHeight: 40, padding: "8px 12px", borderRadius: 8, fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc" }}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              type="button" 
              onClick={() => load(query, statusFilter)} 
              style={{ minHeight: 40, padding: "0 18px", borderRadius: 8, background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", boxShadow: "0 2px 6px rgba(79, 70, 229, 0.15)" }}
            >
              Apply
            </button>
            <button 
              type="button" 
              onClick={() => { setQuery(""); setStatusFilter(""); }} 
              style={{ minHeight: 40, padding: "0 18px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>{editingId ? "Edit Tenant Salon" : "Add New Tenant Salon"}</h3>
              <button type="button" className="modal-close-btn" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={createOrUpdateSalon} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Salon Name *</span>
                <input placeholder="Salon name" value={form.name} required onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, name: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") });
                }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Business Type</span>
                <select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
                  {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Business Email</span>
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Business Phone</span>
                <IndianPhoneInput value={form.phone} onChange={(phone) => setForm((prev) => ({ ...prev, phone }))} />
              </label>
              {!editingId && (
                <>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span>Owner Full Name</span>
                    <input placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span>Owner Email</span>
                    <input type="email" placeholder="Owner email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
                  </label>
                  <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                    <span>Owner Password</span>
                    <input type="password" placeholder="Owner password" value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} />
                  </label>
                </>
              )}
              <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", fontWeight: 700, fontSize: "0.95rem", borderRadius: 12, padding: "14px 24px", minHeight: 48, cursor: "pointer", border: "none" }} disabled={saving}>
                  {saving ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Workspace")}
                </button>
              </div>
            </form>
            {status.error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{status.error}</p>}
            {status.success && <p style={{ color: "#10b981", fontSize: 13, marginTop: 12 }}>{status.success}</p>}
          </div>
        </div>
      )}

      <div className="panel-card" style={{ maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 style={{ margin: 0 }}>Tenant Directory</h3>
            <span className="badge" style={{ background: "#e0e7ff", color: "#4f46e5" }}>{salons.length} salons</span>
          </div>
          <button type="button" onClick={() => { resetForm(); setIsModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 38, padding: "8px 16px" }}>
            <span>+ Add New Salon</span>
          </button>
        </div>

        {loading ? (
          <PageLoader compact title="Loading salons" message="Fetching tenant directory..." />
        ) : salons.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Salon Name</th>
                  <th style={{ padding: "12px 16px" }}>Slug / Business Type</th>
                  <th style={{ padding: "12px 16px" }}>Contact Info</th>
                  <th style={{ padding: "12px 16px" }}>Active Subscription</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salons.map((salon) => {
                  const planName = salon.subscriptions?.[0]?.plan?.name || "No active plan";
                  const isBusy = busyId === salon.id;
                  let statusBg = "#f1f5f9", statusColor = "#64748b";
                  if (salon.status === "ACTIVE") { statusBg = "#ecfdf5"; statusColor = "#10b981"; }
                  else if (salon.status === "SUSPENDED") { statusBg = "#fef2f2"; statusColor = "#ef4444"; }
                  
                  return (
                    <tr key={salon.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} className="table-row-hover">
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{salon.name}</td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        <div>{salon.slug}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{salon.businessType || "Salon"}</div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        <div>{salon.email || "No email"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{salon.phone || "No phone"}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: "#f5f3ff", color: "#8b5cf6", fontWeight: 700, fontSize: 11, padding: "3px 8px", borderRadius: 100 }}>
                          {planName}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: statusBg, color: statusColor, fontWeight: 700, fontSize: 11, padding: "3px 8px", borderRadius: 100 }}>
                          {salon.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button type="button" onClick={() => openDetail(salon.id)} disabled={isBusy} style={{ padding: "6px 12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            View
                          </button>
                          <button type="button" onClick={() => startEdit(salon)} disabled={isBusy} style={{ padding: "6px 12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            Edit
                          </button>
                          {salon.status !== "ACTIVE" && (
                            <button type="button" onClick={() => updateStatus(salon.id, "ACTIVE")} disabled={isBusy} style={{ padding: "6px 12px", background: "#ecfdf5", color: "#10b981", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                              Activate
                            </button>
                          )}
                          {salon.status === "ACTIVE" && (
                            <button type="button" onClick={() => updateStatus(salon.id, "SUSPENDED")} disabled={isBusy} style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No salons found" message="Try broadening your search or click '+ Add New Salon'." />
        )}
      </div>

      <div className="panel-card" style={{ marginTop: 24, padding: 28, maxWidth: "100%" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "1.3rem", fontWeight: 700 }}>Salon Detail</h3>
        {!selectedSalon && !detailLoading && <EmptyState title="Pick a salon to inspect" message="Click 'View' on any salon above." />}
        {detailLoading && <PageLoader compact title="Loading detail" message="Fetching salon data..." />}
        {selectedSalon && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 20, marginBottom: 20, gap: 16 }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "1.5rem", color: "#0f172a", fontWeight: 800 }}>{selectedSalon.name}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge" style={{ background: "#e2e8f0", color: "#475569", fontWeight: 700 }}>{selectedSalon.businessType || "Salon"}</span>
                  <span className="badge" style={{ background: selectedSalon.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", color: selectedSalon.status === "ACTIVE" ? "#10b981" : "#ef4444", fontWeight: 700 }}>{selectedSalon.status}</span>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Slug: <strong>{selectedSalon.slug}</strong></span>
                </div>
              </div>
              <button type="button" onClick={() => impersonate(selectedSalon.id)} disabled={busyId === selectedSalon.id} style={{ background: "#4f46e5", color: "white", border: "none", minHeight: 40, padding: "0 18px", fontWeight: 700, borderRadius: 10, cursor: busyId === selectedSalon.id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                {busyId === selectedSalon.id ? "Entering..." : "Impersonate Workspace"}
              </button>
            </div>

            <div className="metrics-dashboard">
              <div className="metric-dashboard-card"><div className="metric-val">{selectedSalon.branches?.length || 0}</div><div className="metric-lbl">Branches</div></div>
              <div className="metric-dashboard-card"><div className="metric-val">{selectedSalon.services?.length || 0}</div><div className="metric-lbl">Services</div></div>
              <div className="metric-dashboard-card"><div className="metric-val">{selectedSalon.customers?.length || 0}</div><div className="metric-lbl">Guests</div></div>
              <div className="metric-dashboard-card"><div className="metric-val">{selectedSalon.users?.length || 0}</div><div className="metric-lbl">Accounts</div></div>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <h4>Contact & Settings</h4>
                <div className="info-item"><span className="info-label">Email</span><span className="info-value">{selectedSalon.email || "-"}</span></div>
                <div className="info-item"><span className="info-label">Phone</span><span className="info-value">{selectedSalon.phone || "-"}</span></div>
                <div className="info-item"><span className="info-label">Address</span><span className="info-value">{selectedSalon.address || "-"}</span></div>
                <div className="info-item"><span className="info-label">Location</span><span className="info-value">{selectedSalon.city || "-"}, {selectedSalon.country || "-"}</span></div>
                <div className="info-item"><span className="info-label">Timezone</span><span className="info-value">{selectedSalon.timezone || "-"}</span></div>
                <div className="info-item"><span className="info-label">Currency / Tax</span><span className="info-value">{selectedSalon.currency || "INR"} / {String(selectedSalon.taxRate || 0)}%</span></div>
                <div style={{ marginTop: 16 }}>
                  <span className="info-label" style={{ display: "block", marginBottom: 6, fontSize: "0.85rem" }}>Internal Note</span>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#475569", minHeight: 60 }}>{selectedSalon.internalNote || "No notes."}</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="detail-card" style={{ flex: 1 }}>
                  <h4>Active Accounts</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedSalon.users?.length ? selectedSalon.users.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "#1e293b", display: "block" }}>{item.user?.name}</strong>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.user?.email}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1", fontSize: "0.7rem", fontWeight: 700 }}>{item.salonRole}</span>
                          <span style={{ fontSize: "0.75rem", color: item.user?.isActive ? "#10b981" : "#ef4444", fontWeight: 600 }}>&bull; {item.user?.isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </div>
                    )) : <EmptyState title="No linked users" message="Accounts appear here once assigned." />}
                  </div>
                </div>
                <div className="detail-card" style={{ flex: 1 }}>
                  <h4>Subscriptions</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedSalon.subscriptions?.length ? selectedSalon.subscriptions.map((sub) => {
                      const isActive = sub.status === "ACTIVE";
                      return (
                        <div key={sub.id} style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>{sub.plan?.name}</strong>
                            <div style={{ display: "flex", gap: 4 }}>
                              <span className="badge" style={{ background: isActive ? "#dcfce7" : "#fee2e2", color: isActive ? "#15803d" : "#b91c1c", fontSize: "0.7rem", fontWeight: 700 }}>{sub.status}</span>
                              <span className="badge" style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.7rem" }}>{sub.paymentStatus || "PENDING"}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
                            <span>Discount: {Number(sub.manualDiscount || 0).toLocaleString("en-IN")} {selectedSalon.currency || "INR"}</span>
                            <span>Ends: {new Date(sub.endsAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    }) : <EmptyState title="No subscriptions" message="Records appear here." />}
                  </div>
                </div>
              </div>

              <div className="detail-card" style={{ display: "flex", flexDirection: "column" }}>
                <h4>Feature Access</h4>
                <div className="feature-switch-grid" style={{ maxHeight: "420px", overflowY: "auto", paddingRight: "6px" }}>
                  {featureFlagKeys.map((key) => {
                    const isEnabled = selectedSalon.featureFlags?.[key] === true;
                    return (
                      <div key={key} className="feature-switch-card">
                        <div>
                          <span className="feature-name">{key.replace(/([A-Z])/g, " $1")}</span>
                          <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
                            <span className="feature-status-dot" style={{ background: isEnabled ? "#10b981" : "#cbd5e1" }} />
                            <span style={{ fontSize: "0.75rem", color: isEnabled ? "#10b981" : "#64748b", fontWeight: 600 }}>{isEnabled ? "On" : "Off"}</span>
                          </div>
                        </div>
                        <button type="button" className="btn-compact" onClick={() => toggleFeature(selectedSalon.id, key, selectedSalon.featureFlags)} style={{ background: isEnabled ? "#fee2e2" : "#dcfce7", color: isEnabled ? "#ef4444" : "#15803d", border: "none", padding: "6px 12px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.75rem" }}>
                          {isEnabled ? "Disable" : "Enable"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
