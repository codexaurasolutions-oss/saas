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
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Period</span>
            <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 4, borderRadius: 10, border: "1px solid #e2e8f0" }}>
              {[
                { value: "today", label: "Today" },
                { value: "month", label: "This Month" },
                { value: "year", label: "This Year" }
              ].map((opt) => {
                const isActive = period === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriod(opt.value)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: isActive ? "white" : "transparent",
                      color: isActive ? "#4f46e5" : "#64748b",
                      fontWeight: isActive ? 700 : 600,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.15s"
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
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
        <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Revenue</h3>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4f46e5", background: "#f5f3ff", padding: "4px 10px", borderRadius: 100 }}>SaaS Health</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "20px 24px", border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Monthly Recurring Revenue (MRR)</span>
              <div style={{ fontSize: "2rem", fontWeight: 850, color: "#0f172a", marginTop: 8 }}>₹{fmt(data.monthlySubscriptionRevenue)}</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "20px 24px", border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Total Collected Revenue</span>
              <div style={{ fontSize: "2rem", fontWeight: 850, color: "#0f172a", marginTop: 8 }}>₹{fmt(data.totalSubscriptionRevenue)}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", background: "#f1f5f9", padding: "6px 12px", borderRadius: 8 }}>Plans: {data.plansCount || 0}</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", background: "#f1f5f9", padding: "6px 12px", borderRadius: 8 }}>Expired: {data.expiredSalons || 0}</span>
          </div>
        </div>

        <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Active Plans</h3>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981", background: "#ecfdf5", padding: "4px 10px", borderRadius: 100 }}>{plans.length} Live</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {plans.length ? plans.map((plan) => (
              <div key={plan.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{plan.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>{plan.isCustom ? "Custom Tier" : "Standard Tier"}</div>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#4f46e5" }}>₹{fmt(plan.monthlyPrice)}<span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748b" }}>/mo</span></div>
              </div>
            )) : <EmptyState title="No active plans" message="Create plans to see them here." />}
          </div>
        </div>
      </div>

      <div className="two-col" style={{ marginTop: 20 }}>
        <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Recent Salons</h3>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0d9488", background: "#f0fdfa", padding: "4px 10px", borderRadius: 100 }}>Newest</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {salons.length ? salons.map((salon) => (
              <div key={salon.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>
                    {(salon.name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{salon.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>{salon.slug}</div>
                  </div>
                </div>
                <div>
                  <span style={{ 
                    fontSize: "0.7rem", 
                    fontWeight: 700, 
                    color: salon.status === "ACTIVE" ? "#10b981" : "#ef4444", 
                    background: salon.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", 
                    padding: "4px 10px", 
                    borderRadius: 100,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    {salon.status}
                  </span>
                </div>
              </div>
            )) : <EmptyState title="No recent salons" message="New signups appear here." />}
          </div>
        </div>

        <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Recent Payments</h3>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#06b6d4", background: "#ecfeff", padding: "4px 10px", borderRadius: 100 }}>Collections</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {payments.length ? payments.map((payment) => (
              <div key={payment.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 8, 
                    background: (payment.mode || "Payment").toUpperCase() === "CASH" ? "#fef3c7" : "#dbeafe", 
                    color: (payment.mode || "Payment").toUpperCase() === "CASH" ? "#d97706" : "#2563eb", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontWeight: 800, 
                    fontSize: "0.7rem",
                    textTransform: "uppercase"
                  }}>
                    {(payment.mode || "Pay").substring(0, 3)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{payment.mode || "Payment Method"}</div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>Successful Transaction</div>
                  </div>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 850, color: "#10b981" }}>+ ₹{fmt(payment.amount)}</div>
              </div>
            )) : <EmptyState title="No recent payments" message="Payment entries appear here." />}
          </div>
        </div>
      </div>
    </div>
  );
}
