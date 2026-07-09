import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { Building2, CheckCircle, Clock, AlertTriangle, Sparkles, LifeBuoy } from "lucide-react";

const fmt = (val) => Number(val || 0).toLocaleString("en-IN");

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("month");

  const fetchDashboard = () => {
    setError("");
    api.get("/super-admin/dashboard", { params: { period } })
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Could not load dashboard."));
  };

  useEffect(() => { fetchDashboard(); }, [period]);

  const healthCards = useMemo(() => [
    { label: "Total Salons", value: data?.totalSalons || 0, caption: "All tenants", icon: Building2, color: "#4f46e5", bg: "#f5f3ff" },
    { label: "Active Salons", value: data?.activeSalons || 0, caption: "Operational", icon: CheckCircle, color: "#10b981", bg: "#ecfdf5" },
    { label: "Trial Salons", value: data?.trialSalons || 0, caption: "In trial", icon: Clock, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Suspended", value: data?.suspendedSalons || 0, caption: "Needs follow-up", icon: AlertTriangle, color: "#ef4444", bg: "#fef2f2" },
    { label: "Demo Leads", value: data?.demoLeadsCount || 0, caption: "Pipeline", icon: Sparkles, color: "#06b6d4", bg: "#ecfeff" },
    { label: "Support Queue", value: data?.supportTicketsCount || 0, caption: "Open tickets", icon: LifeBuoy, color: "#ec4899", bg: "#fdf2f8" }
  ], [data]);

  if (error) {
    return (
      <div className="page-shell">
        <div className="panel-card" style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
          <h2 style={{ color: "#dc2626" }}>Dashboard Error</h2>
          <p style={{ color: "#64748b" }}>{error}</p>
          <button type="button" onClick={fetchDashboard} style={{ marginTop: 16 }}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="page-shell"><PageLoader title="Loading dashboard" message="Fetching stats..." /></div>;

  const plans = data.activePlansSummary || [];
  const salons = data.recentSalons || [];
  const payments = data.recentPayments || [];

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Super Admin Dashboard</h1>
            <p style={{ marginBottom: 0 }}>Live SaaS overview for salons, subscriptions, leads, and support.</p>
          </div>
          <div style={{ minWidth: 220 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Period</span>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ minHeight: 38, padding: "6px 12px", borderRadius: 8 }}>
                <option value="today">Today</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </label>
          </div>
        </div>
        <div className="inline-actions" style={{ marginTop: 16 }}>
          <Link to="/super-admin/salons" className="cta-secondary">Add Salon</Link>
          <Link to="/super-admin/plans" className="cta-secondary">Create Plan</Link>
          <Link to="/super-admin/demo-leads" className="cta-secondary">Demo Leads</Link>
          <Link to="/super-admin/support-tickets" className="cta-secondary">Support Queue</Link>
        </div>
      </div>

      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginBottom: 32 }}>
        {healthCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card" style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.02)", position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="item-meta" style={{ color: "#64748b", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: card.bg, color: card.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} />
                </div>
              </div>
              <div>
                <div className="stat-value" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{card.value}</div>
                <div className="item-meta" style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 4 }}>{card.caption}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="two-col">
        <div className="panel-card dashboard-section">
          <div className="section-heading">
            <h3>Revenue</h3>
            <span className="badge">SaaS Health</span>
          </div>
          <div className="section-grid">
            <div className="summary-box">
              <strong>Monthly Revenue</strong>
              <div className="stat-value" style={{ fontSize: "1.8rem", marginTop: 8 }}>INR {fmt(data.monthlySubscriptionRevenue)}</div>
            </div>
            <div className="summary-box">
              <strong>Total Revenue</strong>
              <div className="stat-value" style={{ fontSize: "1.8rem", marginTop: 8 }}>INR {fmt(data.totalSubscriptionRevenue)}</div>
            </div>
          </div>
          <div className="badge-row" style={{ marginTop: 16 }}>
            <span className="badge">Plans {data.plansCount || 0}</span>
            <span className="badge">Support {data.supportTicketsCount || 0}</span>
            <span className="badge">Expired {data.expiredSalons || 0}</span>
          </div>
        </div>
        <div className="panel-card dashboard-section">
          <div className="section-heading">
            <h3>Active Plans</h3>
            <span className="badge">{plans.length} live</span>
          </div>
          {plans.length ? plans.map((plan) => (
            <div key={plan.id} className="list-item">
              <div>
                <strong>{plan.name}</strong>
                <div className="item-meta">INR {fmt(plan.monthlyPrice)}/mo</div>
              </div>
            </div>
          )) : <EmptyState title="No active plans" message="Create plans to see them here." />}
        </div>
      </div>

      <div className="two-col" style={{ marginTop: 20 }}>
        <div className="panel-card dashboard-section">
          <div className="section-heading">
            <h3>Recent Salons</h3>
            <span className="badge">Newest</span>
          </div>
          {salons.length ? salons.map((salon) => (
            <div key={salon.id} className="list-item">
              <div>
                <strong>{salon.name}</strong>
                <div className="item-meta">{salon.status} &bull; {salon.slug}</div>
              </div>
            </div>
          )) : <EmptyState title="No recent salons" message="New signups appear here." />}
        </div>
        <div className="panel-card dashboard-section">
          <div className="section-heading">
            <h3>Recent Payments</h3>
            <span className="badge">Collections</span>
          </div>
          {payments.length ? payments.map((payment) => (
            <div key={payment.id} className="list-item">
              <div>
                <strong>{payment.mode || "Payment"}</strong>
                <div className="item-meta">INR {fmt(payment.amount)}</div>
              </div>
            </div>
          )) : <EmptyState title="No recent payments" message="Payment entries appear here." />}
        </div>
      </div>
    </div>
  );
}
