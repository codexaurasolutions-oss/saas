import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import IndianPhoneInput from "../../components/IndianPhoneInput";

const businessTypes = ["Salon", "Spa", "Beauty Clinic", "Nail Studio", "Tattoo Studio", "Pet Grooming", "Wellness Center"];
const featureFlagKeys = [
  "pos",
  "appointments",
  "inventory",
  "crm",
  "campaigns",
  "ecommerce",
  "digitalCatalog",
  "catalogAnalytics",
  "feedback",
  "reports",
  "memberships",
  "packages",
  "loyalty",
  "couponsGiftCards",
  "whatsapp",
  "enquiries",
  "expenses",
  "payroll",
  "customerPortal",
  "publicCatalog",
  "onlineOrders",
  "messageTemplates"
];
const defaultFlags = {
  pos: true,
  appointments: false,
  inventory: false,
  crm: true,
  campaigns: false,
  ecommerce: false,
  digitalCatalog: false,
  catalogAnalytics: false,
  feedback: false,
  reports: true,
  memberships: false,
  packages: false,
  loyalty: false,
  couponsGiftCards: false,
  whatsapp: false,
  enquiries: false,
  expenses: false,
  payroll: false,
  customerPortal: false,
  publicCatalog: true,
  onlineOrders: false,
  messageTemplates: false
};
const emptyForm = {
  name: "",
  slug: "",
  businessType: "Salon",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  timezone: "",
  currency: "PKR",
  taxRate: 0,
  trialStartsAt: "",
  trialEndsAt: "",
  internalNote: "",
  ownerName: "",
  ownerEmail: "",
  ownerPassword: ""
};

const formatApiError = (error, fallback) => {
  const issues = error?.response?.data?.issues;
  if (Array.isArray(issues) && issues.length) {
    return issues.map((issue) => `${issue.field || "field"}: ${issue.message}`).join(" | ");
  }
  return error?.response?.data?.message || fallback;
};

