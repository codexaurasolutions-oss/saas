import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

export default function WebsiteAnalyticsPage() {
  const { salon } = useOutletContext();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, categories: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salon?.slug) return;
    Promise.all([
      api.get("/owner/ecommerce/orders").catch(() => ({ data: [] })),
      api.get("/owner/inventory/products").catch(() => ({ data: [] })),
      api.get("/owner/inventory/categories").catch(() => ({ data: [] }))
    ]).then(([ordersRes, prodRes, catRes]) => {
      const orders = ordersRes.data || [];
      const products = prodRes.data || [];
      const categories = catRes.data || [];
      const revenue = orders.filter(o => o.paymentStatus === "PAID").reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      setStats({ orders: orders.length, revenue, products: products.length, categories: categories.length });
      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [salon?.slug]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading analytics...</div>;

  const cards = [
    { label: "Total Orders", value: stats.orders, color: "#2563eb" },
    { label: "Revenue", value: `${salon.currency || "INR"} ${stats.revenue.toFixed(2)}`, color: "#16a34a" },
    { label: "Products Listed", value: stats.products, color: "#9333ea" },
    { label: "Categories", value: stats.categories, color: "#ea580c" }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#0f172a" }}>Website Analytics</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 600, color: "#0f172a" }}>Recent Orders</div>
        {recentOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No orders yet</div>
        ) : recentOrders.map(order => (
          <div key={order.id} style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{order.orderNumber || order.id.slice(0, 8)}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{order.customerName || "Guest"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{salon.currency || "INR"} {Number(order.total || 0).toFixed(2)}</div>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: order.status === "COMPLETED" ? "#dcfce7" : order.status === "CANCELLED" ? "#fee2e2" : "#fef3c7", color: order.status === "COMPLETED" ? "#166534" : order.status === "CANCELLED" ? "#991b1b" : "#92400e" }}>{order.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
