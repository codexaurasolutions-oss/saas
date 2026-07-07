import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

export default function WebsiteAnalyticsPage() {
  const { salon } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    if (!salon?.slug) return;
    Promise.all([
      api.get("/owner/orders").catch(() => ({ data: [] })),
      api.get("/owner/orders/reports/summary").catch(() => ({ data: {} })),
      api.get("/owner/inventory/products").catch(() => ({ data: [] })),
      api.get("/owner/inventory/categories").catch(() => ({ data: [] })),
      api.get("/owner/ecommerce/settings").catch(() => ({ data: {} }))
    ]).then(([ordersRes, summaryRes, prodRes, catRes, storeRes]) => {
      const allOrders = ordersRes.data || [];
      setOrders(allOrders);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setStats({
        ...summaryRes.data,
        storeEnabled: storeRes.data?.storeEnabled || false,
        totalProducts: prodRes.data?.length || 0,
        visibleProducts: (prodRes.data || []).filter(p => p.isOnlineVisible).length,
        totalCategories: catRes.data?.length || 0,
        avgOrderValue: summaryRes.data?.totalSales && summaryRes.data?.totalOrders
          ? summaryRes.data.totalSales / summaryRes.data.totalOrders : 0
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [salon?.slug]);

  const currency = salon.currency || "INR";

  const getFilteredOrders = () => {
    const now = new Date();
    return orders.filter(o => {
      if (period === "today") {
        const d = new Date(o.createdAt);
        return d.toDateString() === now.toDateString();
      }
      if (period === "week") {
        const d = new Date(o.createdAt);
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo;
      }
      if (period === "month") {
        const d = new Date(o.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filtered = getFilteredOrders();
  const filteredRevenue = filtered.filter(o => o.status !== "CANCELLED").reduce((s, o) => s + Number(o.total || 0), 0);
  const cancelledCount = filtered.filter(o => o.status === "CANCELLED").length;

  const statusBreakdown = {
    NEW: filtered.filter(o => o.status === "NEW").length,
    ACCEPTED: filtered.filter(o => o.status === "ACCEPTED").length,
    READY: filtered.filter(o => o.status === "READY").length,
    COMPLETED: filtered.filter(o => o.status === "COMPLETED").length,
    CANCELLED: cancelledCount,
  };

  const topProducts = {};
  filtered.forEach(o => {
    (o.items || []).forEach(item => {
      const name = item.product?.name || item.name || "Unknown";
      if (!topProducts[name]) topProducts[name] = { name, qty: 0, revenue: 0 };
      topProducts[name].qty += item.qty || 1;
      topProducts[name].revenue += Number(item.price || 0) * (item.qty || 1);
    });
  });
  const topProductsList = Object.values(topProducts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const recentOrders = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading website analytics...</div>;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Website Analytics</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>{salon.name} e-commerce dashboard</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["today", "week", "month", "all"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: period === p ? "#6366f1" : "#fff", color: period === p ? "#fff" : "#64748b",
              fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize"
            }}>{p === "all" ? "All Time" : p}</button>
          ))}
        </div>
      </div>

      {/* Store Status */}
      {!stats?.storeEnabled && (
        <div style={{ background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 12, padding: 16, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, color: "#92400e" }}>E-commerce is disabled</div>
            <div style={{ fontSize: 13, color: "#a16207" }}>Enable your online store in E-commerce Settings to start receiving orders.</div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Orders", value: stats?.totalOrders || 0, color: "#6366f1", bg: "#eef2ff" },
          { label: "Revenue", value: `${currency} ${(stats?.totalSales || 0).toFixed(0)}`, color: "#10b981", bg: "#ecfdf5" },
          { label: "Avg Order Value", value: `${currency} ${(stats?.avgOrderValue || 0).toFixed(0)}`, color: "#f59e0b", bg: "#fffbeb" },
          { label: "New Orders", value: statusBreakdown.NEW, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Completed", value: statusBreakdown.COMPLETED, color: "#10b981", bg: "#ecfdf5" },
          { label: "Cancelled", value: statusBreakdown.CANCELLED, color: "#ef4444", bg: "#fef2f2" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", borderLeft: `4px solid ${c.color}` }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px" }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Order Status Breakdown */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: "0 0 20px" }}>Order Status Breakdown</h3>
          {Object.entries(statusBreakdown).map(([status, count]) => {
            const colors = { NEW: "#3b82f6", ACCEPTED: "#f59e0b", READY: "#8b5cf6", COMPLETED: "#10b981", CANCELLED: "#ef4444" };
            const pct = filtered.length > 0 ? (count / filtered.length * 100) : 0;
            return (
              <div key={status} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, color: "#334155" }}>{status}</span>
                  <span style={{ color: "#64748b" }}>{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: colors[status], borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Products */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: "0 0 20px" }}>Top Selling Products</h3>
          {topProductsList.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14 }}>No product sales yet.</p>
          ) : topProductsList.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < topProductsList.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#6366f1" }}>#{i + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{currency} {p.revenue.toFixed(0)}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{p.qty} sold</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storefront Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 32 }}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{stats?.totalProducts || 0}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Total Products</div>
          <div style={{ fontSize: 12, color: "#10b981", marginTop: 4 }}>{stats?.visibleProducts || 0} visible on store</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{stats?.totalCategories || 0}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Categories</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>{currency} {(stats?.totalSales || 0).toFixed(0)}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Total Revenue</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{stats?.totalOrders || 0} orders fulfilled</div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: 0 }}>Recent Orders</h3>
          <span style={{ fontSize: 13, color: "#64748b" }}>{filtered.length} total</span>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No orders yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Order</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Customer</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Items</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Total</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Payment</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => {
                const statusColors = { NEW: "#3b82f6", ACCEPTED: "#f59e0b", READY: "#8b5cf6", COMPLETED: "#10b981", CANCELLED: "#ef4444" };
                const statusBg = { NEW: "#eff6ff", ACCEPTED: "#fffbeb", READY: "#f5f3ff", COMPLETED: "#ecfdf5", CANCELLED: "#fef2f2" };
                const payColors = { PENDING: "#f59e0b", PAID: "#10b981", FAILED: "#ef4444" };
                return (
                  <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#6366f1" }}>{order.orderNumber || order.id.slice(0, 8)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14 }}>{order.customerName || "Guest"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#64748b" }}>{order.items?.length || 0} items</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, textAlign: "right" }}>{currency} {Number(order.total || 0).toFixed(2)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: statusBg[order.status] || "#f1f5f9", color: statusColors[order.status] || "#64748b" }}>{order.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: order.paymentStatus === "PAID" ? "#ecfdf5" : "#fffbeb", color: payColors[order.paymentStatus] || "#64748b" }}>{order.paymentStatus || "PENDING"}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b", textAlign: "right" }}>{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
