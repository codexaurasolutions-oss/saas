import { useEffect, useMemo, useState } from "react";
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
  trialDays: 14,
  branchLimit: 9999,
  userLimit: 5,
  customerLimit: 500,
  invoiceLimit: 1000,
  storageLimit: 5,
  isCustom: false,
  featureFlags: defaultFeatureFlags
};

const formatApiError = (error, fallback) => {
  const issues = error?.response?.data?.issues;
  if (Array.isArray(issues) && issues.length) {
    return issues.map((issue) => `${issue.field || "field"}: ${issue.message}`).join(" | ");
  }
  if (error instanceof SyntaxError) {
    return "Feature flags JSON is invalid. Fix the JSON format and try again.";
  }
  return error?.response?.data?.message || fallback;
};

export default function PlansPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);

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
          branchLimit: Number(firstPlan.branchLimit || 99999),
          userLimit: Number(firstPlan.userLimit || 9999),
          customerLimit: Number(firstPlan.customerLimit || 99999),
          invoiceLimit: Number(firstPlan.invoiceLimit || 99999),
          storageLimit: Number(firstPlan.storageLimit || 999),
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
            branchLimit: Number(firstPlan.branchLimit || 99999),
            userLimit: Number(firstPlan.userLimit || 9999),
            customerLimit: Number(firstPlan.customerLimit || 99999),
            invoiceLimit: Number(firstPlan.invoiceLimit || 99999),
            storageLimit: Number(firstPlan.storageLimit || 999),
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
        branchLimit: Number(firstPlan.branchLimit || 99999),
        userLimit: Number(firstPlan.userLimit || 9999),
        customerLimit: Number(firstPlan.customerLimit || 99999),
        invoiceLimit: Number(firstPlan.invoiceLimit || 99999),
        storageLimit: Number(firstPlan.storageLimit || 999),
        isCustom: Boolean(firstPlan.isCustom),
        featureFlags: firstPlan.featureFlags || defaultFeatureFlags
      });
      setEditingId(firstPlan.id);
    } else {
      setForm(emptyForm);
      setEditingId("");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });
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
        setStatus({ error: "", success: "Plan updated." });
      } else {
        await api.post("/super-admin/plans", payload);
        setStatus({ error: "", success: "Plan created." });
      }
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save plan"), success: "" });
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      monthlyPrice: Number(row.monthlyPrice || 0),
      yearlyPrice: Number(row.yearlyPrice || 0),
      trialDays: Number(row.trialDays || 14),
      branchLimit: Number(row.branchLimit || 99999),
      userLimit: Number(row.userLimit || 9999),
      customerLimit: Number(row.customerLimit || 99999),
      invoiceLimit: Number(row.invoiceLimit || 99999),
      storageLimit: Number(row.storageLimit || 999),
      isCustom: Boolean(row.isCustom),
      featureFlags: row.featureFlags || defaultFeatureFlags
    });
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
      <div className="two-col">
        <div className="panel-card">
          <h3>{editingId ? "Update Plan" : "Create Plan"}</h3>
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
              <span>Trial Duration (Days)</span>
              <input type="number" min="0" placeholder="Trial days" value={form.trialDays} onChange={(event) => setForm({ ...form, trialDays: event.target.value })} />
            </label>
            <label>
              <span>Branch Limit (9999 = unlimited)</span>
              <input type="number" min="0" placeholder="Branch limit" value={form.branchLimit} onChange={(event) => setForm({ ...form, branchLimit: event.target.value })} />
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
            <label className="checkbox-row" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={Boolean(form.isCustom)} onChange={(event) => setForm({ ...form, isCustom: event.target.checked })} style={{ minHeight: "auto", width: "auto" }} />
              <span>Mark this as a custom plan</span>
            </label>
            <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
              <button>{editingId ? "Save Plan" : "Create Plan"}</button>
              {editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel Edit</button>}
            </div>
          </form>
          {status.error && <p className="error-text">{status.error}</p>}
          {status.success && <p className="success-text">{status.success}</p>}
        </div>
        <div className="panel-card">
          <div className="section-heading">
            <h3>Plan Library</h3>
            <span className="badge">{summary.total} plans</span>
          </div>
          {loading ? (
            <PageLoader
              compact
              title="Loading plan catalog"
              message="Collecting pricing tiers, limits, and feature bundles."
            />
          ) : rows.length ? (
            rows.map((row) => (
              <div key={row.id} className="list-item">
                <div className="item-head">
                  <div>
                    <strong>{row.name}</strong>
                    <div className="item-meta">Monthly {String(row.monthlyPrice)} | Yearly {String(row.yearlyPrice)} | Trial {row.trialDays} days</div>
                  </div>
                  {row.isCustom && <span className="badge">Custom</span>}
                </div>
                <div className="item-meta">Branches {Number(row.branchLimit) >= 9999 ? "Unlimited" : row.branchLimit} | Users {row.userLimit} | Customers {row.customerLimit} | Invoices {row.invoiceLimit} | Storage {row.storageLimit || 0} GB</div>
                <button type="button" className="secondary-button" style={{ marginTop: 8 }} onClick={() => startEdit(row)}>Edit Plan</button>
              </div>
            ))
          ) : (
            <EmptyState
              title="No pricing plans yet"
              message="Create a first plan to start onboarding salons with clear feature bundles and limits."
            />
          )}
        </div>
      </div>
    </div>
  );
}
