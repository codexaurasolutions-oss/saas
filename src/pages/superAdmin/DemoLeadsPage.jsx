import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";

const emptyDraft = {
  planId: "",
  salonName: "",
  businessType: "Salon",
  trialDays: 7,
  reviewNote: "",
  meetingScheduledAt: "",
  meetingLink: "https://meet.google.com/abc-defg-hij"
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
    setLoading(false);
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
        setLoading(false);
      } catch (error) {
        if (!active) return;
        setFeedback({ error: formatApiError(error, "Could not load demo leads."), success: "" });
        setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [filters]);

  const draftsById = useMemo(() => {
    const map = {};
    for (const row of rows) {
      map[row.id] = drafts[row.id] || {
        ...emptyDraft,
        salonName: row.salon?.name || `${row.name.split(" ")[0] || row.name} Salon`,
        planId: row.selectedPlanId || plans[0]?.id || "",
        meetingScheduledAt: row.meetingScheduledAt ? new Date(row.meetingScheduledAt).toISOString().slice(0, 16) : "",
        meetingLink: row.meetingLink || "https://meet.google.com/abc-defg-hij"
      };
    }
    return map;
  }, [drafts, plans, rows]);

  const patchDraft = (leadId, next) => {
    setDrafts((current) => ({
      ...current,
      [leadId]: {
        ...(draftsById[leadId] || emptyDraft),
        ...next
      }
    }));
  };

  const markContacted = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/contacted`);
      setFeedback({ error: "", success: "Lead marked as contacted." });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not update lead status."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const scheduleMeeting = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId];
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/schedule-meeting`, {
        meetingScheduledAt: draft.meetingScheduledAt,
        meetingLink: draft.meetingLink
      });
      setFeedback({ error: "", success: "Walkthrough meeting scheduled and email invitation sent!" });
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
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/send-purchase-link`, {
        planId: draft.planId
      });
      setFeedback({ error: "", success: "Subscription purchase link sent to customer email!" });
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
    try {
      const response = await api.post(`/super-admin/demo-leads/${leadId}/approve`, draftsById[leadId]);
      setLastApprovedLead(response.data);
      setFeedback({
        error: response.data.emailError ? `Demo approved but email delivery failed: ${response.data.emailError}` : "",
        success: response.data.owner.isDemoAccount 
          ? `Demo approved. Invite prepared for ${response.data.owner.email}. Salon ID: ${response.data.salon.id}`
          : `Active paid workspace created. Login details and password setup link sent to ${response.data.owner.email}.`
      });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not approve demo lead."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const rejectLead = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/reject`, {
        reviewNote: draftsById[leadId]?.reviewNote || "Rejected by Super Admin"
      });
      setFeedback({ error: "", success: "Demo lead rejected." });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not reject demo lead."), success: "" });
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
        error: response.data.emailError ? `Invite prepared but email delivery failed: ${response.data.emailError}` : "",
        success: `Invite resent. Delivery mode: ${response.data.delivery.mode.toUpperCase()}`
      });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not resend invite."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Demo Leads</h1>
            <p style={{ marginBottom: 0 }}>Review inbound interest, approve trial salons, and keep invite workflows moving smoothly.</p>
          </div>
          <div className="badge-row">
            <span className="badge">Leads {rows.length}</span>
            <span className="badge">Plans {plans.length}</span>
          </div>
        </div>
      </div>
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <span style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 700, color: "#64748b" }}>Search Leads</span>
            <input
              value={filters.q}
              placeholder="Search lead by name, email, phone, or message"
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              style={{ width: "100%", height: 40 }}
            />
          </div>
          <div style={{ width: 220 }}>
            <span style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 700, color: "#64748b" }}>Status</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              style={{ width: "100%", height: 40 }}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONTACTED">Contacted</option>
              <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => load(filters)}
            style={{ height: 40, padding: "0 20px" }}
          >
            Apply Filters
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setFilters({ q: "", status: "" })}
            style={{ height: 40, padding: "0 20px" }}
          >
            Reset
          </button>
        </div>
      </div>
      <div className="panel-card">
        {feedback.error && <p className="error-text">{feedback.error}</p>}
        {feedback.success && <p className="success-text">{feedback.success}</p>}

        {lastApprovedLead && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: 20, padding: 18, borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: "#166534", margin: "0 0 6px 0", fontSize: "1.05rem" }}>✅ Workspace Setup Ready!</h4>
                <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", color: "#1e3a1e" }}>
                  The salon workspace has been created for <strong>{lastApprovedLead.owner?.email}</strong>.
                </p>
                {lastApprovedLead.emailError && (
                  <div style={{ color: "#b91c1c", background: "#fee2e2", padding: "8px 12px", borderRadius: 8, fontSize: "0.85rem", marginBottom: 12, border: "1px solid #fca5a5" }}>
                    ⚠️ Email delivery timed out. You can manually copy the invitation details below to send via WhatsApp or SMS.
                  </div>
                )}
                <div style={{ display: "grid", gap: 12, background: "white", padding: 14, borderRadius: 10, border: "1px solid #dcfce7" }}>
                  <div><strong>Salon Slug:</strong> <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{lastApprovedLead.salon?.slug}</code></div>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#475569" }}>Setup / Password Invite Link:</strong>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <input readOnly value={lastApprovedLead.inviteLink || ""} style={{ flex: 1, minHeight: 36, padding: "4px 8px", fontSize: "0.82rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6 }} />
                      <button type="button" onClick={() => { navigator.clipboard.writeText(lastApprovedLead.inviteLink || ""); alert("Setup link copied to clipboard!"); }} style={{ minHeight: 36, padding: "4px 12px", fontSize: "0.82rem", background: "#10b981", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#475569" }}>Direct Owner Login Link:</strong>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <input readOnly value={lastApprovedLead.loginLink || ""} style={{ flex: 1, minHeight: 36, padding: "4px 8px", fontSize: "0.82rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6 }} />
                      <button type="button" onClick={() => { navigator.clipboard.writeText(lastApprovedLead.loginLink || ""); alert("Login link copied to clipboard!"); }} style={{ minHeight: 36, padding: "4px 12px", fontSize: "0.82rem", background: "#10b981", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" className="secondary-button" onClick={() => setLastApprovedLead(null)} style={{ padding: "4px 10px", minHeight: 30, fontSize: "0.8rem", cursor: "pointer" }}>
                Dismiss
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <PageLoader
            title="Loading demo pipeline"
            message="Fetching new lead submissions, approval drafts, and invite status."
          />
        ) : rows.length ? (
          <div className="list-stack">
            {rows.map((row) => {
              const draft = draftsById[row.id] || emptyDraft;
              const firstLetter = (row.name || "L").charAt(0).toUpperCase();

              // Status Styling
              let statusBg = "#f1f5f9";
              let statusColor = "#64748b";
              if (row.status === "APPROVED") {
                statusBg = "#ecfdf5";
                statusColor = "#10b981";
              } else if (row.status === "MEETING_SCHEDULED") {
                statusBg = "#eff6ff";
                statusColor = "#3b82f6";
              } else if (row.status === "REJECTED") {
                statusBg = "#fef2f2";
                statusColor = "#ef4444";
              } else if (row.status === "CONTACTED") {
                statusBg = "#f5f3ff";
                statusColor = "#8b5cf6";
              }

              const isBusy = busyId === row.id;

              return (
                <div key={row.id} className="lead-card">
                  {/* Column 1: Lead Profile */}
                  <div className="lead-profile" style={{ flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="tenant-avatar" style={{ background: "linear-gradient(135deg, #4f46e5, #3730a3)" }}>{firstLetter}</div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{row.name}</h4>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          Submitted: {new Date(row.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.85rem", color: "#334155", background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                      <div>📧 <a href={`mailto:${row.email}`} style={{ color: "#4f46e5", fontWeight: 600 }}>{row.email}</a></div>
                      <div>📞 <a href={`tel:${row.phone}`} style={{ color: "#4f46e5", fontWeight: 600 }}>{row.phone}</a></div>
                      {row.message && (
                        <div style={{ marginTop: 8, fontStyle: "italic", color: "#475569", borderLeft: "3px solid #cbd5e1", paddingLeft: 8 }}>
                          "{row.message}"
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span className="badge" style={{ background: statusBg, color: statusColor, fontWeight: 700 }}>
                        {row.status}
                      </span>
                      {row.paymentCompleted ? (
                        <span className="badge" style={{ background: "#ecfdf5", color: "#10b981", fontWeight: 700 }}>
                          Paid (Demo Checkout)
                        </span>
                      ) : row.status === "MEETING_SCHEDULED" && (
                        <span className="badge" style={{ background: "#fff7ed", color: "#c2410c" }}>
                          Pending Payment
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Approval Setup */}
                  <div className="lead-setup-box">
                    <h5>⚙️ Onboarding & Meeting Setup</h5>

                    {["PENDING", "CONTACTED"].includes(row.status) && (
                      <div style={{ display: "grid", gap: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <label>
                            <span className="info-label" style={{ fontSize: "0.75rem" }}>Salon Name</span>
                            <input
                              value={draft.salonName || ""}
                              placeholder="Salon name"
                              onChange={(event) => patchDraft(row.id, { salonName: event.target.value })}
                            />
                          </label>
                          <label>
                            <span className="info-label" style={{ fontSize: "0.75rem" }}>Select Plan</span>
                            <select
                              value={draft.planId || ""}
                              onChange={(event) => patchDraft(row.id, { planId: event.target.value })}
                            >
                              <option value="">Choose plan...</option>
                              {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
                          <label>
                            <span className="info-label" style={{ fontSize: "0.75rem" }}>Business Type</span>
                            <input
                              value={draft.businessType || ""}
                              placeholder="Salon"
                              onChange={(event) => patchDraft(row.id, { businessType: event.target.value })}
                            />
                          </label>
                          <label>
                            <span className="info-label" style={{ fontSize: "0.75rem" }}>Trial Days</span>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={draft.trialDays || 7}
                              onChange={(event) => patchDraft(row.id, { trialDays: Number(event.target.value || 7) })}
                            />
                          </label>
                        </div>

                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #e2e8f0", display: "grid", gap: 10 }}>
                          <label>
                            <span className="info-label" style={{ fontSize: "0.75rem" }}>Meeting Scheduled Date & Time</span>
                            <input
                              type="datetime-local"
                              value={draft.meetingScheduledAt || ""}
                              onChange={(event) => patchDraft(row.id, { meetingScheduledAt: event.target.value })}
                            />
                          </label>
                          <label>
                            <span className="info-label" style={{ fontSize: "0.75rem" }}>Meeting Invitation Link</span>
                            <input
                              type="text"
                              value={draft.meetingLink || ""}
                              placeholder="Google Meet link"
                              onChange={(event) => patchDraft(row.id, { meetingLink: event.target.value })}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {row.status === "MEETING_SCHEDULED" && (
                      <div style={{ display: "grid", gap: 12 }}>
                        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: 14, borderRadius: 12 }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e40af", marginBottom: 6 }}>📅 Scheduled Walkthrough</div>
                          <div style={{ fontSize: "0.8rem", color: "#1e3a8a" }}>
                            🕒 {row.meetingScheduledAt ? new Date(row.meetingScheduledAt).toLocaleString() : "-"}
                          </div>
                          <div style={{ fontSize: "0.8rem", marginTop: 6 }}>
                            🔗 <a href={row.meetingLink} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "underline" }}>Join Google Meet</a>
                          </div>
                        </div>
                        <label>
                          <span className="info-label" style={{ fontSize: "0.75rem" }}>Target Subscription Plan</span>
                          <select
                            value={draft.planId || ""}
                            onChange={(event) => patchDraft(row.id, { planId: event.target.value })}
                          >
                            <option value="">Choose plan...</option>
                            {plans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name} (INR {plan.monthlyPrice})
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}

                    {["APPROVED", "REJECTED"].includes(row.status) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, color: "#475569", fontSize: "0.9rem" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>✅ Onboarding Process Complete</div>
                        <div>Workspace setup has been finalized.</div>
                        {row.salon && (
                          <div style={{ background: "#f1f5f9", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.8rem", display: "grid", gap: 4 }}>
                            <div>🏢 <strong>Salon Name:</strong> {row.salon.name}</div>
                            <div>🔗 <strong>URL Slug:</strong> <code>{row.salon.slug}</code></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Column 3: Review & Actions */}
                  <div className="lead-actions-panel">
                    <div>
                      <span className="info-label" style={{ display: "block", marginBottom: 6, fontSize: "0.75rem" }}>Internal Review Note</span>
                      <textarea
                        rows="3"
                        value={draft.reviewNote || ""}
                        placeholder="Review notes, feedback, or logs..."
                        onChange={(event) => patchDraft(row.id, { reviewNote: event.target.value })}
                        disabled={row.status === "APPROVED"}
                        style={{ width: "100%", fontSize: "0.85rem", padding: 8, borderRadius: 8 }}
                      />
                      {row.reviewedByName && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
                          &bull; Reviewed by {row.reviewedByName} on {new Date(row.reviewedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                      {row.status === "PENDING" && (
                        <>
                          <button type="button" className="btn-compact secondary-button" onClick={() => markContacted(row.id)} disabled={isBusy}>
                            Mark Contacted
                          </button>
                          <button type="button" className="btn-compact" onClick={() => scheduleMeeting(row.id)} disabled={isBusy || !draft.meetingScheduledAt}>
                            {isBusy ? "Scheduling..." : "Schedule Meeting"}
                          </button>
                          <button type="button" className="btn-compact" onClick={() => approveLead(row.id)} disabled={isBusy} style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none" }}>
                            Approve (Trial)
                          </button>
                          <button type="button" className="btn-compact danger-button" onClick={() => rejectLead(row.id)} disabled={isBusy}>
                            Reject Lead
                          </button>
                        </>
                      )}

                      {row.status === "CONTACTED" && (
                        <>
                          <button type="button" className="btn-compact" onClick={() => scheduleMeeting(row.id)} disabled={isBusy || !draft.meetingScheduledAt}>
                            {isBusy ? "Scheduling..." : "Schedule Meeting"}
                          </button>
                          <button type="button" className="btn-compact" onClick={() => approveLead(row.id)} disabled={isBusy} style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none" }}>
                            Approve (Trial)
                          </button>
                          <button type="button" className="btn-compact danger-button" onClick={() => rejectLead(row.id)} disabled={isBusy}>
                            Reject Lead
                          </button>
                        </>
                      )}

                      {row.status === "MEETING_SCHEDULED" && (
                        <>
                          <button type="button" className="btn-compact" onClick={() => sendPurchaseLink(row.id)} disabled={isBusy}>
                            {isBusy ? "Sending link..." : "📧 Send Purchase Link"}
                          </button>
                          {row.paymentCompleted ? (
                            <button
                              type="button"
                              className="btn-compact"
                              style={{ background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "#ffffff", fontWeight: "bold", border: "none" }}
                              onClick={() => approveLead(row.id)}
                              disabled={isBusy}
                            >
                              Create Paid Account
                            </button>
                          ) : (
                            <button type="button" className="btn-compact" onClick={() => approveLead(row.id)} disabled={isBusy} style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none" }}>
                              Approve (Trial Override)
                            </button>
                          )}
                          <button type="button" className="btn-compact danger-button" onClick={() => rejectLead(row.id)} disabled={isBusy}>
                            Reject Lead
                          </button>
                        </>
                      )}

                      {row.status === "APPROVED" && (
                        <button type="button" className="btn-compact secondary-button" onClick={() => resendInvite(row.id)} disabled={isBusy}>
                          {isBusy ? "Sending..." : "Resend Invite Link"}
                        </button>
                      )}

                      {row.inviteSentAt && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center", marginTop: 4 }}>
                          Invite sent: {new Date(row.inviteSentAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No demo leads yet"
            message="New demo requests from the public website will show up here for approval and invite actions."
          />
        )}
      </div>
    </div>
  );
}

