import { useEffect, useMemo, useState, useRef } from "react";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { formatApiError } from "../../utils/apiError";

export default function AuditLogsPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [status, setStatus] = useState({ loading: true, error: "" });
  const debounceRef = useRef(null);

  const typeOptions = useMemo(() => [...new Set(rows.map((r) => r.type).filter(Boolean))], [rows]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    let active = true;
    setStatus((s) => ({ ...s, loading: true }));
    api.get("/super-admin/audit-logs", {
      params: { ...(debouncedQuery ? { q: debouncedQuery } : {}), ...(typeFilter ? { type: typeFilter } : {}) }
    }).then((res) => {
      if (!active) return;
      setRows(res.data || []);
      setStatus({ loading: false, error: "" });
    }).catch((err) => {
      if (!active) return;
      setRows([]);
      setStatus({ loading: false, error: formatApiError(err, "Could not load audit logs") });
    });
    return () => { active = false; };
  }, [debouncedQuery, typeFilter]);

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Audit Logs</h1>
            <p style={{ marginBottom: 0 }}>Platform-wide governance events and recent SaaS changes.</p>
          </div>
          <div className="badge-row">
            <span className="badge">Entries: {rows.length}</span>
          </div>
        </div>
      </div>

      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <label>
            <span className="muted">Search logs</span>
            <input value={query} placeholder="Search action, type, or metadata..." onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label>
            <span className="muted">Type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <button type="button" className="secondary-button" onClick={() => { setQuery(""); setTypeFilter(""); }}>Reset</button>
        </div>
      </div>

      {status.error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{status.error}</p>}

      {status.loading ? (
        <PageLoader compact title="Loading audit logs" message="Fetching events..." />
      ) : rows.length ? (
        <div className="panel-card">
          <div className="list-stack">
            {rows.map((row) => (
              <div key={row.id} className="list-item">
                <div className="item-head">
                  <div>
                    <strong>{row.type}</strong>
                    <div className="item-meta">{row.action}</div>
                  </div>
                  <span className="badge">{new Date(row.createdAt).toLocaleString()}</span>
                </div>
                {row.meta && Object.keys(row.meta).length > 0 ? (
                  <div style={{ marginTop: 8, padding: "10px 12px", background: "#f5f5f4", borderRadius: 8, fontFamily: "monospace", fontSize: 12, display: "grid", gap: 4 }}>
                    {Object.entries(row.meta).map(([key, val]) => (
                      <div key={key} style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontWeight: "bold", color: "#64748b" }}>{key}:</span>
                        <span>{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>No metadata</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="No audit logs" message="Try widening the search or resetting filters." />
      )}
    </div>
  );
}
