import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";

const emptyForm = { salonId: "", planId: "", status: "ACTIVE", paymentStatus: "PAID", manualDiscount: 0, notes: "", startsAt: "", endsAt: "" };

export default function SubscriptionsPage() {
  const [rows, setRows] = useState([]);
  const [salons, setSalons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [filters, setFilters] = useState({ q: "", status: "", paymentStatus: "" });
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingRow, setEditingRow] = useState(null);
  
  const [selectedPlanChange, setSelectedPlanChange] = useState({});
  const [status, setStatus] = useState({ error: "", success: "" });
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const [subscriptionsResponse, salonsResponse, plansResponse] = await Promise.all([
        api.get("/super-admin/subscriptions", {
          params: {
            ...(nextFilters.q ? { q: nextFilters.q } : {}),
            ...(nextFilters.status ? { status: nextFilters.status } : {}),
            ...(nextFilters.paymentStatus ? { paymentStatus: nextFilters.paymentStatus } : {})
          }
        }),
        api.get("/super-admin/salons"),
        api.get("/super-admin/plans")
      ]);
      setRows(subscriptionsResponse.data);
      setSalons(salonsResponse.data);
      setPlans(plansResponse.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load customer data."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });
    setBusyId("create");
    try {
      await api.post("/super-admin/subscriptions", {
        ...form,
        manualDiscount: Number(form.manualDiscount || 0)
      });
      setForm(emptyForm);
      setIsCreateOpen(false);
      await load();
      setStatus({ error: "", success: "Customer subscription created successfully." });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not create subscription"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingRow) return;
    setStatus({ error: "", success: "" });
    setBusyId("edit");
    try {
      await api.patch(`/super-admin/subscriptions/${editingRow.id}`, {
        status: form.status,
        paymentStatus: form.paymentStatus,
        endsAt: form.endsAt,
        manualDiscount: Number(form.manualDiscount || 0),
        notes: form.notes
      });
      setIsEditOpen(false);
      setEditingRow(null);
      await load();
      setStatus({ error: "", success: "Subscription settings saved." });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not update subscription"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const openEditModal = (row) => {
    setEditingRow(row);
    setForm({
      salonId: row.salonId,
      planId: row.planId,
      status: row.status,
      paymentStatus: row.paymentStatus || "PAID",
      manualDiscount: Number(row.manualDiscount || 0),
      notes: row.notes || "",
      startsAt: row.startsAt ? new Date(row.startsAt).toISOString().slice(0, 10) : "",
      endsAt: row.endsAt ? new Date(row.endsAt).toISOString().slice(0, 10) : ""
    });
    setIsEditOpen(true);
  };

  const updateSubscriptionDirect = async (id, patch) => {
    setBusyId(id);
    setStatus({ error: "", success: "" });
    try {
      await api.patch(`/super-admin/subscriptions/${id}`, patch);
      await load();
      setStatus({ error: "", success: "Status updated successfully." });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not update status"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const deleteSubscription = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subscription? This will clear its billing history logs.")) return;
    setBusyId(id);
    setStatus({ error: "", success: "" });
    try {
      await api.delete(`/super-admin/subscriptions/${id}`);
      await load();
      setStatus({ error: "", success: "Subscription cleared from registry." });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not delete subscription"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const sendExpiryReminder = async (id) => {
    setBusyId(`reminder-${id}`);
    setStatus({ error: "", success: "" });
    try {
      const response = await api.post(`/super-admin/subscriptions/${id}/send-trial-reminder`);
      setStatus({
        error: response.data.emailError ? `Reminder prepared but email failed: ${response.data.emailError}` : "",
        success: `Renewal reminder dispatched to owner successfully!`
      });
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not send renewal reminder."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const getAlertText = (row) => {
    const now = new Date();
    const endsAt = new Date(row.endsAt);
    const diffDays = Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24));
    if (row.status === "EXPIRED" || diffDays < 0) return "Expired";
    if (diffDays <= 7) return `Expiring in ${diffDays} day(s)`;
    return "";
  };

  return (
    <div className="page-shell super-admin-page">
      {/* Page Hero Dashboard Header */}
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>👥 Customer Management</h1>
            <p style={{ marginBottom: 0 }}>Monitor active salon clients, verify payments, upgrade subscription tiers, and trigger renewal reminders.</p>
          </div>
          <button type="button" onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            ➕ Onboard Client Plan
          </button>
        </div>
        <div className="badge-row" style={{ marginTop: 14 }}>
          <span className="badge">Total Active Contracts: {rows.length}</span>
          <span className="badge">Registered Salons: {salons.length}</span>
          <span className="badge">Plan Catalog: {plans.length}</span>
        </div>
      </div>

      {/* Global Action Messages */}
      {status.success && <div className="success-text" style={{ padding: 12, borderRadius: 10, marginBottom: 16 }}>{status.success}</div>}
      {status.error && <div className="error-text" style={{ padding: 12, borderRadius: 10, marginBottom: 16 }}>{status.error}</div>}

      {/* Search and Filters Deck */}
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <label>
            <span className="muted">Search Tenant or Plan</span>
            <input value={filters.q} placeholder="Search salon, plan name, or email..." onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />
          </label>
          <label>
            <span className="muted">Status Filter</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </label>
          <label>
            <span className="muted">Payment Health</span>
            <select value={filters.paymentStatus} onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value }))}>
              <option value="">All payment states</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </label>
          <button type="button" className="secondary-button" onClick={() => load(filters)}>Apply Filters</button>
          <button type="button" className="secondary-button" onClick={() => setFilters({ q: "", status: "", paymentStatus: "" })}>Reset</button>
        </div>
      </div>

      {/* Main Customers List Stack */}
      {loading ? (
        <PageLoader compact title="Loading subscription list" message="Fetching account metrics, renewals status, and usage thresholds." />
      ) : rows.length ? (
        <div className="leads-list-container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {rows.map((row) => {
            const isBusy = busyId === row.id || busyId === `reminder-${row.id}`;
            const alertText = getAlertText(row);
            
            return (
              <div key={row.id} className="lead-card" style={{ gridTemplateColumns: "1.2fr 1fr 1fr" }}>
                {/* Column 1: Salon details */}
                <div className="lead-profile-sec">
                  <div className="lead-avatar" style={{ background: row.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", color: row.status === "ACTIVE" ? "#059669" : "#dc2626" }}>
                    🏢
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px" }}>{row.salon?.name || "Unknown Salon"}</h3>
                    <div className="lead-sub-meta" style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      Slug: <span style={{ fontWeight: 600, color: "#1e293b" }}>{row.salon?.slug}</span>
                    </div>
                    <div className="lead-sub-meta" style={{ marginTop: 4 }}>
                      📧 <a href={`mailto:${row.salon?.email}`} style={{ textDecoration: "underline" }}>{row.salon?.email}</a>
                    </div>
                    <div className="lead-sub-meta">
                      📞 <a href={`tel:${row.salon?.phone}`}>{row.salon?.phone}</a>
                    </div>
                    <div style={{ marginTop: 8 }} className="badge-row">
                      <span className="badge" style={{ background: row.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", color: row.status === "ACTIVE" ? "#047857" : "#b91c1c" }}>
                        {row.status}
                      </span>
                      <span className="badge" style={{ background: row.paymentStatus === "PAID" ? "#f0fdf4" : "#fff7ed", color: row.paymentStatus === "PAID" ? "#16a34a" : "#ea580c" }}>
                        Payment: {row.paymentStatus || "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Plan and limits details */}
                <div className="lead-setup-box" style={{ background: "#f8fafc", padding: 12, borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong>🏷️ Plan: {row.plan?.name}</strong>
                    {row.plan?.isCustom && <span className="badge">Custom</span>}
                  </div>
                  <div style={{ fontSize: "0.85rem", display: "grid", gap: 4, color: "#475569" }}>
                    <div>🌐 Branches: <strong>{row.plan?.branchLimit} max</strong></div>
                    <div>👥 User Accounts: <strong>{row.plan?.userLimit} max</strong></div>
                    <div>📊 Customers Record: <strong>{row.plan?.customerLimit} max</strong></div>
                    <div>🧾 Invoices Limit: <strong>{row.plan?.invoiceLimit} max</strong></div>
                    <div>💾 Cloud Storage: <strong>{row.plan?.storageLimit || 0} GB</strong></div>
                    {row.manualDiscount > 0 && <div style={{ color: "#2563eb" }}>🏷️ Discount: <strong>INR {row.manualDiscount / 100}</strong></div>}
                  </div>
                </div>

                {/* Column 3: Expiry metrics, Reminders and admin actions */}
                <div className="lead-actions-panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: "0.85rem", color: "#334155" }}>
                    <div>📅 Active: <strong>{new Date(row.startsAt).toLocaleDateString()}</strong></div>
                    <div>📅 Expiry: <strong>{new Date(row.endsAt).toLocaleDateString()}</strong></div>
                    {alertText && (
                      <div style={{ marginTop: 6, display: "inline-block", background: "#fef2f2", color: "#b91c1c", fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>
                        ⚠️ {alertText}
                      </div>
                    )}
                  </div>

                  {/* Plan Change Selector */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                    <select
                      style={{ padding: "4px 8px", fontSize: "0.8rem", height: 32 }}
                      value={selectedPlanChange[row.id] || ""}
                      onChange={(e) => setSelectedPlanChange({ ...selectedPlanChange, [row.id]: e.target.value })}
                    >
                      <option value="">Upgrade Tier...</option>
                      {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ padding: "0 10px", fontSize: "0.8rem", height: 32 }}
                      disabled={!selectedPlanChange[row.id] || isBusy}
                      onClick={() => updateSubscriptionDirect(row.id, { planId: selectedPlanChange[row.id], notes: "Plan updated via Customer management panel." })}
                    >
                      Apply
                    </button>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                    <button type="button" className="secondary-button" style={{ flex: 1, padding: "6px 8px", fontSize: "0.8rem" }} onClick={() => openEditModal(row)} disabled={isBusy}>
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ flex: 1, padding: "6px 8px", fontSize: "0.8rem", background: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4" }}
                      onClick={() => sendExpiryReminder(row.id)}
                      disabled={isBusy}
                    >
                      {busyId === `reminder-${row.id}` ? "Sending..." : "🔔 Remind"}
                    </button>
                    <button type="button" className="danger-button" style={{ padding: "6px 10px", fontSize: "0.8rem" }} onClick={() => deleteSubscription(row.id)} disabled={isBusy}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No customers registered yet" message="Onboard a client manually or wait for someone to complete checkout!" />
      )}

      {/* Onboard Client Modal */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3>➕ Onboard Client to Plan</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="form-grid">
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Select Salon Workspace</span>
                <select required value={form.salonId} onChange={(e) => setForm({ ...form, salonId: e.target.value })}>
                  <option value="">-- Choose workspace --</option>
                  {salons.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.slug})</option>)}
                </select>
              </label>
              <label>
                <span>Select Tier Plan</span>
                <select required value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
                  <option value="">-- Choose Plan --</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </label>
              <label>
                <span>Payment Status</span>
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>
              <label>
                <span>Discount Amount (INR)</span>
                <input type="number" min="0" value={form.manualDiscount} onChange={(e) => setForm({ ...form, manualDiscount: e.target.value })} />
              </label>
              <label>
                <span>Contract Start Date</span>
                <input type="date" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </label>
              <label>
                <span>Contract End Date</span>
                <input type="date" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Internal Notes</span>
                <textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal onboarding details..." />
              </label>
              <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <button type="submit" style={{ width: "100%" }} disabled={busyId === "create"}>
                  {busyId === "create" ? "Provisioning..." : "Onboard Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Settings Modal */}
      {isEditOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>✏️ Edit Subscription Settings</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsEditOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="form-grid">
              <label>
                <span>Contract Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </label>
              <label>
                <span>Payment Health</span>
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>
              <label>
                <span>Contract Expiration</span>
                <input type="date" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </label>
              <label>
                <span>Discount Amount (INR)</span>
                <input type="number" min="0" value={form.manualDiscount} onChange={(e) => setForm({ ...form, manualDiscount: e.target.value })} />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Internal Notes</span>
                <textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Write internal audit updates here..." />
              </label>
              <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <button type="submit" style={{ width: "100%" }} disabled={busyId === "edit"}>
                  {busyId === "edit" ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
