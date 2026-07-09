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

      <div className="panel-card" style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <input 
              value={filters.q} 
              placeholder="Search salon, plan name, or email..." 
              onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value }))} 
              style={{ width: "100%", minHeight: 40, padding: "8px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc" }}
            />
          </div>
          <div style={{ width: 160 }}>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}
              style={{ width: "100%", minHeight: 40, padding: "8px 12px", borderRadius: 8, fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc" }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          <div style={{ width: 160 }}>
            <select 
              value={filters.paymentStatus} 
              onChange={(e) => setFilters((c) => ({ ...c, paymentStatus: e.target.value }))}
              style={{ width: "100%", minHeight: 40, padding: "8px 12px", borderRadius: 8, fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc" }}
            >
              <option value="">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div>
            <button 
              type="button" 
              onClick={() => setFilters({ q: "", status: "", paymentStatus: "" })} 
              style={{ minHeight: 40, padding: "0 18px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader compact title="Loading subscriptions" message="Fetching subscription data..." />
      ) : rows.length ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Salon Info</th>
                <th style={{ padding: "12px 16px" }}>Plan Details</th>
                <th style={{ padding: "12px 16px" }}>Validity Period</th>
                <th style={{ padding: "12px 16px" }}>Quick Plan Actions</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isBusy = busyId === row.id || busyId === `reminder-${row.id}`;
                const alertText = getAlertText(row);
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} className="table-row-hover">
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: row.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", color: row.status === "ACTIVE" ? "#059669" : "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{(row.salon?.name || "S").charAt(0).toUpperCase()}</div>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{row.salon?.name || "Unknown"}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.salon?.email}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: row.status === "ACTIVE" ? "#10b981" : "#ef4444", background: row.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", padding: "2px 6px", borderRadius: 100 }}>{row.status}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: row.paymentStatus === "PAID" ? "#16a34a" : "#ea580c", background: row.paymentStatus === "PAID" ? "#f0fdf4" : "#fff7ed", padding: "2px 6px", borderRadius: 100 }}>{row.paymentStatus || "PENDING"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{row.plan?.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                        Branches: {row.plan?.branchLimit} &bull; Users: {row.plan?.userLimit}
                      </div>
                      {row.manualDiscount > 0 && <div style={{ color: "#2563eb", fontWeight: 700, fontSize: 11, marginTop: 2 }}>Discount: ₹{Number(row.manualDiscount).toLocaleString("en-IN")}</div>}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      <div>Start: {new Date(row.startsAt).toLocaleDateString()}</div>
                      <div style={{ marginTop: 2 }}>End: {new Date(row.endsAt).toLocaleDateString()}</div>
                      {alertText && <div style={{ color: "#dc2626", fontWeight: 700, fontSize: 11, marginTop: 4 }}>⚠️ {alertText}</div>}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <select style={{ padding: "6px 8px", fontSize: 12, height: 32, borderRadius: 6, border: "1px solid #cbd5e1", background: "white", minWidth: 120 }} value={selectedPlanChange[row.id] || ""} onChange={(e) => setSelectedPlanChange({ ...selectedPlanChange, [row.id]: e.target.value })}>
                          <option value="">Change plan...</option>
                          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button type="button" onClick={() => updateSubscriptionDirect(row.id, { planId: selectedPlanChange[row.id] })} disabled={!selectedPlanChange[row.id] || isBusy} style={{ padding: "0 10px", fontSize: 12, height: 32, borderRadius: 6, background: "#f1f5f9", color: "#475569", border: "none", cursor: "pointer", fontWeight: 700 }}>
                          Apply
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => openEditModal(row)} disabled={isBusy} style={{ padding: "6px 12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => sendExpiryReminder(row.id)} disabled={isBusy} style={{ padding: "6px 12px", background: "#ecfdf5", color: "#0d9488", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                          {busyId === `reminder-${row.id}` ? "..." : "Remind"}
                        </button>
                        <button type="button" onClick={() => deleteSubscription(row.id)} disabled={isBusy} style={{ padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
            <form onSubmit={handleCreateSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
              <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Salon *</span>
                <select required value={form.salonId} onChange={(e) => setForm({ ...form, salonId: e.target.value })}>
                  <option value="">-- Select salon --</option>
                  {salons.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.slug})</option>)}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Plan *</span>
                <select required value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
                  <option value="">-- Select plan --</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Payment</span>
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Discount</span>
                <input type="number" min="0" value={form.manualDiscount} onChange={(e) => setForm({ ...form, manualDiscount: e.target.value })} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Start Date *</span>
                <input type="date" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>End Date *</span>
                <input type="date" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </label>
              <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Notes</span>
                <textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." />
              </label>
              <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", fontWeight: 700, fontSize: "0.95rem", borderRadius: 12, padding: "14px 24px", minHeight: 48, cursor: "pointer", border: "none" }} disabled={busyId === "create"}>{busyId === "create" ? "Creating..." : "Onboard Client"}</button>
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
            <form onSubmit={handleEditSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Payment</span>
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>End Date *</span>
                <input type="date" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Discount</span>
                <input type="number" min="0" value={form.manualDiscount} onChange={(e) => setForm({ ...form, manualDiscount: e.target.value })} />
              </label>
              <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Notes</span>
                <textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." />
              </label>
              <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", fontWeight: 700, fontSize: "0.95rem", borderRadius: 12, padding: "14px 24px", minHeight: 48, cursor: "pointer", border: "none" }} disabled={busyId === "edit"}>{busyId === "edit" ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
