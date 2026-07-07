/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useBranch } from "../../context/BranchContext";
import { useSalonSettings } from "../../context/SalonSettingsContext";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import {
  Package, Search, Filter, CheckCircle2, Clock, XCircle, Truck,
  AlertCircle, Eye, ArrowRight, Download, Calendar, DollarSign,
  ShoppingCart, TrendingUp, Ban, RotateCcw, ChevronDown, ChevronRight,
  User, Phone, Mail, MapPin, CreditCard, FileText, MessageSquare,
  X, RefreshCcw, Printer, ExternalLink
} from "lucide-react";

const STATUS_FLOW = {
  NEW: { next: "ACCEPTED", color: "#3b82f6", bg: "#eff6ff", label: "New", icon: ShoppingCart },
  ACCEPTED: { next: "READY", color: "#f59e0b", bg: "#fffbeb", label: "Accepted", icon: CheckCircle2 },
  READY: { next: "COMPLETED", color: "#8b5cf6", bg: "#f5f3ff", label: "Ready", icon: Truck },
  COMPLETED: { next: null, color: "#10b981", bg: "#ecfdf5", label: "Completed", icon: CheckCircle2 },
  CANCELLED: { next: null, color: "#ef4444", bg: "#fef2f2", label: "Cancelled", icon: Ban },
};

const PAYMENT_STATUS_COLORS = {
  PENDING: { color: "#f59e0b", bg: "#fffbeb" },
  PAID: { color: "#10b981", bg: "#ecfdf5" },
  FAILED: { color: "#ef4444", bg: "#fef2f2" },
  REFUNDED: { color: "#6366f1", bg: "#f5f3ff" },
};

const TABS = [
  { key: "", label: "All Orders", hint: "All" },
  { key: "NEW", label: "New", hint: "Pending" },
  { key: "ACCEPTED", label: "Accepted", hint: "Processing" },
  { key: "READY", label: "Ready", hint: "Fulfillment" },
  { key: "COMPLETED", label: "Completed", hint: "Done" },
  { key: "CANCELLED", label: "Cancelled", hint: "Reversed" },
];

const StatusBadge = ({ status, size = "md" }) => {
  const config = STATUS_FLOW[status] || STATUS_FLOW.NEW;
  const Icon = config.icon;
  return (
    <span className={`order-status-badge status-${size}`} style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}20` }}>
      <Icon size={size === "sm" ? 12 : 14} />
      {config.label}
    </span>
  );
};

const PaymentBadge = ({ status }) => {
  const config = PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.PENDING;
  return (
    <span className="order-payment-badge" style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}20` }}>
      {status}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="order-stat-card" style={{ borderLeft: `4px solid ${color}` }}>
    <div className="order-stat-icon" style={{ background: bg, color }}>
      <Icon size={20} />
    </div>
    <div className="order-stat-content">
      <div className="order-stat-value">{value}</div>
      <div className="order-stat-label">{label}</div>
    </div>
  </div>
);

