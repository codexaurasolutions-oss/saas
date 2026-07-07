import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
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

const formatApiError = (error, fallback) => {
  console.error("API Error details:", error?.response?.data || error);
  const issues = error?.response?.data?.issues;
  if (Array.isArray(issues) && issues.length) {
    return issues.map((issue) => `${issue.field || "field"}: ${issue.message}`).join(" | ");
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data) {
    return typeof error.response.data === "string" ? error.response.data : JSON.stringify(error.response.data);
  }
  return error?.message || fallback;
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
      if (data.length >= 1) {
        const firstPlan = data[0];
        setEditingId(firstPlan.id);
        setForm({
          name: firstPlan.name,
          monthlyPrice: Number(firstPlan.monthlyPrice || 0),
          yearlyPrice: Number(firstPlan.yearlyPrice || 0),
          trialDays: Number(firstPlan.trialDays || 14),
          branchLimit: Number(firstPlan.branchLimit || 1),
          userLimit: Number(firstPlan.userLimit || 5),
          customerLimit: Number(firstPlan.customerLimit || 500),
          invoiceLimit: Number(firstPlan.invoiceLimit || 1000),
          storageLimit: Number(firstPlan.storageLimit || 5),
          isCustom: Boolean(firstPlan.isCustom),
          featureFlags: firstPlan.featureFlags || defaultFeatureFlags
        });
      }
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load plan data."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get("/super-admin/plans").then((response) => {
      if (active) {
        setRows(response.data);
        setLoading(false);
        if (response.data.length >= 1) {
          const firstPlan = response.data[0];
          setEditingId(firstPlan.id);
          setForm({
            name: firstPlan.name,
            monthlyPrice: Number(firstPlan.monthlyPrice || 0),
            yearlyPrice: Number(firstPlan.yearlyPrice || 0),
            trialDays: Number(firstPlan.trialDays || 14),
            branchLimit: Number(firstPlan.branchLimit || 1),
            userLimit: Number(firstPlan.userLimit || 5),
            customerLimit: Number(firstPlan.customerLimit || 500),
            invoiceLimit: Number(firstPlan.invoiceLimit || 1000),
            storageLimit: Number(firstPlan.storageLimit || 5),
            isCustom: Boolean(firstPlan.isCustom),
            featureFlags: firstPlan.featureFlags || defaultFeatureFlags
          });
        }
      }
    }).catch((err) => {
      if (active) {
        setStatus({ error: formatApiError(err, "Could not load plans."), success: "" });
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => ({
    total: rows.length,
    custom: rows.filter((row) => row.isCustom).length,
    standard: rows.filter((row) => !row.isCustom).length
  }), [rows]);

  const resetForm = () => {
    if (rows.length >= 1) {
      const firstPlan = rows[0];
      setForm({
        name: firstPlan.name,
        monthlyPrice: Number(firstPlan.monthlyPrice || 0),
        yearlyPrice: Number(firstPlan.yearlyPrice || 0),
        trialDays: Number(firstPlan.trialDays || 14),
        branchLimit: Number(firstPlan.branchLimit || 1),
        userLimit: Number(firstPlan.userLimit || 5),
        customerLimit: Number(firstPlan.customerLimit || 500),
        invoiceLimit: Number(firstPlan.invoiceLimit || 1000),
        storageLimit: Number(firstPlan.storageLimit || 5),
        isCustom: Boolean(firstPlan.isCustom),
        featureFlags: firstPlan.featureFlags || defaultFeatureFlags
      });
      setEditingId(firstPlan.id);
    } else {
      setForm(emptyForm);
      setEditingId("");
    }
    setIsModalOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      const payload = {
        name: form.name,
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

      {/* Modal Overlay for Add/Edit Plan */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "✏️ Edit Subscription Plan" : "➕ Add New Subscription Plan"}</h3>
              <button type="button" className="modal-close-btn" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={submit} className="form-grid">
              <label>
                <span>Plan Name</span>
                <input placeholder="Plan name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>
                <span>Monthly Price (INR)</span>
                <input type="number" min="0" placeholder="Monthly price" value={form.monthlyPrice} onChange={(event) => setForm({ ...form, monthlyPrice: event.target.value })} />
              </label>
              <label>
                <span>Yearly Price (INR)</span>
                <input type="number" min="0" placeholder="Yearly price" value={form.yearlyPrice} onChange={(event) => setForm({ ...form, yearlyPrice: event.target.value })} />
              </label>
              <label>
                <span>Branch Limit</span>
                <input type="number" min="1" placeholder="Branch limit" value={form.branchLimit} onChange={(event) => setForm({ ...form, branchLimit: event.target.value })} />
              </label>
              <label>
                <span>User Account Limit</span>
                <input type="number" min="0" placeholder="User limit" value={form.userLimit} onChange={(event) => setForm({ ...form, userLimit: event.target.value })} />
              </label>
              <label>
                <span>Customer Record Limit</span>
                <input type="number" min="0" placeholder="Customer limit" value={form.customerLimit} onChange={(event) => setForm({ ...form, customerLimit: event.target.value })} />
              </label>
              <label>
                <span>Monthly Invoice Limit</span>
                <input type="number" min="0" placeholder="Invoice limit" value={form.invoiceLimit} onChange={(event) => setForm({ ...form, invoiceLimit: event.target.value })} />
              </label>
              <label>
                <span>Cloud Storage (GB)</span>
                <input type="number" min="0" placeholder="Storage limit" value={form.storageLimit} onChange={(event) => setForm({ ...form, storageLimit: event.target.value })} />
              </label>
              <label className="checkbox-row" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                <input type="checkbox" checked={Boolean(form.isCustom)} onChange={(event) => setForm({ ...form, isCustom: event.target.checked })} style={{ minHeight: "auto", width: "auto" }} />
                <span>Mark this as a custom plan</span>
              </label>
              <div className="form-actions" style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <button type="submit" style={{ width: "100%" }} disabled={saving}>
                  {saving ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <svg className="animate-spin" viewBox="0 0 24 24" style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }} />
                      {editingId ? "Saving..." : "Creating..."}
                    </span>
                  ) : (
                    editingId ? "Save Changes" : "Create Plan"
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
              <h3 style={{ margin: 0 }}>Plan Library</h3>
              <span className="badge" style={{ background: "#e0e7ff", color: "#4f46e5" }}>{summary.total} plans</span>
            </div>
            <button type="button" onClick={() => { resetForm(); setEditingId(""); setForm(emptyForm); setIsModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 38, padding: "8px 16px" }}>
              <span>+ Add New Plan</span>
            </button>
          </div>

          <div className="list-stack">
            {loading ? (
              <PageLoader
                compact
                title="Loading plan catalog"
                message="Collecting pricing tiers, limits, and feature bundles."
              />
            ) : rows.length ? (
              rows.map((row) => {
                const firstLetter = (row.name || "P").charAt(0).toUpperCase();
                return (
                  <div key={row.id} className="tenant-row">
                    <div className="tenant-info-block">
                      <div className="tenant-avatar" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>{firstLetter}</div>
                      <div className="tenant-meta-stack">
                        <h4 className="tenant-title">{row.name}</h4>
                        <div className="tenant-subtext">
                          <strong>Monthly Price:</strong> {String(row.monthlyPrice)} INR &bull; <strong>Yearly Price:</strong> {String(row.yearlyPrice)} INR
                        </div>
                        <div className="tenant-subtext" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          Trial: {row.trialDays} days &bull; Users Limit: {row.userLimit} &bull; Branches Limit: {row.branchLimit} &bull; Storage: {row.storageLimit || 0} GB
                        </div>
                      </div>
                    </div>

                    <div className="tenant-badges-block">
                      {row.isCustom && (
                        <span className="badge" style={{ background: "#fef2f2", color: "#ef4444", fontWeight: 700 }}>
                          Custom Plan
                        </span>
                      )}
                    </div>

                    <div className="tenant-actions">
                      <button type="button" className="btn-compact secondary-button" onClick={() => startEdit(row)}>
                        Edit Plan
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No pricing plans yet"
                message="Click '+ Add New Plan' above to start onboarding salons with clear feature bundles and limits."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
