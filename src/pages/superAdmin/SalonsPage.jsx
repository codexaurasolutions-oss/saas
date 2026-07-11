import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import IndianPhoneInput from "../../components/IndianPhoneInput";
import { MapPin, Scissors, Users, UserCheck, Mail, Phone, Globe, Clock, CreditCard, Shield, Activity, Landmark } from "lucide-react";

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
  const detailRef = useRef(null);

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
    if (!editingId) {
      const hasAnyOwner = form.ownerName || form.ownerEmail || form.ownerPassword;
      const hasAllOwner = form.ownerName && form.ownerEmail && form.ownerPassword;
      if (hasAnyOwner && !hasAllOwner) {
        setStatus({ error: "Owner name, email, and password are all required. Fill in all three or leave all empty.", success: "" });
        return;
      }
    }
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      const finalSlug = form.slug?.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      if (finalSlug.length < 2) {
        setStatus({ error: "Salon name must be at least 2 characters to generate a valid URL slug.", success: "" });
        setSaving(false);
        return;
      }
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
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
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
            <form onSubmit={createOrUpdateSalon} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Salon Name *</span>
                <input placeholder="Salon name" value={form.name} required onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, name: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") });
                }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Business Type</span>
                <select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
                  {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Business Email</span>
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Business Phone</span>
                <IndianPhoneInput 
                  value={form.phone} 
                  onChange={(phone) => setForm((prev) => ({ ...prev, phone }))} 
                  className="indian-phone-field"
                  style={{ minHeight: 48, borderRadius: 14 }}
                />
              </label>
              {!editingId && (
                <>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Owner Full Name</span>
                    <input placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Owner Email</span>
                    <input type="email" placeholder="Owner email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
                  </label>
                  <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Owner Password</span>
                    <input type="password" placeholder="Owner password" value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} />
                  </label>
                </>
              )}
              <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", fontWeight: 700, fontSize: "0.95rem", borderRadius: 12, padding: "14px 24px", minHeight: 48, cursor: "pointer", border: "none", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }} disabled={saving}>
                  {saving ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Workspace")}
                </button>
              </div>
            </form>
            {status.error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{status.error}</p>}
            {status.success && <p style={{ color: "#10b981", fontSize: 13, marginTop: 12 }}>{status.success}</p>}
          </div>
        </div>
      )}

      {status.error && <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>{status.error}</div>}
      {status.success && <div style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>{status.success}</div>}

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
                  let statusBg = "#f1f5f9", statusColor = "#64748b", statusLabel = salon.status;
                  if (salon.status === "ACTIVE") { statusBg = "#ecfdf5"; statusColor = "#10b981"; }
                  else if (salon.status === "SUSPENDED") { statusBg = "#fef2f2"; statusColor = "#ef4444"; }
                  else if (salon.status === "TRIAL") { statusBg = "#fffbeb"; statusColor = "#d97706"; statusLabel = "Pending"; }
                  
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
                          {statusLabel}
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
                          {salon.status !== "EXPIRED" && (
                            <button type="button" onClick={() => updateStatus(salon.id, "EXPIRED")} disabled={isBusy} style={{ padding: "6px 12px", background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                              Archive
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

      <div ref={detailRef} className="panel-card" style={{ marginTop: 24, padding: 28, maxWidth: "100%" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "1.3rem", fontWeight: 700 }}>Salon Detail</h3>
        {!selectedSalon && !detailLoading && <EmptyState title="Pick a salon to inspect" message="Click 'View' on any salon above." />}
        {detailLoading && <PageLoader compact title="Loading detail" message="Fetching salon data..." />}
        {selectedSalon && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 20, marginBottom: 20, gap: 16 }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "1.5rem", color: "#0f172a", fontWeight: 800 }}>{selectedSalon.name}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge" style={{ background: "#f5f3ff", color: "#6366f1", fontWeight: 700 }}>{selectedSalon.businessType || "Salon"}</span>
                  <span className="badge" style={{ background: selectedSalon.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", color: selectedSalon.status === "ACTIVE" ? "#10b981" : "#ef4444", fontWeight: 700 }}>{selectedSalon.status}</span>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Slug: <strong>{selectedSalon.slug}</strong></span>
                </div>
              </div>
              <button type="button" onClick={() => impersonate(selectedSalon.id)} disabled={busyId === selectedSalon.id} style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", border: "none", minHeight: 40, padding: "0 18px", fontWeight: 700, borderRadius: 10, cursor: busyId === selectedSalon.id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }}>
                {busyId === selectedSalon.id ? "Entering..." : "Impersonate Workspace"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Branches", val: selectedSalon.branches?.length || 0, icon: Landmark, color: "#3b82f6", bg: "#eff6ff" },
                { label: "Services", val: selectedSalon.services?.length || 0, icon: Scissors, color: "#8b5cf6", bg: "#f5f3ff" },
                { label: "Guests", val: selectedSalon.customers?.length || 0, icon: Users, color: "#10b981", bg: "#ecfdf5" },
                { label: "Accounts", val: selectedSalon.users?.length || 0, icon: UserCheck, color: "#f59e0b", bg: "#fffbeb" }
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div key={idx} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: item.bg, color: item.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconComp size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{item.val}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, marginTop: 2 }}>{item.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="detail-grid">
              <div className="detail-card" style={{ padding: 24, background: "white", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid #f1f5f9", fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>Contact & Settings</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { label: "Email", value: selectedSalon.email || "-", icon: Mail, color: "#3b82f6" },
                    { label: "Phone", value: selectedSalon.phone || "-", icon: Phone, color: "#10b981" },
                    { label: "Address", value: selectedSalon.address || "-", icon: MapPin, color: "#ef4444" },
                    { label: "Location", value: `${selectedSalon.city || "-"}, ${selectedSalon.country || "-"}`, icon: Globe, color: "#0d9488" },
                    { label: "Timezone", value: selectedSalon.timezone || "-", icon: Clock, color: "#f59e0b" },
                    { label: "Currency / Tax", value: `${selectedSalon.currency || "INR"} / ${String(selectedSalon.taxRate || 0)}%`, icon: CreditCard, color: "#8b5cf6" }
                  ].map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <IconComp size={16} style={{ color: item.color }} />
                          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 700 }}>{item.value}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 16 }}>
                  <span style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Internal Note</span>
                  <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#475569", minHeight: 60 }}>{selectedSalon.internalNote || "No notes."}</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="detail-card" style={{ padding: 24, background: "white", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid #f1f5f9", fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>Active Accounts</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedSalon.users?.length ? selectedSalon.users.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f5f3ff", color: "#6b21a8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Shield size={16} />
                          </div>
                          <div>
                            <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block" }}>{item.user?.name}</strong>
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.user?.email}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span className="badge" style={{ background: "#f5f3ff", color: "#6b21a8", fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: 100 }}>{item.salonRole}</span>
                          <span style={{ fontSize: "0.75rem", color: item.user?.isActive ? "#10b981" : "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.user?.isActive ? "#10b981" : "#ef4444" }} />
                            {item.user?.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    )) : <EmptyState title="No linked users" message="Accounts appear here once assigned." />}
                  </div>
                </div>

                <div className="detail-card" style={{ padding: 24, background: "white", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid #f1f5f9", fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>Subscriptions</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedSalon.subscriptions?.length ? selectedSalon.subscriptions.map((sub) => {
                      const isActive = sub.status === "ACTIVE";
                      return (
                        <div key={sub.id} style={{ padding: "12px 16px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Activity size={16} style={{ color: isActive ? "#10b981" : "#ef4444" }} />
                              <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{sub.plan?.name}</strong>
                            </div>
                            <div style={{ display: "flex", gap: 4 }}>
                              <span className="badge" style={{ background: isActive ? "#ecfdf5" : "#fee2e2", color: isActive ? "#10b981" : "#ef4444", fontSize: "0.7rem", fontWeight: 750, padding: "2px 6px", borderRadius: 100 }}>{sub.status}</span>
                              <span className="badge" style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.7rem", padding: "2px 6px", borderRadius: 100 }}>{sub.paymentStatus || "PENDING"}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginTop: 8, borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                            <span>Discount: {Number(sub.manualDiscount || 0).toLocaleString("en-IN")} {selectedSalon.currency || "INR"}</span>
                            <span>Ends: {new Date(sub.endsAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    }) : <EmptyState title="No subscriptions" message="Records appear here." />}
                  </div>
                </div>
              </div>

              <div className="detail-card" style={{ padding: 24, background: "white", borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
                <h4 style={{ margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid #f1f5f9", fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>Feature Access</h4>
                <div className="feature-switch-grid" style={{ maxHeight: "420px", overflowY: "auto", paddingRight: "6px" }}>
                  {featureFlagKeys.map((key) => {
                    const isEnabled = selectedSalon.featureFlags?.[key] === true;
                    return (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: "0.85rem", fontWeight: 750, color: "#0f172a", textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isEnabled ? "#10b981" : "#cbd5e1" }} />
                            <span style={{ fontSize: "0.75rem", color: isEnabled ? "#10b981" : "#64748b", fontWeight: 700 }}>{isEnabled ? "Enabled" : "Disabled"}</span>
                          </div>
                        </div>
                        <div 
                          onClick={() => toggleFeature(selectedSalon.id, key, selectedSalon.featureFlags)}
                          style={{
                            width: 44,
                            height: 24,
                            borderRadius: 100,
                            background: isEnabled ? "#10b981" : "#cbd5e1",
                            position: "relative",
                            cursor: "pointer",
                            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                          }}
                        >
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: 3,
                            left: isEnabled ? 23 : 3,
                            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                          }} />
                        </div>
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
