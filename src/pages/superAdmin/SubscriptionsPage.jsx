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
      const [subRes, salonRes, planRes] = await Promise.all([
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
      setRows(subRes.data);
      setSalons(salonRes.data);
      setPlans(planRes.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load subscription data."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: "", success: "" });
    setBusyId("create");
    try {
      await api.post("/super-admin/subscriptions", { ...form, manualDiscount: Number(form.manualDiscount || 0) });
      setForm(emptyForm);
      setIsCreateOpen(false);
      await load();
      setStatus({ error: "", success: "Subscription created." });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not create subscription"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRow) return;
    setStatus({ error: "", success: "" });
    setBusyId("edit");
    try {
      await api.patch(`/super-admin/subscriptions/${editingRow.id}`, {
        status: form.status, paymentStatus: form.paymentStatus, endsAt: form.endsAt,
        manualDiscount: Number(form.manualDiscount || 0), notes: form.notes
      });
      setIsEditOpen(false);
      setEditingRow(null);
      await load();
      setStatus({ error: "", success: "Subscription updated." });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not update subscription"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const openEditModal = (row) => {
    setEditingRow(row);
    setForm({
      salonId: row.salonId, planId: row.planId, status: row.status,
      paymentStatus: row.paymentStatus || "PAID", manualDiscount: Number(row.manualDiscount || 0),
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
      setSelectedPlanChange((prev) => { const n = { ...prev }; delete n[id]; return n; });
      await load();
      setStatus({ error: "", success: "Plan updated." });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not update plan"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const deleteSubscription = async (id) => {
    if (!window.confirm("Delete this subscription? This cannot be undone.")) return;
    setBusyId(id);
    setStatus({ error: "", success: "" });
    try {
      await api.delete(`/super-admin/subscriptions/${id}`);
      await load();
      setStatus({ error: "", success: "Subscription deleted." });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not delete subscription"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const sendExpiryReminder = async (id) => {
    setBusyId(`reminder-${id}`);
    setStatus({ error: "", success: "" });
    try {
      const res = await api.post(`/super-admin/subscriptions/${id}/send-trial-reminder`);
      if (res.data.emailError) {
        setStatus({ error: `Email failed: ${res.data.emailError}`, success: "" });
      } else {
        setStatus({ error: "", success: "Renewal reminder sent to owner." });
      }
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not send reminder."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const getAlertText = (row) => {
    const diffDays = Math.ceil((new Date(row.endsAt) - new Date()) / (1000 * 60 * 60 * 24));
    if (row.status === "EXPIRED" || diffDays < 0) return "Expired";
    if (diffDays <= 7) return `Expiring in ${diffDays} day(s)`;
    return "";
  };

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Customer Management</h1>
            <p style={{ marginBottom: 0 }}>Monitor active salon clients, verify payments, upgrade plans, and trigger renewal reminders.</p>
          </div>
          <button type="button" onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            + Onboard Client
          </button>
        </div>
        <div className="badge-row" style={{ marginTop: 14 }}>
          <span className="badge">Total: {rows.length}</span>
          <span className="badge">Salons: {salons.length}</span>
          <span className="badge">Plans: {plans.length}</span>
        </div>
      </div>

      {status.success && <div style={{ padding: 12, borderRadius: 10, marginBottom: 16, background: "#ecfdf5", color: "#065f46", fontWeight: 500, fontSize: 14 }}>{status.success}</div>}
      {status.error && <div style={{ padding: 12, borderRadius: 10, marginBottom: 16, background: "#fef2f2", color: "#991b1b", fontWeight: 500, fontSize: 14 }}>{status.error}</div>}

      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <label>
            <span className="muted">Search</span>
            <input value={filters.q} placeholder="Search salon, plan name, or email..." onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value }))} />
          </label>
          <label>
            <span className="muted">Status</span>
            <select value={filters.status} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </label>
          <label>
            <span className="muted">Payment</span>
            <select value={filters.paymentStatus} onChange={(e) => setFilters((c) => ({ ...c, paymentStatus: e.target.value }))}>
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </label>
          <button type="button" className="secondary-button" onClick={() => setFilters({ q: "", status: "", paymentStatus: "" })}>Reset</button>
        </div>
      </div>

      {loading ? (
        <PageLoader compact title="Loading subscriptions" message="Fetching subscription data..." />
      ) : rows.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {rows.map((row) => {
            const isBusy = busyId === row.id || busyId === `reminder-${row.id}`;
            const alertText = getAlertText(row);
            return (
              <div key={row.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 20 }}>
                {/* Salon Info */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: row.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", color: row.status === "ACTIVE" ? "#059669" : "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{(row.salon?.name || "S").charAt(0)}</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1rem" }}>{row.salon?.name || "Unknown"}</h3>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Slug: {row.salon?.slug}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#475569", display: "flex", flexDirection: "column", gap: 4 }}>
                    <a href={`mailto:${row.salon?.email}`} style={{ color: "#4f46e5", textDecoration: "none" }}>{row.salon?.email}</a>
                    <a href={`tel:${row.salon?.phone}`} style={{ color: "#4f46e5", textDecoration: "none" }}>{row.salon?.phone}</a>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <span className="badge" style={{ background: row.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", color: row.status === "ACTIVE" ? "#047857" : "#b91c1c" }}>{row.status}</span>
                    <span className="badge" style={{ background: row.paymentStatus === "PAID" ? "#f0fdf4" : "#fff7ed", color: row.paymentStatus === "PAID" ? "#16a34a" : "#ea580c" }}>{row.paymentStatus || "PENDING"}</span>
                  </div>
                </div>

                {/* Plan Info */}
                <div style={{ background: "#f8fafc", padding: 14, borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ fontSize: "0.9rem" }}>Plan: {row.plan?.name}</strong>
                    {row.plan?.isCustom && <span className="badge" style={{ fontSize: "0.7rem" }}>Custom</span>}
                  </div>
                  <div style={{ fontSize: "0.8rem", display: "grid", gap: 3, color: "#475569" }}>
                    <div>Branches: {row.plan?.branchLimit} &bull; Users: {row.plan?.userLimit}</div>
                    <div>Customers: {row.plan?.customerLimit} &bull; Invoices: {row.plan?.invoiceLimit}</div>
                    <div>Storage: {row.plan?.storageLimit || 0}GB</div>
                    {row.manualDiscount > 0 && <div style={{ color: "#2563eb", fontWeight: 600 }}>Discount: {Number(row.manualDiscount).toLocaleString("en-IN")}</div>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: "0.8rem", color: "#475569" }}>
                    <div>Start: {new Date(row.startsAt).toLocaleDateString()}</div>
                    <div>End: {new Date(row.endsAt).toLocaleDateString()}</div>
                    {alertText && <div style={{ color: "#dc2626", fontWeight: 600, marginTop: 4 }}>{alertText}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select style={{ flex: 1, padding: "4px 8px", fontSize: "0.8rem", height: 32 }} value={selectedPlanChange[row.id] || ""} onChange={(e) => setSelectedPlanChange({ ...selectedPlanChange, [row.id]: e.target.value })}>
                      <option value="">Change plan...</option>
                      {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button type="button" className="secondary-button" style={{ padding: "0 10px", fontSize: "0.8rem", height: 32 }} disabled={!selectedPlanChange[row.id] || isBusy} onClick={() => updateSubscriptionDirect(row.id, { planId: selectedPlanChange[row.id] })}>Apply</button>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                    <button type="button" className="secondary-button" style={{ flex: 1, padding: "6px 8px", fontSize: "0.8rem" }} onClick={() => openEditModal(row)} disabled={isBusy}>Edit</button>
                    <button type="button" style={{ flex: 1, padding: "6px 8px", fontSize: "0.8rem", background: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4", borderRadius: 6, cursor: isBusy ? "not-allowed" : "pointer" }} onClick={() => sendExpiryReminder(row.id)} disabled={isBusy}>{busyId === `reminder-${row.id}` ? "Sending..." : "Remind"}</button>
                    <button type="button" style={{ padding: "6px 10px", fontSize: "0.8rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, cursor: isBusy ? "not-allowed" : "pointer" }} onClick={() => deleteSubscription(row.id)} disabled={isBusy}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No subscriptions yet" message="Onboard a client or wait for checkout completions." />
      )}

      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3>Onboard Client</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="form-grid">
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Salon *</span>
                <select required value={form.salonId} onChange={(e) => setForm({ ...form, salonId: e.target.value })}>
                  <option value="">-- Select salon --</option>
                  {salons.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.slug})</option>)}
                </select>
              </label>
              <label>
                <span>Plan *</span>
                <select required value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
                  <option value="">-- Select plan --</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="TRIAL">Trial</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </label>
              <label>
                <span>Payment</span>
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>
              <label>
                <span>Discount</span>
                <input type="number" min="0" value={form.manualDiscount} onChange={(e) => setForm({ ...form, manualDiscount: e.target.value })} />
              </label>
              <label>
                <span>Start Date *</span>
                <input type="date" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </label>
              <label>
                <span>End Date *</span>
                <input type="date" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Notes</span>
                <textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." />
              </label>
              <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <button type="submit" style={{ width: "100%" }} disabled={busyId === "create"}>{busyId === "create" ? "Creating..." : "Onboard Client"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Edit Subscription</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsEditOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="form-grid">
              <label>
                <span>Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="TRIAL">Trial</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </label>
              <label>
                <span>Payment</span>
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>
              <label>
                <span>End Date *</span>
                <input type="date" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </label>
              <label>
                <span>Discount</span>
                <input type="number" min="0" value={form.manualDiscount} onChange={(e) => setForm({ ...form, manualDiscount: e.target.value })} />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Notes</span>
                <textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." />
              </label>
              <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <button type="submit" style={{ width: "100%" }} disabled={busyId === "edit"}>{busyId === "edit" ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
