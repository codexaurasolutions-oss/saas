import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import demoIllustration from "../../assets/public-demo-illustration.svg";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import PublicMobileMenu from "../../components/PublicMobileMenu";
import { formatApiError } from "../../utils/apiError";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  message: ""
};

const navItems = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Platform", to: "/platform" },
  { label: "Request Demo", to: "/book-demo" }
];

export default function PublicDemoLeadPage() {
  const [form, setForm] = useState(initialForm);
  const [settings, setSettings] = useState(null);
  const [state, setState] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Request Demo | ReSpark";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "Request a live product demo for the salon ERP platform, including owner panel, staff permissions, POS, CRM, and reporting.");
    api.get("/public/settings").then((response) => {
      setSettings(response.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setState({ error: "", success: "" });
    setSubmitting(true);
    try {
      await api.post("/public/demo-leads", form);
      setForm(initialForm);
      setState({ error: "", success: "Your demo request has been received. Our team will contact you shortly." });
    } catch (error) {
      setState({ error: formatApiError(error, "Could not submit your demo request right now."), success: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-site demo-page-shell">
      <div className="public-orb orb-one" />
      <div className="public-orb orb-two" />
      <main className="public-main">
        <div className="demo-topbar">
          <Link to="/" className="brand-mark demo-brand-link">
            <img src="/logo-respark.svg" alt="ReSpark" className="brand-logo" />
            <span className="brand-lockup">
              <strong>ReSpark</strong>
              <small>Salon ERP Platform</small>
            </span>
          </Link>
          <div className="demo-topbar-menu">
            <PublicMobileMenu
              brand={{ label: "ReSpark", sublabel: "Salon ERP Platform", logo: "/logo-respark.svg", to: "/" }}
              items={navItems}
              cta={{ label: "Request Demo", to: "/book-demo" }}
            />
          </div>
        </div>

        <section className="demo-hero">
          <div className="demo-copy">
            <div className="eyebrow-pill" style={{ background: "#e2f0d9", color: "#385723" }}>Demo Session</div>
            <h1 style={{ background: "linear-gradient(135deg, #0f172a 0%, #0d9488 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Let&apos;s map your salon workflow.</h1>
            <p className="muted" style={{ fontSize: "1.05rem", lineHeight: "1.6", marginBottom: "24px" }}>
              Share your details, and our deployment specialists will configure a sandboxed multi-branch demo environment for your salon.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(255, 255, 255, 0.6)", border: "1px solid #e4e4e7", borderRadius: "20px", padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", color: "#0f172a", fontWeight: 800 }}>Demo Agenda Highlights:</h3>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ccfbf1", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.8rem", flexShrink: 0 }}>1</span>
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem", color: "#1e293b" }}>Unified Workspace Access</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Check out owner, manager, receptionist, and stylist portals in action.</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ccfbf1", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.8rem", flexShrink: 0 }}>2</span>
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem", color: "#1e293b" }}>Multi-Branch & Service Control</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Configure staff assignments, categories, and branch-wide catalogs.</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ccfbf1", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.8rem", flexShrink: 0 }}>3</span>
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem", color: "#1e293b" }}>POS Billing & Invoicing</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Issue receipts, track payments, download reports, and export CSVs.</span>
                </div>
              </div>
            </div>

            <div className="public-badges">
              <span>Owner/Admin panel</span>
              <span>POS + invoices</span>
              <span>Reports + CRM</span>
              <span>Super Admin controls</span>
            </div>
          </div>

          <div className="demo-form-card" style={{ padding: "32px", borderRadius: "24px" }}>
            {loading ? (
              <PageLoader
                compact
                title="Loading demo request form"
                message="Preparing public settings and request context for your walkthrough."
              />
            ) : (
            <form onSubmit={submit} className="demo-form" style={{ display: "grid", gap: "16px" }}>
              <div className="section-chip" style={{ justifySelf: "start" }}>Request Guided Walkthrough</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Your Name</span>
                  <input
                    value={form.name}
                    placeholder="Full name"
                    required
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
                    onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Work Email</span>
                  <input
                    value={form.email}
                    type="email"
                    placeholder="name@company.com"
                    required
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
                    onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </label>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Phone Number</span>
                  <input
                    value={form.phone}
                    placeholder="e.g. +91 99999 99999"
                    required
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Salon Name</span>
                  <input
                    value={form.company}
                    placeholder="Salon / Studio name"
                    required
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
                    onChange={(event) => setForm({ ...form, company: event.target.value })} />
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>How can we help? (Optional)</span>
                <textarea
                  rows="4"
                  value={form.message}
                  placeholder="Tell us about your branch count, team size, or what you want to see."
                  style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem", resize: "none" }}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                />
              </label>

              <button type="submit" disabled={submitting} className={`demo-submit-button ${submitting ? "is-loading" : ""}`} style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", color: "white", padding: "12px", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s" }}>
                {submitting ? (
                  <span className="button-progress">
                    <span className="button-spinner" aria-hidden="true" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Demo Request"
                )}
              </button>
              
              {state.error && <p className="error-text" style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>{state.error}</p>}
              
              {state.success && (
                <div className="demo-success-card" role="status" aria-live="polite" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div className="demo-success-badge" style={{ alignSelf: "start", background: "#dcfce7", color: "#166534", fontSize: "0.72rem", padding: "2px 8px", borderRadius: "99px", fontWeight: 750 }}>Request Sent</div>
                  <strong style={{ color: "#14532d", fontSize: "0.9rem" }}>We have received your request!</strong>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#166534" }}>{state.success}</p>
                </div>
              )}
            </form>
            )}
          </div>
        </section>

        <section className="public-section two-panel">
          <div className="feature-panel warm">
            <div className="section-chip">During the demo</div>
            <ul className="public-list">
              <li>How roles and permissions work across the same admin panel</li>
              <li>How POS, invoices, payments, and reports connect together</li>
              <li>How Super Admin controls plans, features, and salon status</li>
            </ul>
          </div>
          <div className="feature-panel cool">
            <div className="section-chip">Need more context first?</div>
            <p>Explore the feature breakdown, pricing plans, and platform page before booking the walkthrough.</p>
            <div className="public-hero-actions">
              <Link to="/features" className="cta-secondary">View Features</Link>
              <Link to="/pricing" className="cta-secondary">View Pricing</Link>
            </div>
          </div>
        </section>

        <section className="public-section demo-summary-card">
          <div className="section-chip">What happens next</div>
          <h3>Your request lands directly in the Super Admin demo approval pipeline.</h3>
          <p>Once approved, the team can provision a 7-day demo workspace, send your secure password-setup link, and guide your first login into the panel.</p>
        </section>

        {settings?.maintenanceMode ? (
          <section className="public-section">
            <div className="feature-panel warm">
              <div className="section-chip">Maintenance Notice</div>
              <p>Platform maintenance mode is active right now. Demo requests still reach the team, but workspace access may be provisioned after maintenance clears.</p>
            </div>
          </section>
        ) : <section className="public-section"><EmptyState title="No maintenance restrictions" message="The platform is currently open for normal demo provisioning and workspace walkthrough scheduling." /></section>}
      </main>
    </div>
  );
}
