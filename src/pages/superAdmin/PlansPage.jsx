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
  isPopular: false,
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
        monthlyPrice: Number(form.monthlyPrice || 0),
        yearlyPrice: Number(form.yearlyPrice || 0),
        trialDays: Number(form.trialDays || 0),
        branchLimit: Number(form.branchLimit || 1),
        userLimit: Number(form.userLimit || 0),
        customerLimit: Number(form.customerLimit || 0),
        invoiceLimit: Number(form.invoiceLimit || 0),
        storageLimit: Number(form.storageLimit || 0),
        isCustom: Boolean(form.isCustom),
        isPopular: Boolean(form.isPopular),
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
      isPopular: Boolean(row.isPopular),
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
    value: form[key] === "" ? "" : form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value === "" ? "" : Number(e.target.value) })
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
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, marginTop: 8 }}>
                <div>
                  <span style={{ fontSize: "0.88rem", fontWeight: 750, color: "#0f172a" }}>Custom Plan</span>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>Mark this plan as custom (not public)</span>
                </div>
                <div 
                  onClick={() => setForm({ ...form, isCustom: !form.isCustom })}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 100,
                    background: form.isCustom ? "#10b981" : "#cbd5e1",
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
                    left: form.isCustom ? 23 : 3,
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                  }} />
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, marginTop: 4 }}>
                <div>
                  <span style={{ fontSize: "0.88rem", fontWeight: 750, color: "#0f172a" }}>Most Popular Plan</span>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>Highlight this plan with a "Most Popular" badge on public site</span>
                </div>
                <div 
                  onClick={() => setForm({ ...form, isPopular: !form.isPopular })}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 100,
                    background: form.isPopular ? "#10b981" : "#cbd5e1",
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
                    left: form.isPopular ? 23 : 3,
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                  }} />
                </div>
              </div>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 24 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {rows.map((row) => {
              return (
                <div 
                  key={row.id} 
                  style={{ 
                    background: "#fff", 
                    borderRadius: 20, 
                    padding: 24, 
                    border: row.isPopular ? "2px solid #0d9488" : "1px solid #e2e8f0", 
                    position: "relative", 
                    boxShadow: row.isPopular ? "0 8px 30px rgba(13,148,136,0.12)" : "0 4px 16px rgba(0,0,0,0.01)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 380
                  }}
                >
                  {row.isPopular && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#0d9488", color: "#fff", padding: "4px 12px", borderRadius: 100, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
                      MOST POPULAR
                    </div>
                  )}
                  
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: row.isCustom ? "#ef4444" : "#0d9488", textTransform: "uppercase", letterSpacing: "0.05em", background: row.isCustom ? "#fef2f2" : "#f0fdfa", padding: "4px 8px", borderRadius: 6 }}>
                        {row.isCustom ? "Custom Tier" : "Standard Tier"}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>{row.name}</h3>
                    
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, color: "#64748b", fontWeight: 600 }}>INR</span>
                      <span style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>{Number(row.monthlyPrice || 0).toLocaleString("en-IN")}</span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>/mo</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 20px" }}>Yearly: INR {Number(row.yearlyPrice || 0).toLocaleString("en-IN")}/yr</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                      {[
                        `Max ${row.branchLimit} Branches`,
                        `Max ${row.userLimit} Staff Users`,
                        `Max ${row.customerLimit} Customers`,
                        `Max ${row.invoiceLimit} Invoices/mo`,
                        `${row.storageLimit || 0} GB Storage`
                      ].map(item => (
                        <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                          <span style={{ color: "#14b8a6", fontWeight: 700 }}>✓</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 16, marginTop: "auto" }}>
                    <button 
                      type="button" 
                      onClick={() => startEdit(row)} 
                      style={{ 
                        flex: 1, 
                        background: "#f1f5f9", 
                        color: "#475569", 
                        border: "none", 
                        padding: "10px", 
                        borderRadius: 10, 
                        fontWeight: 700, 
                        fontSize: 13, 
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      onClick={() => deletePlan(row.id, row.name)} 
                      style={{ 
                        flex: 1, 
                        background: "#fef2f2", 
                        color: "#dc2626", 
                        border: "none", 
                        padding: "10px", 
                        borderRadius: 10, 
                        fontWeight: 700, 
                        fontSize: 13, 
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No pricing plans yet" message="Click '+ Add New Plan' to create your first plan." label="Plans" />
        )}
      </div>
    </div>
  );
}
