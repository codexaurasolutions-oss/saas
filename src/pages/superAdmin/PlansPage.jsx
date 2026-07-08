import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";

const defaultFeatureFlags = {
  pos: true,
  appointments: true,
  inventory: true,
  crm: true,
  campaigns: true,
  ecommerce: true,
  digitalCatalog: true,
  catalogAnalytics: true,
  feedback: true,
  reports: true,
  memberships: true,
  packages: true,
  loyalty: true,
  couponsGiftCards: true,
  whatsapp: true,
  enquiries: true,
  expenses: true,
  payroll: true,
  customerPortal: true,
  publicCatalog: true,
  onlineOrders: true,
  messageTemplates: true
};

const emptyForm = {
  name: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  trialDays: 0,
  branchLimit: 1,
  userLimit: 5,
  customerLimit: 500,
  invoiceLimit: 1000,
  storageLimit: 5,
  isCustom: false,
  featureFlags: defaultFeatureFlags
};

export default function PlansPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = (await api.get("/super-admin/plans")).data;
      setRows(data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load plans."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    load().then(() => {}).catch(() => {});
    return () => { active = false; };
  }, []);

  const summary = useMemo(() => ({
    total: rows.length,
    custom: rows.filter((row) => row.isCustom).length,
    standard: rows.filter((row) => !row.isCustom).length
  }), [rows]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setIsModalOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setStatus({ error: "Plan name is required.", success: "" });
      return;
    }
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        monthlyPrice: Number(form.monthlyPrice),
        yearlyPrice: Number(form.yearlyPrice),
        trialDays: Number(form.trialDays),
        branchLimit: Number(form.branchLimit),
        userLimit: Number(form.userLimit),
        customerLimit: Number(form.customerLimit),
        invoiceLimit: Number(form.invoiceLimit),
        storageLimit: Number(form.storageLimit),
        isCustom: Boolean(form.isCustom),
        featureFlags: form.featureFlags || defaultFeatureFlags
      };
      if (editingId) {
        await api.patch(`/super-admin/plans/${editingId}`, payload);
        setStatus({ error: "", success: "Plan updated successfully." });
      } else {
        await api.post("/super-admin/plans", payload);
        setStatus({ error: "", success: "Plan created successfully." });
      }
      resetForm();
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save plan"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      monthlyPrice: Number(row.monthlyPrice || 0),
      yearlyPrice: Number(row.yearlyPrice || 0),
      trialDays: Number(row.trialDays || 14),
      branchLimit: Number(row.branchLimit || 1),
      userLimit: Number(row.userLimit || 5),
      customerLimit: Number(row.customerLimit || 500),
      invoiceLimit: Number(row.invoiceLimit || 1000),
      storageLimit: Number(row.storageLimit || 5),
      isCustom: Boolean(row.isCustom),
      featureFlags: row.featureFlags || defaultFeatureFlags
    });
    setIsModalOpen(true);
  };

  const deletePlan = async (planId, planName) => {
    if (!window.confirm(`Delete "${planName}"? This cannot be undone.`)) return;
    setStatus({ error: "", success: "" });
    try {
      await api.delete(`/super-admin/plans/${planId}`);
      setStatus({ error: "", success: "Plan deleted." });
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not delete plan"), success: "" });
    }
  };

  const numInput = (key, opts = {}) => ({
    type: "number",
    min: opts.min ?? 0,
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: Number(e.target.value) })
  });

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Plans</h1>
            <p style={{ marginBottom: 0 }}>Manage pricing tiers, limits, and feature access for every salon subscription.</p>
          </div>
          <div className="badge-row">
            <span className="badge">Total {summary.total}</span>
            <span className="badge">Standard {summary.standard}</span>
            <span className="badge">Custom {summary.custom}</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Edit Subscription Plan" : "Add New Subscription Plan"}</h3>
              <button type="button" className="modal-close-btn" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={submit} className="form-grid">
              <label>
                <span>Plan Name *</span>
                <input placeholder="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label>
                <span>Monthly Price (INR)</span>
                <input {...numInput("monthlyPrice")} placeholder="0" />
              </label>
              <label>
                <span>Yearly Price (INR)</span>
                <input {...numInput("yearlyPrice")} placeholder="0" />
              </label>
              <label>
                <span>Trial Days</span>
                <input {...numInput("trialDays", { min: 0 })} placeholder="14" />
              </label>
              <label>
                <span>Branch Limit</span>
                <input {...numInput("branchLimit", { min: 1 })} placeholder="1" />
              </label>
              <label>
                <span>User Account Limit</span>
                <input {...numInput("userLimit")} placeholder="5" />
              </label>
              <label>
                <span>Customer Record Limit</span>
                <input {...numInput("customerLimit")} placeholder="500" />
              </label>
              <label>
                <span>Monthly Invoice Limit</span>
                <input {...numInput("invoiceLimit")} placeholder="1000" />
              </label>
              <label>
                <span>Cloud Storage (GB)</span>
                <input {...numInput("storageLimit")} placeholder="5" />
              </label>
              <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                <input type="checkbox" checked={Boolean(form.isCustom)} onChange={(e) => setForm({ ...form, isCustom: e.target.checked })} style={{ minHeight: "auto", width: "auto" }} />
                <span>Mark this as a custom plan</span>
              </label>
              <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <button type="submit" style={{ width: "100%" }} disabled={saving}>
                  {saving ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Plan")}
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
            <h3 style={{ margin: 0 }}>Plan Library</h3>
            <span className="badge" style={{ background: "#e0e7ff", color: "#4f46e5" }}>{summary.total} plans</span>
          </div>
          <button type="button" onClick={() => { resetForm(); setIsModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 38, padding: "8px 16px" }}>
            <span>+ Add New Plan</span>
          </button>
        </div>

        {loading ? (
          <PageLoader compact title="Loading plans" message="Fetching plan catalog..." />
        ) : rows.length ? (
          <div className="list-stack">
            {rows.map((row) => {
              const firstLetter = (row.name || "P").charAt(0).toUpperCase();
              return (
                <div key={row.id} className="tenant-row">
                  <div className="tenant-info-block">
                    <div className="tenant-avatar" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>{firstLetter}</div>
                    <div className="tenant-meta-stack">
                      <h4 className="tenant-title">{row.name}</h4>
                      <div className="tenant-subtext">
                        <strong>Monthly:</strong> {Number(row.monthlyPrice || 0).toLocaleString("en-IN")} INR &bull; <strong>Yearly:</strong> {Number(row.yearlyPrice || 0).toLocaleString("en-IN")} INR
                      </div>
                      <div className="tenant-subtext" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        Trial: {row.trialDays}d &bull; Users: {row.userLimit} &bull; Branches: {row.branchLimit} &bull; Storage: {row.storageLimit || 0}GB
                      </div>
                    </div>
                  </div>
                  <div className="tenant-badges-block">
                    {row.isCustom && <span className="badge" style={{ background: "#fef2f2", color: "#ef4444", fontWeight: 700 }}>Custom</span>}
                  </div>
                  <div className="tenant-actions">
                    <button type="button" className="btn-compact secondary-button" onClick={() => startEdit(row)}>Edit</button>
                    <button type="button" className="btn-compact" onClick={() => deletePlan(row.id, row.name)} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No pricing plans yet" message="Click '+ Add New Plan' to create your first plan." />
        )}
      </div>
    </div>
  );
}
