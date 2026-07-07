import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { CheckCircle, XCircle, Clock, Mail, Phone, Calendar, Building2, Send, ChevronDown, ArrowRight, RotateCcw } from "lucide-react";

const PIPELINE = [
  { value: "NEW", label: "New", color: "#3b82f6", bg: "#eff6ff" },
  { value: "CONNECTED", label: "Connected", color: "#8b5cf6", bg: "#f5f3ff" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#f59e0b", bg: "#fffbeb" },
  { value: "CONVERTED", label: "Converted", color: "#10b981", bg: "#ecfdf5" },
  { value: "CANCELED", label: "Canceled", color: "#ef4444", bg: "#fef2f2" }
];

const getStatusMeta = (status) => PIPELINE.find(s => s.value === status) || PIPELINE[0];

const emptyDraft = {
  planId: "",
  salonName: "",
  businessType: "Salon",
  trialDays: 30,
  reviewNote: "",
  meetingScheduledAt: "",
  meetingLink: ""
};

export default function DemoLeadsPage() {
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const qFilter = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "";

  const filters = useMemo(() => ({
    q: qFilter,
    status: statusFilter
  }), [qFilter, statusFilter]);

  const setFilters = (newFilters) => {
    setSearchParams((prev) => {
      if (typeof newFilters === "function") {
        const next = newFilters({ q: qFilter, status: statusFilter });
        if (next.q) prev.set("q", next.q); else prev.delete("q");
        if (next.status) prev.set("status", next.status); else prev.delete("status");
      } else {
        if (newFilters.q) prev.set("q", newFilters.q); else prev.delete("q");
        if (newFilters.status) prev.set("status", newFilters.status); else prev.delete("status");
      }
      return prev;
    });
  };

  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState("");
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [lastApprovedLead, setLastApprovedLead] = useState(null);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const [leadResponse, planResponse] = await Promise.all([
        api.get("/super-admin/demo-leads", {
          params: {
            ...(nextFilters.q ? { q: nextFilters.q } : {}),
            ...(nextFilters.status ? { status: nextFilters.status } : {})
          }
        }),
        api.get("/super-admin/plans")
      ]);
      setRows(leadResponse.data);
      setPlans(planResponse.data);
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not load demo leads."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const [leadResponse, planResponse] = await Promise.all([
          api.get("/super-admin/demo-leads", {
            params: {
              ...(filters.q ? { q: filters.q } : {}),
              ...(filters.status ? { status: filters.status } : {})
            }
          }),
          api.get("/super-admin/plans")
        ]);
        if (!active) return;
        setRows(leadResponse.data);
        setPlans(planResponse.data);
      } catch (error) {
        if (!active) return;
        setFeedback({ error: formatApiError(error, "Could not load demo leads."), success: "" });
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [filters]);

  const draftsById = useMemo(() => {
    const map = {};
    for (const row of rows) {
      map[row.id] = drafts[row.id] || {
        ...emptyDraft,
        salonName: row.salon?.name || `${row.name.split(" ")[0] || row.name} Salon`,
        planId: row.selectedPlanId || plans[0]?.id || "",
        meetingScheduledAt: row.meetingScheduledAt ? new Date(row.meetingScheduledAt).toISOString().slice(0, 16) : "",
        meetingLink: row.meetingLink || ""
      };
    }
    return map;
  }, [drafts, plans, rows]);

  const patchDraft = (leadId, next) => {
    setDrafts((current) => ({
      ...current,
      [leadId]: { ...(draftsById[leadId] || emptyDraft), ...next }
    }));
  };

  const updateStatus = async (leadId, newStatus) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    try {
      await api.patch(`/super-admin/demo-leads/${leadId}/status`, { status: newStatus });
      setFeedback({ error: "", success: `Lead moved to "${getStatusMeta(newStatus).label}".` });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not update status."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const markConnected = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/contacted`);
      setFeedback({ error: "", success: "Lead marked as Connected." });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not update lead."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const scheduleMeeting = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId];
    if (!draft.meetingScheduledAt || !draft.meetingLink) {
      setFeedback({ error: "Please fill meeting date/time and meeting link before scheduling.", success: "" });
      setBusyId("");
      return;
    }
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/schedule-meeting`, {
        meetingScheduledAt: draft.meetingScheduledAt,
        meetingLink: draft.meetingLink
      });
      setFeedback({ error: "", success: "Meeting scheduled and email invitation sent!" });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not schedule meeting."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const sendPurchaseLink = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId];
    if (!draft.planId) {
      setFeedback({ error: "Please select a subscription plan before sending the purchase link.", success: "" });
      setBusyId("");
      return;
    }
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/send-purchase-link`, { planId: draft.planId });
      setFeedback({ error: "", success: "Purchase link sent to customer email!" });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not send purchase link."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const approveLead = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    setLastApprovedLead(null);
    const draft = draftsById[leadId];
    if (!draft.planId) {
      setFeedback({ error: "Please select a subscription plan before creating the workspace.", success: "" });
      setBusyId("");
      return;
    }
    try {
      const response = await api.post(`/super-admin/demo-leads/${leadId}/approve`, draft);
      setLastApprovedLead(response.data);
      setFeedback({
        error: response.data.emailError ? `Workspace created but email failed: ${response.data.emailError}` : "",
        success: response.data.owner.isDemoAccount
          ? `Demo workspace created for ${response.data.owner.email}. Salon: ${response.data.salon.name}`
          : `Paid workspace created. Login details sent to ${response.data.owner.email}.`
      });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not create workspace."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const cancelLead = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/reject`, {
        reviewNote: draftsById[leadId]?.reviewNote || "Canceled by Super Admin"
      });
      setFeedback({ error: "", success: "Lead has been canceled." });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not cancel lead."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const resendInvite = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    try {
      const response = await api.post(`/super-admin/demo-leads/${leadId}/resend-invite`);
      setFeedback({
        error: response.data.emailError ? `Invite prepared but email failed: ${response.data.emailError}` : "",
        success: `Invite resent. Delivery: ${response.data.delivery.mode.toUpperCase()}`
      });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not resend invite."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const pipelineCounts = useMemo(() => {
    const counts = {};
    PIPELINE.forEach(s => { counts[s.value] = 0; });
    rows.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [rows]);

  return (
    <div className="page-shell super-admin-page">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>Demo Pipeline</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Track and manage demo lead lifecycle from first contact to conversion.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => load(filters)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#475569" }}>
              <RotateCcw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {PIPELINE.map(stage => (
          <div
            key={stage.value}
            onClick={() => setFilters({ q: filters.q, status: filters.status === stage.value ? "" : stage.value })}
            style={{
              padding: "14px 16px",
              background: filters.status === stage.value ? stage.bg : "#fff",
              border: `2px solid ${filters.status === stage.value ? stage.color : "#e2e8f0"}`,
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: stage.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{stage.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{pipelineCounts[stage.value]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={filters.q}
          placeholder="Search by name, email, phone..."
          onChange={(e) => setFilters({ q: e.target.value, status: filters.status })}
          style={{ flex: 1, minWidth: 250, height: 40, padding: "0 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }}
        />
        <button
          onClick={() => setFilters({ q: "", status: "" })}
          style={{ height: 40, padding: "0 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748b" }}
        >
          Clear Filters
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback.error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, marginBottom: 16, color: "#991b1b", fontSize: 14, fontWeight: 500 }}>
          <XCircle size={18} /> {feedback.error}
          <span onClick={() => setFeedback({ error: "", success: "" })} style={{ marginLeft: "auto", cursor: "pointer", color: "#dc2626", fontWeight: 700 }}>x</span>
        </div>
      )}
      {feedback.success && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, marginBottom: 16, color: "#065f46", fontSize: 14, fontWeight: 500 }}>
          <CheckCircle size={18} /> {feedback.success}
          <span onClick={() => setFeedback({ error: "", success: "" })} style={{ marginLeft: "auto", cursor: "pointer", color: "#059669", fontWeight: 700 }}>x</span>
        </div>
      )}

      {/* Approved Lead Banner */}
      {lastApprovedLead && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <h4 style={{ color: "#065f46", margin: "0 0 8px", fontSize: "1rem", fontWeight: 700 }}>Workspace Created!</h4>
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "#064e3b" }}>
                Salon workspace created for <strong>{lastApprovedLead.owner?.email}</strong>.
              </p>
              {lastApprovedLead.emailError && (
                <div style={{ color: "#991b1b", background: "#fef2f2", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12, border: "1px solid #fca5a5" }}>
                  Email delivery timed out. Copy the details below to send manually.
                </div>
              )}
              <div style={{ display: "grid", gap: 8, background: "#fff", padding: 14, borderRadius: 10, border: "1px solid #d1fae5" }}>
                <div style={{ fontSize: 13 }}><strong>Salon:</strong> {lastApprovedLead.salon?.name} (<code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{lastApprovedLead.salon?.slug}</code>)</div>
                <div style={{ fontSize: 13 }}>
                  <strong>Setup Link:</strong>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <input readOnly value={lastApprovedLead.inviteLink || ""} style={{ flex: 1, padding: "6px 8px", fontSize: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6 }} />
                    <button onClick={() => { navigator.clipboard.writeText(lastApprovedLead.inviteLink || ""); alert("Copied!"); }} style={{ padding: "6px 12px", fontSize: 12, background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Copy</button>
                  </div>
                </div>
                <div style={{ fontSize: 13 }}>
                  <strong>Login Link:</strong>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <input readOnly value={lastApprovedLead.loginLink || ""} style={{ flex: 1, padding: "6px 8px", fontSize: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6 }} />
                    <button onClick={() => { navigator.clipboard.writeText(lastApprovedLead.loginLink || ""); alert("Copied!"); }} style={{ padding: "6px 12px", fontSize: 12, background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Copy</button>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setLastApprovedLead(null)} style={{ padding: "4px 10px", background: "transparent", border: "1px solid #d1fae5", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#065f46", fontWeight: 600 }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Lead Cards */}
      {loading ? (
        <PageLoader title="Loading pipeline" message="Fetching demo leads..." />
      ) : rows.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {rows.map((row) => {
            const draft = draftsById[row.id] || emptyDraft;
            const meta = getStatusMeta(row.status);
            const isBusy = busyId === row.id;
            const firstLetter = (row.name || "L").charAt(0).toUpperCase();

            return (
              <div key={row.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", transition: "box-shadow 0.15s" }}>
                {/* Card Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #3730a3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>{firstLetter}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>{row.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Submitted {new Date(row.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {row.paymentCompleted && (
                      <span style={{ padding: "3px 10px", background: "#ecfdf5", color: "#10b981", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>PAID</span>
                    )}
                    {row.salon && (
                      <span style={{ padding: "3px 10px", background: "#eff6ff", color: "#3b82f6", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>WORKSPACE EXISTS</span>
                    )}
                    {/* Status Dropdown */}
                    <div style={{ position: "relative" }}>
                      <select
                        value={row.status}
                        onChange={(e) => updateStatus(row.id, e.target.value)}
                        disabled={isBusy}
                        style={{
                          appearance: "none",
                          padding: "6px 32px 6px 12px",
                          background: meta.bg,
                          color: meta.color,
                          border: `2px solid ${meta.color}`,
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: isBusy ? "not-allowed" : "pointer",
                          outline: "none",
                          minWidth: 130
                        }}
                      >
                        {PIPELINE.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} color={meta.color} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                  {/* Contact Info */}
                  <div style={{ padding: "16px 20px", borderRight: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Contact Details</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                        <Mail size={14} color="#94a3b8" />
                        <a href={`mailto:${row.email}`} style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>{row.email}</a>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                        <Phone size={14} color="#94a3b8" />
                        <a href={`tel:${row.phone}`} style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>{row.phone}</a>
                      </div>
                      {row.company && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                          <Building2 size={14} color="#94a3b8" />
                          <span>{row.company}</span>
                        </div>
                      )}
                    </div>
                    {row.message && (
                      <div style={{ marginTop: 10, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, borderLeft: "3px solid #cbd5e1", fontSize: 12, color: "#475569", fontStyle: "italic" }}>
                        "{row.message}"
                      </div>
                    )}
                  </div>

                  {/* Meeting / Schedule Info */}
                  <div style={{ padding: "16px 20px", borderRight: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Meeting & Schedule</div>
                    {row.meetingScheduledAt ? (
                      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#1e40af", marginBottom: 4 }}>
                          <Calendar size={14} /> Scheduled
                        </div>
                        <div style={{ fontSize: 12, color: "#1e3a8a" }}>{new Date(row.meetingScheduledAt).toLocaleString()}</div>
                        {row.meetingLink && (
                          <a href={row.meetingLink} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "underline" }}>
                            Join Meeting <ArrowRight size={12} />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic" }}>No meeting scheduled yet</div>
                    )}
                    {row.reviewedByName && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
                        Reviewed by {row.reviewedByName} on {new Date(row.reviewedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Actions</div>

                    {row.status === "NEW" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button onClick={() => markConnected(row.id)} disabled={isBusy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer" }}>
                          <Phone size={14} /> Mark Connected
                        </button>
                        <button onClick={() => cancelLead(row.id)} disabled={isBusy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer" }}>
                          <XCircle size={14} /> Cancel
                        </button>
                      </div>
                    )}

                    {row.status === "CONNECTED" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Meeting Date & Time</label>
                          <input type="datetime-local" value={draft.meetingScheduledAt || ""} onChange={(e) => patchDraft(row.id, { meetingScheduledAt: e.target.value })} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Meeting Link</label>
                          <input value={draft.meetingLink || ""} placeholder="https://meet.google.com/..." onChange={(e) => patchDraft(row.id, { meetingLink: e.target.value })} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                        </div>
                        <button onClick={() => scheduleMeeting(row.id)} disabled={isBusy || !draft.meetingScheduledAt || !draft.meetingLink} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: isBusy || !draft.meetingScheduledAt || !draft.meetingLink ? "#e2e8f0" : "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isBusy || !draft.meetingScheduledAt || !draft.meetingLink ? "not-allowed" : "pointer" }}>
                          <Calendar size={14} /> {isBusy ? "Scheduling..." : "Schedule Meeting"}
                        </button>
                        <button onClick={() => cancelLead(row.id)} disabled={isBusy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer" }}>
                          <XCircle size={14} /> Cancel
                        </button>
                      </div>
                    )}

                    {row.status === "IN_PROGRESS" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Subscription Plan</label>
                          <select value={draft.planId || ""} onChange={(e) => patchDraft(row.id, { planId: e.target.value })} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }}>
                            <option value="">Select plan...</option>
                            {plans.map(p => <option key={p.id} value={p.id}>{p.name} - INR {p.monthlyPrice}/mo</option>)}
                          </select>
                        </div>
                        <button onClick={() => sendPurchaseLink(row.id)} disabled={isBusy || !draft.planId} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: isBusy || !draft.planId ? "#e2e8f0" : "#f59e0b", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isBusy || !draft.planId ? "not-allowed" : "pointer" }}>
                          <Send size={14} /> {isBusy ? "Sending..." : "Send Purchase Link"}
                        </button>
                        <button onClick={() => approveLead(row.id)} disabled={isBusy || !draft.planId} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: isBusy || !draft.planId ? "#e2e8f0" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isBusy || !draft.planId ? "not-allowed" : "pointer" }}>
                          <CheckCircle size={14} /> Create Workspace
                        </button>
                        <button onClick={() => cancelLead(row.id)} disabled={isBusy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer" }}>
                          <XCircle size={14} /> Cancel
                        </button>
                      </div>
                    )}

                    {row.status === "CONVERTED" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {row.salon && (
                          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: 10, fontSize: 12 }}>
                            <div style={{ fontWeight: 700, color: "#065f46", marginBottom: 4 }}>Active Salon</div>
                            <div style={{ color: "#064e3b" }}>{row.salon.name}</div>
                            <div style={{ color: "#064e3b" }}>Slug: <code style={{ background: "#d1fae5", padding: "1px 4px", borderRadius: 3 }}>{row.salon.slug}</code></div>
                          </div>
                        )}
                        <button onClick={() => resendInvite(row.id)} disabled={isBusy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer" }}>
                          <RotateCcw size={14} /> {isBusy ? "Sending..." : "Resend Invite"}
                        </button>
                      </div>
                    )}

                    {row.status === "CANCELED" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 10, fontSize: 12, color: "#991b1b" }}>
                          This lead has been canceled.
                        </div>
                        {row.reviewNote && (
                          <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                            Note: {row.reviewNote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Review Note (always shown) */}
                    <div style={{ marginTop: 10, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                      <textarea
                        rows={2}
                        value={draft.reviewNote || ""}
                        placeholder="Internal notes..."
                        onChange={(e) => patchDraft(row.id, { reviewNote: e.target.value })}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, resize: "none" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No demo leads yet"
          message="New demo requests from the website will appear here."
        />
      )}
    </div>
  );
}
