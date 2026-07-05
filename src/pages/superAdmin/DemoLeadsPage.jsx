import { useEffect, useMemo, useState } from "react";
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
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState("");
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);

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
    try {
      const response = await api.post(`/super-admin/demo-leads/${leadId}/approve`, draftsById[leadId]);
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
    <div className="page-shell">
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
      <div className="panel-card" style={{ marginBottom: 18 }}>
        <div className="form-grid">
          <label>
              <span className="muted">Search lead by name, email, phone, or message</span>
              <input value={filters.q} placeholder="Search lead by name, email, phone, or message" onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />
            </label>
          <label>
              <span className="muted">Statuses</span>
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONTACTED">Contacted</option>
            <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
            </label>
          <button type="button" className="secondary-button" onClick={() => load(filters)}>Apply Filters</button>
          <button type="button" className="secondary-button" onClick={() => setFilters({ q: "", status: "" })}>Reset</button>
        </div>
      </div>
      <div className="panel-card">
        {feedback.error && <p className="error-text">{feedback.error}</p>}
        {feedback.success && <p className="success-text">{feedback.success}</p>}
        {loading ? (
          <PageLoader
            title="Loading demo pipeline"
            message="Fetching new lead submissions, approval drafts, and invite status."
          />
        ) : rows.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Approval Setup</th>
                  <th>Status</th>
                  <th>Review</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const draft = draftsById[row.id];
                  return (
                    <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                      <div>{row.email}</div>
                      <div>{row.phone}</div>
                      <div className="muted">{row.message || "-"}</div>
                    </td>
                    <td style={{ minWidth: 280 }}>
                      {["PENDING", "CONTACTED"].includes(row.status) && (
                        <div style={{ display: "grid", gap: 8 }}>
                          <label>
                            <span className="muted">Salon name</span>
                            <input
                              value={draft.salonName}
                              placeholder="Salon name"
                              onChange={(event) => patchDraft(row.id, { salonName: event.target.value })}
                            />
                          </label>
                          <label>
                            <span className="muted">Select Option Plan</span>
                            <select
                              value={draft.planId}
                              onChange={(event) => patchDraft(row.id, { planId: event.target.value })}
                            >
                              {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 8 }}>
                            <label>
                              <span className="muted">Business type</span>
                              <input
                                value={draft.businessType}
                                placeholder="Business type"
                                onChange={(event) => patchDraft(row.id, { businessType: event.target.value })}
                              />
                            </label>
                            <label>
                              <span className="muted">Trial days</span>
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={draft.trialDays}
                                onChange={(event) => patchDraft(row.id, { trialDays: Number(event.target.value || 7) })}
                              />
                            </label>
                          </div>
                          
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #ddd", display: "grid", gap: 6 }}>
                            <strong>Walkthrough Setup</strong>
                            <label>
                              <span className="muted">Meeting Date & Time</span>
                              <input
                                type="datetime-local"
                                value={draft.meetingScheduledAt}
                                onChange={(event) => patchDraft(row.id, { meetingScheduledAt: event.target.value })}
                              />
                            </label>
                            <label>
                              <span className="muted">Meeting Link</span>
                              <input
                                type="text"
                                value={draft.meetingLink}
                                placeholder="Google Meet link"
                                onChange={(event) => patchDraft(row.id, { meetingLink: event.target.value })}
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      {row.status === "MEETING_SCHEDULED" && (
                        <div style={{ display: "grid", gap: 8 }}>
                          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "10px 12px", borderRadius: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: "bold", color: "#0369a1", marginBottom: 4 }}>Scheduled Walkthrough</div>
                            <div style={{ fontSize: 13 }}>📅 {row.meetingScheduledAt ? new Date(row.meetingScheduledAt).toLocaleString() : "-"}</div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>
                              🔗 <a href={row.meetingLink} target="_blank" rel="noreferrer" style={{ color: "#0284c7", fontWeight: "bold", textDecoration: "underline" }}>Join Meeting Link</a>
                            </div>
                          </div>
                          <label>
                            <span className="muted">Target Subscription Plan</span>
                            <select
                              value={draft.planId}
                              onChange={(event) => patchDraft(row.id, { planId: event.target.value })}
                            >
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
                        <div className="muted">
                          Setup completed. 
                          {row.salon && <div>Workspace is active.</div>}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "start" }}>
                        <span className={`badge status-${row.status.toLowerCase()}`}>
                          {row.status}
                        </span>
                        {row.paymentCompleted ? (
                          <span style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: "bold" }}>
                            Paid (Demo Checkout)
                          </span>
                        ) : row.status === "MEETING_SCHEDULED" && (
                          <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5", padding: "4px 8px", borderRadius: 8, fontSize: 11 }}>
                            Pending Payment
                          </span>
                        )}
                        {row.salon && (
                          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                            {row.salon.name}
                            <br />
                            Slug: {row.salon.slug}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ minWidth: 200 }}>
                      <textarea
                        rows="4"
                        value={draft.reviewNote}
                        placeholder="Review note"
                        onChange={(event) => patchDraft(row.id, { reviewNote: event.target.value })}
                        disabled={row.status === "APPROVED"}
                      />
                      <div className="muted" style={{ fontSize: 11 }}>
                        {row.reviewedByName ? `${row.reviewedByName} • ${new Date(row.reviewedAt).toLocaleString()}` : "Pending review"}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(row.createdAt).toLocaleString()}</td>
                    <td style={{ minWidth: 200 }}>
                      <div style={{ display: "grid", gap: 8 }}>
                        {row.status === "PENDING" && (
                          <>
                            <button type="button" className="secondary-button" onClick={() => markContacted(row.id)} disabled={busyId === row.id}>
                              Mark Contacted
                            </button>
                            <button type="button" onClick={() => scheduleMeeting(row.id)} disabled={busyId === row.id || !draft.meetingScheduledAt}>
                              Schedule Meeting
                            </button>
                            <button type="button" className="secondary-button" onClick={() => approveLead(row.id)} disabled={busyId === row.id}>
                              Approve (Trial)
                            </button>
                            <button type="button" className="secondary-button" onClick={() => rejectLead(row.id)} disabled={busyId === row.id}>
                              Reject
                            </button>
                          </>
                        )}

                        {row.status === "CONTACTED" && (
                          <>
                            <button type="button" onClick={() => scheduleMeeting(row.id)} disabled={busyId === row.id || !draft.meetingScheduledAt}>
                              Schedule Meeting
                            </button>
                            <button type="button" className="secondary-button" onClick={() => approveLead(row.id)} disabled={busyId === row.id}>
                              Approve (Trial)
                            </button>
                            <button type="button" className="secondary-button" onClick={() => rejectLead(row.id)} disabled={busyId === row.id}>
                              Reject
                            </button>
                          </>
                        )}

                        {row.status === "MEETING_SCHEDULED" && (
                          <>
                            <button type="button" onClick={() => sendPurchaseLink(row.id)} disabled={busyId === row.id}>
                              Send Purchase Link
                            </button>
                            {row.paymentCompleted ? (
                              <button 
                                type="button" 
                                style={{ background: "linear-gradient(135deg,#0f766e,#0d9488)", color: "#ffffff", fontWeight: "bold", border: "none" }} 
                                onClick={() => approveLead(row.id)} 
                                disabled={busyId === row.id}
                              >
                                Create Paid Account
                              </button>
                            ) : (
                              <button type="button" className="secondary-button" onClick={() => approveLead(row.id)} disabled={busyId === row.id}>
                                Approve (Trial Override)
                              </button>
                            )}
                            <button type="button" className="secondary-button" onClick={() => rejectLead(row.id)} disabled={busyId === row.id}>
                              Reject
                            </button>
                          </>
                        )}

                        {row.status === "APPROVED" && (
                          <button type="button" className="secondary-button" onClick={() => resendInvite(row.id)} disabled={busyId === row.id}>
                            {busyId === row.id ? "Sending..." : "Resend Invite"}
                          </button>
                        )}

                        {row.inviteSentAt && <div className="muted" style={{ fontSize: 11 }}>Invite sent: {new Date(row.inviteSentAt).toLocaleString()}</div>}
                      </div>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