export default function SalonsPage() {
  const [salons, setSalons] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const setQuery = (val) => {
    setSearchParams((prev) => {
      if (val) prev.set("q", val);
      else prev.delete("q");
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

  const activeFeatureCount = useMemo(() => Object.values(featureFlags).filter(Boolean).length, [featureFlags]);

  const load = async (nextQuery = query, nextStatus = statusFilter) => {
    setLoading(true);
    try {
      setSalons((await api.get("/super-admin/salons", {
        params: {
          ...(nextQuery ? { q: nextQuery } : {}),
          ...(nextStatus ? { status: nextStatus } : {})
        }
      })).data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setStatus({ error: "", success: "" });
    api.get("/super-admin/salons", {
      params: {
        ...(query ? { q: query } : {}),
        ...(statusFilter ? { status: statusFilter } : {})
      }
    }).then((response) => {
      if (active) {
        setSalons(response.data);
        setLoading(false);
      }
    }).catch((err) => {
      if (active) {
        setStatus({ error: formatApiError(err, "Could not load salons."), success: "" });
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [query, statusFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setFeatureFlags(defaultFlags);
    setEditingId("");
    setIsModalOpen(false);
  };

  const createOrUpdateSalon = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      const finalSlug = form.slug?.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const payload = {
        ...form,
        slug: finalSlug,
        taxRate: Number(form.taxRate || 0),
        featureFlags
      };
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
      const response = await api.get(`/super-admin/salons/${salonId}`);
      setSelectedSalon(response.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const startEdit = (salon) => {
    setEditingId(salon.id);
    setForm({
      name: salon.name || "",
      slug: salon.slug || "",
      businessType: salon.businessType || "Salon",
      email: salon.email || "",
      phone: salon.phone || "",
      address: salon.address || "",
      city: salon.city || "",
      country: salon.country || "",
      timezone: salon.timezone || "",
      currency: salon.currency || "PKR",
      taxRate: Number(salon.taxRate || 0),
      trialStartsAt: salon.trialStartsAt ? new Date(salon.trialStartsAt).toISOString().slice(0, 10) : "",
      trialEndsAt: salon.trialEndsAt ? new Date(salon.trialEndsAt).toISOString().slice(0, 10) : "",
      internalNote: salon.internalNote || "",
      ownerName: "",
      ownerEmail: "",
      ownerPassword: ""
    });
    setFeatureFlags({ ...defaultFlags, ...(salon.featureFlags || {}) });
    setIsModalOpen(true);
  };

  const updateStatus = async (salonId, nextStatus) => {
    await api.patch(`/super-admin/salons/${salonId}/status`, { status: nextStatus });
    await load();
    await openDetail(salonId);
  };

  const toggleFeature = async (salonId, key, currentFlags) => {
    const nextFlags = { ...defaultFlags, ...(currentFlags || {}), [key]: currentFlags?.[key] === false ? true : false };
    await api.patch(`/super-admin/salons/${salonId}/features`, { featureFlags: nextFlags });
    await load();
    await openDetail(salonId);
  };

  const impersonate = async (salonId) => {
    const response = await api.post(`/super-admin/salons/${salonId}/impersonate`);
    setStatus({ error: "", success: response.data.message });
  };

  const toggleDraftFeature = (key) => setFeatureFlags((current) => ({ ...current, [key]: !current[key] }));

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
            <span className="badge">Features {activeFeatureCount}</span>
          </div>
        </div>
      </div>
      <div className="panel-card" style={{ marginBottom: 18 }}>
        <div className="form-grid">
          <input value={query} placeholder="Search salon, slug, email, phone, city, or country" onChange={(event) => setQuery(event.target.value)} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button type="button" className="secondary-button" onClick={() => load(query, statusFilter)}>Apply Filters</button>
          <button type="button" className="secondary-button" onClick={() => { setQuery(""); setStatusFilter(""); }}>Reset</button>
        </div>
      </div>
      {/* Modal Overlay for Add/Edit Salon */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "✏️ Edit Tenant Salon" : "🏢 Add New Tenant Salon"}</h3>
              <button type="button" className="modal-close-btn" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={createOrUpdateSalon} className="form-grid">
              <label>
                <span>Salon Name</span>
                <input placeholder="Salon name" value={form.name} onChange={(event) => {
                  const val = event.target.value;
                  setForm({ ...form, name: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') });
                }} />
              </label>
              <label>
                <span>Business Type</span>
                <select value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value })}>
                  {businessTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span>Business Email</span>
                <input placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>
                <span>Business Phone</span>
                <IndianPhoneInput value={form.phone} onChange={(phone) => setForm((prev) => ({ ...prev, phone }))} />
              </label>
              {!editingId && (
                <label>
                  <span>Owner Full Name</span>
                  <input placeholder="Owner name" value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} />
                </label>
              )}
              {!editingId && (
                <label>
                  <span>Owner Email</span>
                  <input placeholder="Owner email" value={form.ownerEmail} onChange={(event) => setForm({ ...form, ownerEmail: event.target.value })} />
                </label>
              )}
              {!editingId && (
                <label>
                  <span>Owner Password</span>
                  <input type="password" placeholder="Owner password" value={form.ownerPassword} onChange={(event) => setForm({ ...form, ownerPassword: event.target.value })} />
                </label>
              )}
              <div className="form-actions" style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <button type="submit" style={{ width: "100%" }} disabled={saving}>
                  {saving ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <svg className="animate-spin" viewBox="0 0 24 24" style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }} />
                      {editingId ? "Saving..." : "Creating..."}
                    </span>
                  ) : (
                    editingId ? "Save Changes" : "Create Workspace"
                  )}
                </button>
              </div>
            </form>
            {status.error && <p className="error-text" style={{ marginTop: 12 }}>{status.error}</p>}
            {status.success && <p className="success-text" style={{ marginTop: 12 }}>{status.success}</p>}
          </div>
        </div>
      )}

      <div>
        <div className="panel-card" style={{ maxWidth: "100%" }}>
          <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Tenant Directory</h3>
              <span className="badge" style={{ background: "#e0e7ff", color: "#4f46e5" }}>{salons.length} salons</span>
            </div>
            <button type="button" onClick={() => { resetForm(); setIsModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 38, padding: "8px 16px" }}>
              <span>+ Add New Salon</span>
            </button>
          </div>

          <div className="list-stack">
            {loading ? (
              <PageLoader
                compact
                title="Loading salon directory"
                message="Pulling tenant status, locations, and plan assignments."
              />
            ) : salons.length ? (
              salons.map((salon) => {
                const planName = salon.subscriptions?.[0]?.plan?.name || "No plan";
                const firstLetter = (salon.name || "S").charAt(0).toUpperCase();

                // Status Styling
                let statusBg = "#f1f5f9";
                let statusColor = "#64748b";
                if (salon.status === "ACTIVE") {
                  statusBg = "#ecfdf5";
                  statusColor = "#10b981";
                } else if (salon.status === "TRIAL") {
                  statusBg = "#eff6ff";
                  statusColor = "#3b82f6";
                } else if (salon.status === "SUSPENDED") {
                  statusBg = "#fef2f2";
                  statusColor = "#ef4444";
                }

                return (
                  <div key={salon.id} className="tenant-row">
                    <div className="tenant-info-block">
                      <div className="tenant-avatar">{firstLetter}</div>
                      <div className="tenant-meta-stack">
                        <h4 className="tenant-title">{salon.name}</h4>
                        <div className="tenant-subtext">
                          <strong>Slug:</strong> {salon.slug} &bull; <strong>Type:</strong> {salon.businessType || "Salon"}
                        </div>
                        <div className="tenant-subtext" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          {salon.email || "No email"} &bull; {salon.phone || "No phone"}
                        </div>
                      </div>
                    </div>

                    <div className="tenant-badges-block">
                      <span className="badge" style={{ background: "#f5f3ff", color: "#8b5cf6", fontWeight: 700 }}>
                        Plan: {planName}
                      </span>
                      <span className="badge" style={{ background: statusBg, color: statusColor, fontWeight: 700 }}>
                        {salon.status}
                      </span>
                    </div>

                    <div className="tenant-actions">
                      <button type="button" className="btn-compact secondary-button" onClick={() => openDetail(salon.id)}>
                        View Detail
                      </button>
                      <button type="button" className="btn-compact secondary-button" onClick={() => startEdit(salon)}>
                        Edit
                      </button>
                      {salon.status !== "ACTIVE" && (
                        <button type="button" className="btn-compact" onClick={() => updateStatus(salon.id, "ACTIVE")}>
                          Activate
                      </button>
                      )}
                      {salon.status === "ACTIVE" && (
                        <button type="button" className="btn-compact danger-button" onClick={() => updateStatus(salon.id, "SUSPENDED")}>
                          Suspend
                      </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No salons found"
                message="Try broadening your search or click '+ Add New Salon' above to get started."
              />
            )}
          </div>
        </div>
      </div>

      <div className="panel-card" style={{ marginTop: 18 }}>
        <h3>Salon Detail</h3>
        {!selectedSalon && !detailLoading && (
          <EmptyState
            title="Pick a salon to inspect"
            message="Owner users, subscriptions, feature access, and usage relationships will appear here."
          />
        )}
        {detailLoading && (
          <PageLoader
            compact
            title="Loading salon detail"
            message="Preparing owner, subscription, and feature access details."
          />
        )}
        {selectedSalon && (
          <>
            <div className="item-head">
              <div>
                <p><strong>{selectedSalon.name}</strong></p>
                <p>{selectedSalon.businessType || "Salon"} | {selectedSalon.status}</p>
                <p>{selectedSalon.email || "-"} | {selectedSalon.phone || "-"}</p>
                <p>{selectedSalon.address || "-"}</p>
                <p>{selectedSalon.city || "-"}, {selectedSalon.country || "-"} | {selectedSalon.timezone || "-"}</p>
                <p>Currency {selectedSalon.currency || "PKR"} | Tax {String(selectedSalon.taxRate || 0)}%</p>
                <p>Trial: {selectedSalon.trialStartsAt ? new Date(selectedSalon.trialStartsAt).toLocaleDateString() : "-"} to {selectedSalon.trialEndsAt ? new Date(selectedSalon.trialEndsAt).toLocaleDateString() : "-"}</p>
                <p>Internal note: {selectedSalon.internalNote || "-"}</p>
              </div>
              <div className="inline-actions">
                <button type="button" className="secondary-button" onClick={() => impersonate(selectedSalon.id)}>Impersonate Placeholder</button>
              </div>
            </div>
            <div className="badge-row">
              <span className="badge">Branches {selectedSalon.branches.length}</span>
              <span className="badge">Services {selectedSalon.services.length}</span>
              <span className="badge">Customers {selectedSalon.customers.length}</span>
              <span className="badge">Users {selectedSalon.users.length}</span>
            </div>
            <h4>Users</h4>
            {selectedSalon.users.length ? selectedSalon.users.map((item) => (
              <div key={item.id} style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}>
                {item.user.name} - {item.salonRole} - Login {item.user.isActive ? "Active" : "Inactive"}
              </div>
            )) : <EmptyState title="No linked salon users" message="Owner and staff accounts will appear here once assigned." />}
            <h4>Subscriptions</h4>
            {selectedSalon.subscriptions.length ? selectedSalon.subscriptions.map((subscription) => (
              <div key={subscription.id} style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}>
                {subscription.plan?.name} - {subscription.status} - Payment {subscription.paymentStatus || "PENDING"}
                <div className="item-meta">Discount {String(subscription.manualDiscount || 0)} | Ends {new Date(subscription.endsAt).toLocaleDateString()}</div>
              </div>
            )) : <EmptyState title="No subscriptions yet" message="Active or trial subscription records will surface here for this salon." />}
            <h4>Feature Flags</h4>
            {featureFlagKeys.map((key) => {
              const value = selectedSalon.featureFlags?.[key];
              return (
                <div key={key} style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}>
                  <strong>{key}</strong> - {String(value)}
                  <div style={{ marginTop: 6 }}>
                    <button type="button" onClick={() => toggleFeature(selectedSalon.id, key, selectedSalon.featureFlags)}>
                      {value === false ? "Enable" : "Disable"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
