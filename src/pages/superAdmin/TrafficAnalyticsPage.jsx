import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { BarChart3, Users, Eye, TrendingUp, Globe, ArrowUpRight } from "lucide-react";

export default function TrafficAnalyticsPage() {
  const [data, setData] = useState(null);
  const [salons, setSalons] = useState([]);
  const [period, setPeriod] = useState("7d");
  const [salonFilter, setSalonFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [trafficRes, salonRes] = await Promise.all([
        api.get("/super-admin/traffic-analytics", { params: { period, salonId: salonFilter } }),
        api.get("/super-admin/salons")
      ]);
      setData(trafficRes.data);
      setSalons(salonRes.data);
    } catch (err) {
      setError(formatApiError(err, "Could not load traffic analytics."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period, salonFilter]);

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  const statCards = data ? [
    { label: "Total Visits", value: fmt(data.summary.totalVisits), icon: Eye, color: "#3b82f6", bg: "#eff6ff" },
    { label: "Unique Visitors", value: fmt(data.summary.uniqueVisitors), icon: Users, color: "#8b5cf6", bg: "#f5f3ff" },
    { label: "Today", value: fmt(data.summary.todayVisits), icon: TrendingUp, color: "#10b981", bg: "#ecfdf5" },
    { label: "Yesterday", value: fmt(data.summary.yesterdayVisits), icon: BarChart3, color: "#f59e0b", bg: "#fffbeb" }
  ] : [];

  const maxDayCount = data ? Math.max(1, ...data.visitsByDay.map((d) => d.count)) : 1;

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Traffic Analytics</h1>
            <p style={{ marginBottom: 0 }}>Monitor visitor traffic across all salon storefronts.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ minHeight: 38, padding: "6px 12px", borderRadius: 8, fontSize: 13 }}>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <select value={salonFilter} onChange={(e) => setSalonFilter(e.target.value)} style={{ minHeight: 38, padding: "6px 12px", borderRadius: 8, fontSize: 13, minWidth: 160 }}>
              <option value="">All Salons</option>
              {salons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</p>}

      {loading ? (
        <PageLoader title="Loading traffic data" message="Fetching visitor analytics..." />
      ) : data ? (
        <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={20} color={card.color} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>{card.value}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, marginTop: 4 }}>{card.label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Chart: Visits by Day */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "1rem", fontWeight: 700 }}>Visits Over Time</h3>
              {data.visitsByDay.length ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 180 }}>
                  {data.visitsByDay.map((day) => (
                    <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{day.count}</span>
                      <div style={{ width: "100%", height: `${Math.max(4, (day.count / maxDayCount) * 140)}px`, background: "linear-gradient(180deg, #6366f1, #818cf8)", borderRadius: 4, transition: "height 0.3s" }} />
                      <span style={{ fontSize: 9, color: "#94a3b8" }}>{day.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No data" message="No visits in this period." />
              )}
            </div>

            {/* Top Pages */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700 }}>Top Salons by Traffic</h3>
              {data.topPages.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.topPages.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{item.salon.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{item.salon.slug}</div>
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6366f1" }}>{fmt(item.visits)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No data" message="No salon traffic yet." />
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Top Paths */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700 }}>Most Visited Pages</h3>
              {data.topPaths.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.topPaths.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Globe size={14} color="#94a3b8" />
                        <span style={{ fontSize: "0.85rem", color: "#334155", fontFamily: "monospace" }}>{item.path}</span>
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>{fmt(item.count)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No data" message="No page visits recorded." />
              )}
            </div>

            {/* Top Referrers */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700 }}>Top Referrers</h3>
              {data.topReferrers.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.topReferrers.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ArrowUpRight size={14} color="#94a3b8" />
                        <span style={{ fontSize: "0.8rem", color: "#334155", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.referrer}</span>
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>{fmt(item.count)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No data" message="No referrer data yet." />
              )}
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="No traffic data" message="Data will appear once storefronts start receiving visitors." />
      )}
    </div>
  );
}