export default function OrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { selectedBranchId } = useBranch();
  const { formatMoney } = useSalonSettings();

  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });

  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [statusLoading, setStatusLoading] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(null);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (activeTab) result = result.filter((r) => r.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        r.orderNumber?.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.customerPhone?.includes(q) ||
        r.customerEmail?.toLowerCase().includes(q)
      );
    }
    if (dateRange.start) result = result.filter((r) => new Date(r.createdAt) >= new Date(dateRange.start));
    if (dateRange.end) result = result.filter((r) => new Date(r.createdAt) <= new Date(dateRange.end + "T23:59:59"));
    return result;
  }, [rows, activeTab, search, dateRange]);

  const stats = useMemo(() => {
    const total = rows.length;
    const newCount = rows.filter((r) => r.status === "NEW").length;
    const accepted = rows.filter((r) => r.status === "ACCEPTED").length;
    const ready = rows.filter((r) => r.status === "READY").length;
    const completed = rows.filter((r) => r.status === "COMPLETED").length;
    const cancelled = rows.filter((r) => r.status === "CANCELLED").length;
    const revenue = rows.filter((r) => r.status !== "CANCELLED").reduce((s, r) => s + Number(r.total || 0), 0);
    const avgOrder = total > 0 ? revenue / (total - cancelled || 1) : 0;
    return { total, newCount, accepted, ready, completed, cancelled, revenue, avgOrder };
  }, [rows]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, summaryRes] = await Promise.all([
        api.get("/owner/orders", { params: { ...(selectedBranchId ? { branchId: selectedBranchId } : {}) } }),
        api.get("/owner/orders/reports/summary")
      ]);
      setRows(ordersRes.data || []);
      setSummary(summaryRes.data);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not load orders"), success: "" });
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (params.id) {
      api.get(`/owner/orders/${params.id}`).then((res) => {
        setDetail(res.data);
        setSelectedOrder(res.data);
        setShowDetail(true);
      }).catch(() => {});
    }
  }, [params.id]);

  const openDetail = async (order) => {
    setSelectedOrder(order);
    setShowDetail(true);
    try {
      const res = await api.get(`/owner/orders/${order.id}`);
      setDetail(res.data);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not load order details"), success: "" });
    }
  };

  const updateStatus = async (id, nextStatus) => {
    setStatusLoading(id + nextStatus);
    try {
      await api.patch(`/owner/orders/${id}/status`, { status: nextStatus });
      setStatus({ error: "", success: `Order moved to ${STATUS_FLOW[nextStatus]?.label || nextStatus}.` });
      setShowCancelModal(null);
      setCancelReason("");
      await load();
      if (selectedOrder?.id === id) {
        const res = await api.get(`/owner/orders/${id}`);
        setDetail(res.data);
        setSelectedOrder(res.data);
      }
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not update order"), success: "" });
    } finally {
      setStatusLoading("");
    }
  };

  const cancelOrder = async (id) => {
    setStatusLoading(id + "CANCEL");
    try {
      await api.patch(`/owner/orders/${id}/cancel`, { note: cancelReason || "Cancelled from owner panel" });
      setStatus({ error: "", success: "Order cancelled successfully." });
      setShowCancelModal(null);
      setCancelReason("");
      await load();
      if (selectedOrder?.id === id) {
        const res = await api.get(`/owner/orders/${id}`);
        setDetail(res.data);
        setSelectedOrder(res.data);
      }
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not cancel order"), success: "" });
    } finally {
      setStatusLoading("");
    }
  };

  const convertToInvoice = async (id) => {
    setStatusLoading(id + "INVOICE");
    try {
      await api.post(`/owner/orders/${id}/convert-to-invoice`);
      setStatus({ error: "", success: "Order converted to invoice successfully." });
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not convert to invoice"), success: "" });
    } finally {
      setStatusLoading("");
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const formatDateTime = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="page-shell">
      <style>{`
        .order-stat-card{display:flex;align-items:center;gap:12px;padding:16px 20px;background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);transition:all .2s}
        .order-stat-card:hover{box-shadow:0 4px 12px rgba(0,0,0,.1);transform:translateY(-1px)}
        .order-stat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .order-stat-value{font-size:22px;font-weight:700;color:#0f172a;line-height:1.2}
        .order-stat-label{font-size:12px;color:#64748b;font-weight:500;text-transform:uppercase;letter-spacing:.3px}
        .order-tabs{display:flex;gap:4px;background:white;padding:4px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow-x:auto;margin-bottom:16px}
        .order-tab{padding:10px 20px;border-radius:8px;border:none;background:transparent;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s;white-space:nowrap}
        .order-tab.active{background:#6366f1;color:white;box-shadow:0 2px 8px rgba(99,102,241,.3)}
        .order-tab:not(.active):hover{background:#f1f5f9;color:#1e293b}
        .order-tab-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:10px;font-size:11px;font-weight:700;margin-left:6px;padding:0 6px}
        .order-tab.active .order-tab-count{background:rgba(255,255,255,.25);color:white}
        .order-tab:not(.active) .order-tab-count{background:#f1f5f9;color:#64748b}
        .order-search-bar{display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
        .order-search-input{flex:1;min-width:240px;padding:10px 16px 10px 40px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;background:white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 24 24'%3E%3Cpath d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E") 12px center no-repeat;transition:all .2s}
        .order-search-input:focus{outline:none;border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1)}
        .order-date-input{padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;background:white;color:#334155}
        .order-date-input:focus{outline:none;border-color:#6366f1}
        .order-list-table{width:100%;border-collapse:separate;border-spacing:0;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)}
        .order-list-table thead th{padding:14px 16px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
        .order-list-table tbody tr{cursor:pointer;transition:all .15s}
        .order-list-table tbody tr:hover{background:#f8fafc}
        .order-list-table tbody td{padding:14px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;vertical-align:middle}
        .order-list-table tbody tr:last-child td{border-bottom:none}
        .order-number{font-weight:700;color:#6366f1;font-size:13px}
        .order-customer-cell{display:flex;align-items:center;gap:10px}
        .order-customer-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}
        .order-customer-info{line-height:1.4}
        .order-customer-name{font-weight:600;font-size:14px;color:#0f172a}
        .order-customer-contact{font-size:12px;color:#64748b}
        .order-amount{font-weight:700;font-size:15px;color:#0f172a}
        .order-items-preview{font-size:12px;color:#64748b}
        .order-actions-cell{display:flex;gap:6px;justify-content:flex-end}
        .order-action-btn{padding:6px 12px;border-radius:8px;border:1px solid #e2e8f0;background:white;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:4px}
        .order-action-btn:hover{background:#f8fafc;box-shadow:0 2px 4px rgba(0,0,0,.05)}
        .order-action-btn.primary{background:#6366f1;color:white;border-color:#6366f1}
        .order-action-btn.primary:hover{background:#4f46e5}
        .order-action-btn.danger{color:#ef4444;border-color:#fecaca}
        .order-action-btn.danger:hover{background:#fef2f2}
        .order-action-btn.success{color:#10b981;border-color:#a7f3d0}
        .order-action-btn.success:hover{background:#ecfdf5}
        .order-detail-panel{background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;height:fit-content;position:sticky;top:20px}
        .order-detail-header{padding:20px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white}
        .order-detail-header h3{margin:0 0 4px;font-size:18px;font-weight:700}
        .order-detail-header p{margin:0;opacity:.85;font-size:13px}
        .order-detail-section{padding:16px 24px;border-bottom:1px solid #f1f5f9}
        .order-detail-section:last-child{border-bottom:none}
        .order-detail-section h4{margin:0 0 12px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
        .order-detail-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:14px}
        .order-detail-row .label{color:#64748b;font-weight:500}
        .order-detail-row .value{font-weight:600;color:#0f172a}
        .order-detail-item{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8fafc;border-radius:8px;margin-bottom:8px}
        .order-detail-item:last-child{margin-bottom:0}
        .order-detail-item .item-name{font-weight:600;font-size:14px;color:#0f172a}
        .order-detail-item .item-meta{font-size:12px;color:#64748b;margin-top:2px}
        .order-detail-item .item-total{font-weight:700;font-size:14px;color:#0f172a}
        .order-timeline{position:relative;padding-left:24px}
        .order-timeline::before{content:'';position:absolute;left:7px;top:0;bottom:0;width:2px;background:#e2e8f0}
        .order-timeline-item{position:relative;padding-bottom:16px}
        .order-timeline-item:last-child{padding-bottom:0}
        .order-timeline-dot{position:absolute;left:-24px;top:2px;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #6366f1}
        .order-timeline-content{padding-left:8px}
        .order-timeline-status{font-weight:600;font-size:14px;color:#0f172a}
        .order-timeline-meta{font-size:12px;color:#64748b;margin-top:2px}
        .order-detail-actions{padding:16px 24px;display:flex;gap:8px;flex-wrap:wrap}
        .order-cancel-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center}
        .order-cancel-modal{background:white;border-radius:16px;padding:24px;width:90%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
        .order-cancel-modal h3{margin:0 0 16px;font-size:18px;font-weight:700}
        .order-cancel-textarea{width:100%;min-height:80px;padding:12px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;resize:vertical}
        .order-cancel-textarea:focus{outline:none;border-color:#ef4444}
        .order-cancel-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
        .order-empty{text-align:center;padding:60px 20px}
        .order-empty-icon{width:64px;height:64px;border-radius:16px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
        .order-empty h3{margin:0 0 8px;font-size:16px;color:#0f172a}
        .order-empty p{margin:0;color:#64748b;font-size:14px}
        @media(max-width:1024px){.order-detail-panel{display:none}}
        @media(max-width:768px){.order-search-bar{flex-direction:column}.order-search-input{min-width:auto}}
      `}</style>

      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <Package size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0 }}>Online Orders</h1>
              <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Manage storefront orders from placement to fulfillment with full visibility.</p>
            </div>
          </div>
          <div className="badge-row">
            <span className="badge">{filteredRows.length} orders</span>
            <span className="badge">{activeTab || "ALL"}</span>
          </div>
        </div>
      </div>

      {status.error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
          <span style={{ color: "#dc2626", fontSize: 14 }}>{status.error}</span>
          <button onClick={() => setStatus({ error: "", success: "" })} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><X size={16} /></button>
        </div>
      )}
      {status.success && (
        <div style={{ padding: "12px 16px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
          <span style={{ color: "#059669", fontSize: 14 }}>{status.success}</span>
          <button onClick={() => setStatus({ error: "", success: "" })} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#10b981" }}><X size={16} /></button>
        </div>
      )}

      {loading && <PageLoader title="Loading online orders" message="Fetching storefront orders and fulfillment data." />}

      {!loading && (
        <>
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <StatCard icon={ShoppingCart} label="Total Orders" value={stats.total} color="#6366f1" bg="#f5f3ff" />
            <StatCard icon={DollarSign} label="Revenue" value={formatMoney(stats.revenue)} color="#10b981" bg="#ecfdf5" />
            <StatCard icon={Clock} label="New Orders" value={stats.newCount} color="#3b82f6" bg="#eff6ff" />
            <StatCard icon={Truck} label="Accepted" value={stats.accepted} color="#f59e0b" bg="#fffbeb" />
            <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="#10b981" bg="#ecfdf5" />
            <StatCard icon={Ban} label="Cancelled" value={stats.cancelled} color="#ef4444" bg="#fef2f2" />
          </div>

          <div className="order-tabs">
            {TABS.map((tab) => {
              const count = tab.key ? rows.filter((r) => r.status === tab.key).length : rows.length;
              return (
                <button key={tab.key} className={`order-tab ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
                  {tab.label}
                  <span className="order-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="order-search-bar">
            <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input className="order-search-input" placeholder="Search by order number, customer name, phone, or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <input type="date" className="order-date-input" value={dateRange.start} onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))} />
            <input type="date" className="order-date-input" value={dateRange.end} onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))} />
            <button className="order-action-btn" onClick={() => { setSearch(""); setDateRange({ start: "", end: "" }); setActiveTab(""); }}><RotateCcw size={14} /> Clear</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: showDetail && selectedOrder ? "1fr 400px" : "1fr", gap: 20, alignItems: "start" }}>
            <div>
              {filteredRows.length === 0 ? (
                <div className="order-empty">
                  <div className="order-empty-icon"><Package size={32} style={{ color: "#94a3b8" }} /></div>
                  <h3>No orders found</h3>
                  <p>{search || activeTab || dateRange.start || dateRange.end ? "Try adjusting your filters." : "No online orders have been placed yet."}</p>
                </div>
              ) : (
                <table className="order-list-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((order) => (
                      <tr key={order.id} onClick={() => openDetail(order)} style={{ background: selectedOrder?.id === order.id ? "#f8fafc" : "transparent" }}>
                        <td><span className="order-number">{order.orderNumber}</span></td>
                        <td>
                          <div className="order-customer-cell">
                            <div className="order-customer-avatar">{(order.customerName || "C")[0].toUpperCase()}</div>
                            <div className="order-customer-info">
                              <div className="order-customer-name">{order.customerName}</div>
                              <div className="order-customer-contact">{order.customerPhone}{order.customerEmail ? ` | ${order.customerEmail}` : ""}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="order-items-preview">
                            {order.items?.length || 0} items
                            {order.items?.[0] && <div style={{ marginTop: 2 }}>{order.items[0].productName}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}</div>}
                          </div>
                        </td>
                        <td><span className="order-amount">{formatMoney(order.total)}</span></td>
                        <td><StatusBadge status={order.status} size="sm" /></td>
                        <td><PaymentBadge status={order.paymentStatus} /></td>
                        <td style={{ fontSize: 13, color: "#64748b" }}>{formatDate(order.createdAt)}</td>
                        <td>
                          <div className="order-actions-cell" onClick={(e) => e.stopPropagation()}>
                            <button className="order-action-btn" onClick={() => openDetail(order)} title="View Details"><Eye size={14} /></button>
                            {order.status === "NEW" && (
                              <button className="order-action-btn primary" disabled={statusLoading === order.id + "ACCEPTED"} onClick={() => updateStatus(order.id, "ACCEPTED")}>
                                {statusLoading === order.id + "ACCEPTED" ? "..." : "Accept"}
                              </button>
                            )}
                            {order.status === "ACCEPTED" && (
                              <button className="order-action-btn primary" disabled={statusLoading === order.id + "READY"} onClick={() => updateStatus(order.id, "READY")}>
                                {statusLoading === order.id + "READY" ? "..." : "Ready"}
                              </button>
                            )}
                            {order.status === "READY" && (
                              <button className="order-action-btn primary" disabled={statusLoading === order.id + "COMPLETED"} onClick={() => updateStatus(order.id, "COMPLETED")}>
                                {statusLoading === order.id + "COMPLETED" ? "..." : "Complete"}
                              </button>
                            )}
                            {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                              <button className="order-action-btn danger" onClick={() => setShowCancelModal(order)} title="Cancel"><Ban size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {showDetail && selectedOrder && (
              <div className="order-detail-panel">
                <div className="order-detail-header">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <h3>{selectedOrder.orderNumber}</h3>
                      <p>{formatDateTime(selectedOrder.createdAt)}</p>
                    </div>
                    <button onClick={() => { setShowDetail(false); setSelectedOrder(null); setDetail(null); }} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "white" }}><X size={16} /></button>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <StatusBadge status={selectedOrder.status} />
                    <PaymentBadge status={selectedOrder.paymentStatus} />
                  </div>
                </div>

                <div className="order-detail-section">
                  <h4>Customer Information</h4>
                  <div className="order-detail-row"><span className="label"><User size={14} style={{ marginRight: 6 }} />Name</span><span className="value">{detail?.customerName || selectedOrder.customerName}</span></div>
                  <div className="order-detail-row"><span className="label"><Phone size={14} style={{ marginRight: 6 }} />Phone</span><span className="value">{detail?.customerPhone || selectedOrder.customerPhone}</span></div>
                  {(detail?.customerEmail || selectedOrder.customerEmail) && (
                    <div className="order-detail-row"><span className="label"><Mail size={14} style={{ marginRight: 6 }} />Email</span><span className="value">{detail?.customerEmail || selectedOrder.customerEmail}</span></div>
                  )}
                  <div className="order-detail-row"><span className="label"><Truck size={14} style={{ marginRight: 6 }} />Fulfillment</span><span className="value">{selectedOrder.fulfillmentMethod}</span></div>
                  <div className="order-detail-row"><span className="label"><MapPin size={14} style={{ marginRight: 6 }} />Source</span><span className="value">{selectedOrder.source?.replace("_", " ")}</span></div>
                  {selectedOrder.note && <div style={{ marginTop: 8, padding: 10, background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#64748b" }}><MessageSquare size={12} style={{ marginRight: 4 }} /> {selectedOrder.note}</div>}
                </div>

                <div className="order-detail-section">
                  <h4>Order Items</h4>
                  {(detail?.items || selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="order-detail-item">
                      <div>
                        <div className="item-name">{item.productName}</div>
                        <div className="item-meta">Qty: {item.qty} × {formatMoney(item.unitPrice)}</div>
                      </div>
                      <div className="item-total">{formatMoney(item.lineTotal)}</div>
                    </div>
                  ))}
                  {(!detail?.items && !selectedOrder.items?.length) && <EmptyState title="No items" message="Loading..." />}
                </div>

                <div className="order-detail-section">
                  <h4>Order Summary</h4>
                  <div className="order-detail-row"><span className="label">Subtotal</span><span className="value">{formatMoney(selectedOrder.subtotal)}</span></div>
                  {Number(selectedOrder.discount || 0) > 0 && <div className="order-detail-row"><span className="label">Discount</span><span className="value" style={{ color: "#ef4444" }}>-{formatMoney(selectedOrder.discount)}</span></div>}
                  {Number(selectedOrder.tax || 0) > 0 && <div className="order-detail-row"><span className="label">Tax</span><span className="value">{formatMoney(selectedOrder.tax)}</span></div>}
                  <div className="order-detail-row" style={{ borderTop: "2px solid #e2e8f0", marginTop: 8, paddingTop: 12 }}><span className="label" style={{ fontWeight: 700, fontSize: 15 }}>Total</span><span className="value" style={{ fontSize: 18, color: "#6366f1" }}>{formatMoney(selectedOrder.total)}</span></div>
                  <div className="order-detail-row"><span className="label">Paid</span><span className="value" style={{ color: "#10b981" }}>{formatMoney(selectedOrder.paidAmount)}</span></div>
                  {Number(selectedOrder.total) - Number(selectedOrder.paidAmount || 0) > 0 && (
                    <div className="order-detail-row"><span className="label">Due</span><span className="value" style={{ color: "#ef4444" }}>{formatMoney(Number(selectedOrder.total) - Number(selectedOrder.paidAmount || 0))}</span></div>
                  )}
                  {selectedOrder.couponCode && <div className="order-detail-row"><span className="label">Coupon</span><span className="value">{selectedOrder.couponCode}</span></div>}
                </div>

                {detail?.logs?.length > 0 && (
                  <div className="order-detail-section">
                    <h4>Status History</h4>
                    <div className="order-timeline">
                      {detail.logs.map((log) => (
                        <div key={log.id} className="order-timeline-item">
                          <div className="order-timeline-dot" style={{ background: STATUS_FLOW[log.toStatus]?.color || "#6366f1" }} />
                          <div className="order-timeline-content">
                            <div className="order-timeline-status">{STATUS_FLOW[log.toStatus]?.label || log.toStatus}</div>
                            <div className="order-timeline-meta">{log.actorName || "System"} • {formatDateTime(log.createdAt)}{log.note ? ` • ${log.note}` : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="order-detail-actions">
                  {selectedOrder.status === "NEW" && (
                    <button className="order-action-btn primary" disabled={statusLoading === selectedOrder.id + "ACCEPTED"} onClick={() => updateStatus(selectedOrder.id, "ACCEPTED")}>
                      <CheckCircle2 size={14} /> Accept Order
                    </button>
                  )}
                  {selectedOrder.status === "ACCEPTED" && (
                    <button className="order-action-btn primary" disabled={statusLoading === selectedOrder.id + "READY"} onClick={() => updateStatus(selectedOrder.id, "READY")}>
                      <Truck size={14} /> Mark Ready
                    </button>
                  )}
                  {selectedOrder.status === "READY" && (
                    <button className="order-action-btn primary" disabled={statusLoading === selectedOrder.id + "COMPLETED"} onClick={() => updateStatus(selectedOrder.id, "COMPLETED")}>
                      <CheckCircle2 size={14} /> Complete
                    </button>
                  )}
                  {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "COMPLETED" && (
                    <button className="order-action-btn danger" onClick={() => setShowCancelModal(selectedOrder)}>
                      <Ban size={14} /> Cancel
                    </button>
                  )}
                  {selectedOrder.status !== "CANCELLED" && (
                    <button className="order-action-btn success" disabled={statusLoading === selectedOrder.id + "INVOICE"} onClick={() => convertToInvoice(selectedOrder.id)}>
                      <FileText size={14} /> Convert to Invoice
                    </button>
                  )}
                  <button className="order-action-btn" onClick={() => window.print()}><Printer size={14} /> Print</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showCancelModal && (
        <div className="order-cancel-overlay" onClick={() => setShowCancelModal(null)}>
          <div className="order-cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Order {showCancelModal.orderNumber}</h3>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 12px" }}>Provide a reason for cancellation. This action cannot be undone.</p>
            <textarea className="order-cancel-textarea" placeholder="Reason for cancellation..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            <div className="order-cancel-actions">
              <button className="order-action-btn" onClick={() => { setShowCancelModal(null); setCancelReason(""); }}>Keep Order</button>
              <button className="order-action-btn danger" disabled={statusLoading === showCancelModal.id + "CANCEL"} onClick={() => cancelOrder(showCancelModal.id)}>
                {statusLoading === showCancelModal.id + "CANCEL" ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
