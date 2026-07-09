import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { MessageSquare, Calendar, User, Tag, AlertCircle, Filter, RefreshCw, FileText, CheckCircle2, Bookmark } from "lucide-react";

export default function SuperAdminSupportTicketsPage() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ q: "", status: "", priority: "" });
  const [savingId, setSavingId] = useState("");
  const [notes, setNotes] = useState({});
  const [assignedAgents, setAssignedAgents] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyAttachments, setReplyAttachments] = useState({});
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    const response = await api.get("/super-admin/support-tickets", {
      params: {
        ...(nextFilters.q ? { q: nextFilters.q } : {}),
        ...(nextFilters.status ? { status: nextFilters.status } : {}),
        ...(nextFilters.priority ? { priority: nextFilters.priority } : {})
      }
    });
    setRows(response.data);
    setNotes(Object.fromEntries(response.data.map((row) => [row.id, row.internalNote || ""])));
    setAssignedAgents(Object.fromEntries(response.data.map((row) => [row.id, row.assignedAgentName || ""])));
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    setStatus({ error: "", success: "" });
    api.get("/super-admin/support-tickets", {
      params: {
        ...(filters.q ? { q: filters.q } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {})
      }
    }).then((response) => {
      if (!active) return;
      setRows(response.data);
      setNotes(Object.fromEntries(response.data.map((row) => [row.id, row.internalNote || ""])));
      setAssignedAgents(Object.fromEntries(response.data.map((row) => [row.id, row.assignedAgentName || ""])));
      setLoading(false);
    }).catch((err) => {
      if (!active) return;
      setStatus({ error: formatApiError(err, "Could not load support tickets."), success: "" });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [filters]);

  const updateTicket = async (ticketId, data) => {
    setSavingId(ticketId);
    setStatus({ error: "", success: "" });
    try {
      await api.patch(`/super-admin/support-tickets/${ticketId}`, data);
      await load();
      setStatus({ error: "", success: "Ticket updated." });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not update ticket"), success: "" });
    }
    setSavingId("");
  };

  const sendReply = async (ticketId, nextStatus = "PENDING") => {
    setSavingId(ticketId);
    setStatus({ error: "", success: "" });
    try {
      await api.post(`/super-admin/support-tickets/${ticketId}/messages`, {
        message: replyDrafts[ticketId] || "",
        attachmentUrl: replyAttachments[ticketId] || "",
        status: nextStatus
      });
      setReplyDrafts((current) => ({ ...current, [ticketId]: "" }));
      setReplyAttachments((current) => ({ ...current, [ticketId]: "" }));
      await load();
      setStatus({ error: "", success: "Support reply sent." });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not send reply"), success: "" });
    }
    setSavingId("");
  };

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Support Tickets</h1>
            <p style={{ marginBottom: 0 }}>Manage platform support queue, internal notes, replies, and resolution progress from one inbox.</p>
          </div>
          <div className="badge-row">
            <span className="badge" style={{ background: "#eff6ff", color: "#1e40af", fontWeight: 700 }}>Queue: {rows.length}</span>
            <span className="badge" style={{ background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>Open: {rows.filter((row) => row.status === "OPEN").length}</span>
          </div>
        </div>
      </div>

      <div className="panel-card" style={{ marginBottom: 24, padding: "20px 24px", background: "white", border: "1px solid #e2e8f0", borderRadius: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto auto", gap: 12, alignItems: "end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Search Keyword</span>
            <input value={filters.q} placeholder="Search title, description, category, or salon..." onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} style={{ width: "100%", minHeight: 40, padding: "8px 14px", borderRadius: 10, fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Status</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} style={{ width: "100%", minHeight: 40, padding: "8px 12px", borderRadius: 10, fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc" }}>
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Priority</span>
            <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))} style={{ width: "100%", minHeight: 40, padding: "8px 12px", borderRadius: 10, fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc" }}>
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </label>
          <button type="button" onClick={() => load(filters)} style={{ minHeight: 40, padding: "0 18px", borderRadius: 10, background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(79, 70, 229, 0.15)" }}>Apply Filters</button>
          <button type="button" onClick={() => setFilters({ q: "", status: "", priority: "" })} style={{ minHeight: 40, padding: "0 18px", borderRadius: 10, background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>Reset</button>
        </div>
      </div>

      {status.error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{status.error}</p>}
      {status.success && <p style={{ color: "#10b981", fontSize: 13, marginBottom: 16 }}>{status.success}</p>}

      <div>
        {loading ? (
          <PageLoader
            title="Loading support queue"
            message="Pulling ticket status, internal notes, conversations, and recent events."
          />
        ) : rows.length ? rows.map((row) => {
          const isClosed = row.status === "CLOSED";
          
          // Status styling definitions
          const statBg = row.status === "OPEN" ? "#fef2f2" : row.status === "PENDING" ? "#fffbeb" : row.status === "RESOLVED" ? "#ecfdf5" : "#f1f5f9";
          const statColor = row.status === "OPEN" ? "#ef4444" : row.status === "PENDING" ? "#f59e0b" : row.status === "RESOLVED" ? "#10b981" : "#475569";
          
          // Priority styling definitions
          const prioBg = row.priority === "URGENT" ? "#fff1f2" : row.priority === "HIGH" ? "#fff7ed" : row.priority === "MEDIUM" ? "#eff6ff" : "#f8fafc";
          const prioColor = row.priority === "URGENT" ? "#e11d48" : row.priority === "HIGH" ? "#ea580c" : row.priority === "MEDIUM" ? "#2563eb" : "#64748b";

          return (
            <div key={row.id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, marginBottom: 24, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.01)" }}>
              {/* Header Title Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{row.title}</h3>
                    <span className="badge" style={{ background: prioBg, color: prioColor, fontWeight: 800, fontSize: "0.7rem", padding: "2px 8px" }}>{row.priority}</span>
                    <span className="badge" style={{ background: statBg, color: statColor, fontWeight: 800, fontSize: "0.7rem", padding: "2px 8px" }}>{row.status}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.8rem", color: "#64748b" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Landmark size={14} /> {row.salon?.name || "Global / System"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Tag size={14} /> {row.category || "General"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "#94a3b8" }}>
                  <Calendar size={14} />
                  <span>Updated: {new Date(row.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Description Body */}
              <div style={{ background: "#f8fafc", borderLeft: "4px solid #6366f1", padding: "16px 20px", borderRadius: "0 12px 12px 0", fontSize: "0.92rem", color: "#334155", lineHeight: 1.6, marginBottom: 20 }}>
                {row.description}
              </div>

              {/* Internal Notes & Agent Assignment */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Internal Support Notes (Hidden from Salon)</span>
                  <textarea
                    rows="2"
                    value={notes[row.id] || ""}
                    onChange={(event) => setNotes({ ...notes, [row.id]: event.target.value })}
                    placeholder="Type internal staff notes here..."
                    disabled={isClosed}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, fontSize: 13, background: "#f8fafc", width: "100%", resize: "none" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Assigned Support Agent</span>
                  <input
                    value={assignedAgents[row.id] || ""}
                    onChange={(event) => setAssignedAgents({ ...assignedAgents, [row.id]: event.target.value })}
                    placeholder="Enter agent name..."
                    disabled={isClosed}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 14px", fontSize: 13, background: "#f8fafc", width: "100%" }}
                  />
                </div>
              </div>

              {/* Chat Thread Messages */}
              {(row.messages && row.messages.length > 0) && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginBottom: 20 }}>
                  <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Conversation Thread</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 280, overflowY: "auto", paddingRight: 6 }}>
                    {row.messages.map((message) => {
                      const isAgent = message.authorType === "SUPPORT" || message.authorType === "SYSTEM";
                      return (
                        <div key={message.id} style={{ display: "flex", flexDirection: "column", alignSelf: isAgent ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#94a3b8", marginBottom: 3, padding: "0 6px" }}>
                            <strong>{message.authorName}</strong>
                            <span>{new Date(message.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ 
                            background: isAgent ? "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" : "#f1f5f9", 
                            color: isAgent ? "white" : "#0f172a",
                            borderRadius: isAgent ? "14px 14px 0 14px" : "14px 14px 14px 0",
                            padding: "10px 16px",
                            fontSize: "0.85rem",
                            lineHeight: 1.4
                          }}>
                            {message.message}
                            {message.attachmentUrl && (
                              <div style={{ marginTop: 8, fontSize: "0.75rem", borderTop: "1px dashed rgba(255,255,255,0.2)", paddingTop: 6 }}>
                                🔗 <a href={message.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: isAgent ? "white" : "#3b82f6", textDecoration: "underline" }}>Attachment Reference</a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Event Timeline Logs */}
              {(row.events && row.events.length > 0) && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginBottom: 20 }}>
                  <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#64748b", marginBottom: 10 }}>Ticket Activity Audit Log</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 12, borderLeft: "2px solid #e2e8f0" }}>
                    {row.events.map((event) => (
                      <div key={event.id} style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#cbd5e1" }} />
                        <strong style={{ color: "#475569" }}>{event.eventType}</strong>
                        <span>by {event.actorName}</span>
                        <span style={{ color: "#94a3b8" }}>&bull; {new Date(event.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, borderTop: "1px solid #f1f5f9", paddingTop: 16, marginTop: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {!isClosed ? (
                    <>
                      <button type="button" onClick={() => updateTicket(row.id, { status: "PENDING", internalNote: notes[row.id] || "", assignedAgentName: assignedAgents[row.id] || null })} style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fef3c7", padding: "8px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.8rem" }}>Mark Pending</button>
                      <button type="button" onClick={() => updateTicket(row.id, { status: "RESOLVED", internalNote: notes[row.id] || "", assignedAgentName: assignedAgents[row.id] || null })} style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #d1fae5", padding: "8px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.8rem" }}>Resolve Ticket</button>
                      <button type="button" onClick={() => updateTicket(row.id, { status: "CLOSED", internalNote: notes[row.id] || "", assignedAgentName: assignedAgents[row.id] || null })} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fee2e2", padding: "8px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.8rem" }}>Close Ticket</button>
                      <button type="button" onClick={() => updateTicket(row.id, { internalNote: notes[row.id] || "", assignedAgentName: assignedAgents[row.id] || null })} style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "8px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.8rem" }}>Save Staff Note</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => updateTicket(row.id, { status: "OPEN" })} style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", padding: "8px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.8rem" }}>Reopen Ticket</button>
                  )}
                  {savingId === row.id && <span style={{ fontSize: "0.8rem", color: "#64748b", alignSelf: "center" }}>Updating...</span>}
                </div>
              </div>

              {/* Reply Compose Box */}
              {!isClosed && (
                <div style={{ marginTop: 20, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                  <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Compose Reply to Salon</span>
                  <textarea
                    rows="3"
                    value={replyDrafts[row.id] || ""}
                    placeholder="Type your response to the salon owner..."
                    onChange={(event) => setReplyDrafts((current) => ({ ...current, [row.id]: event.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, fontSize: 13, background: "#f8fafc", width: "100%", resize: "none" }}
                  />
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
                    <input
                      value={replyAttachments[row.id] || ""}
                      placeholder="Optional Attachment URL (screenshot/document)..."
                      onChange={(event) => setReplyAttachments((current) => ({ ...current, [row.id]: event.target.value }))}
                      style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "8px 12px", fontSize: 12, background: "#f8fafc", flex: 1 }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" onClick={() => sendReply(row.id, "PENDING")} style={{ background: "#4f46e5", color: "white", border: "none", padding: "10px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.8rem" }}>Reply & Keep Pending</button>
                      <button type="button" onClick={() => sendReply(row.id, "RESOLVED")} style={{ background: "#10b981", color: "white", border: "none", padding: "10px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.8rem" }}>Reply & Resolve</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <EmptyState
            title="No support tickets yet"
            message="Platform-wide support requests will appear here as soon as salons start creating them."
            label="Support"
          />
        )}
      </div>
    </div>
  );
}

