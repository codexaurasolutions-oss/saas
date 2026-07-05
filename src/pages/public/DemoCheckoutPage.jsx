import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import PageLoader from "../../components/PageLoader";
import PublicMobileMenu from "../../components/PublicMobileMenu";
import { formatApiError } from "../../utils/apiError";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Platform", to: "/platform" },
  { label: "Request Demo", to: "/book-demo" }
];

export default function DemoCheckoutPage() {
  const { leadId, planId } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  useEffect(() => {
    document.title = "Checkout & Subscribe | ReSpark";
    api.get(`/public/demo-checkout-info/${leadId}/${planId}`)
      .then((res) => {
        setInfo(res.data);
        setCardName(res.data.leadName || "");
        setLoading(false);
      })
      .catch((err) => {
        setError(formatApiError(err, "Could not fetch checkout information. Please verify link details."));
        setLoading(false);
      });
  }, [leadId, planId]);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post(`/public/demo-checkout/${leadId}`, {
        planId,
        paymentSessionId: `demo_pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      });
      setSuccess(true);
    } catch (err) {
      setError(formatApiError(err, "Simulation payment capture failed. Please try again."));
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

        {loading ? (
          <div style={{ padding: "100px 0" }}>
            <PageLoader
              title="Loading checkout details"
              message="Securing payment tunnel, loading plan limits, and configuring subscription checkout."
            />
          </div>
        ) : error && !info ? (
          <div style={{ maxWidth: 600, margin: "100px auto", textAlign: "center" }} className="panel-card">
            <h2 className="error-text" style={{ color: "#c2410c" }}>Checkout Error</h2>
            <p className="muted">{error}</p>
            <Link to="/" className="cta-primary" style={{ display: "inline-block", marginTop: 20 }}>Back to Home</Link>
          </div>
        ) : success ? (
          <section className="demo-hero" style={{ justifyContent: "center", gridTemplateColumns: "1fr", maxWidth: 700, margin: "60px auto" }}>
            <div className="demo-success-card" style={{ padding: 40, borderRadius: 24, textAlign: "center" }}>
              <div className="demo-success-badge" style={{ fontSize: 16, padding: "8px 16px" }}>Payment Captured</div>
              <h1 style={{ fontSize: 32, margin: "20px 0 10px" }}>Subscription Activated Successfully!</h1>
              <p style={{ fontSize: 16, lineHeight: "1.7", marginBottom: 30 }} className="muted">
                Thank you for purchasing the <strong>{info?.planName}</strong> subscription plan for <strong>{info?.company || "your salon"}</strong>. 
                Your workspace creation order has been updated in the Admin Panel. 
                <br/><br/>
                Our Super Admin team will now provision your active account and send your secure login password-setup credentials to <strong>{info?.leadEmail}</strong>.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                <Link to="/" className="cta-primary">Go to Homepage</Link>
                <a href="mailto:support@respark.local" className="cta-secondary">Contact Support</a>
              </div>
            </div>
          </section>
        ) : (
          <section className="demo-hero">
            <div className="demo-copy">
              <div className="eyebrow-pill" style={{ background: "#e0f2fe", color: "#0369a1" }}>Subscription Checkout</div>
              <h1>Subscribe to {info?.planName} Plan</h1>
              <p>
                Complete your checkout to spin up your active, paid business workspace.
                All plan limits and permissions will be applied to your custom salon slug.
              </p>

              <div className="trust-card" style={{ background: "#fafaf9", border: "1px solid #e7e5e4", padding: 20, borderRadius: 16, marginTop: 20 }}>
                <h3 style={{ margin: "0 0 12px", color: "#0f766e" }}>Plan Summary: {info?.planName}</h3>
                <ul className="public-list compact" style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  <li style={{ display: "flex", justifyContent: "between", padding: "6px 0", borderBottom: "1px solid #f5f5f4" }}>
                    <span className="muted">Branches Limit:</span>
                    <strong>{info?.limits?.branches || "Unlimited"}</strong>
                  </li>
                  <li style={{ display: "flex", justifyContent: "between", padding: "6px 0", borderBottom: "1px solid #f5f5f4" }}>
                    <span className="muted">Staff Users:</span>
                    <strong>{info?.limits?.users}</strong>
                  </li>
                  <li style={{ display: "flex", justifyContent: "between", padding: "6px 0", borderBottom: "1px solid #f5f5f4" }}>
                    <span className="muted">CRM Customers:</span>
                    <strong>{info?.limits?.customers}</strong>
                  </li>
                  <li style={{ display: "flex", justifyContent: "between", padding: "6px 0" }}>
                    <span className="muted">Monthly Invoices:</span>
                    <strong>{info?.limits?.invoices}</strong>
                  </li>
                </ul>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "2px solid #e7e5e4", display: "flex", justifyContent: "between", alignItems: "center" }}>
                  <span style={{ fontSize: 16 }}>Amount Due:</span>
                  <span style={{ fontSize: 24, fontWeight: "bold", color: "#c2410c" }}>INR {info?.price} / mo</span>
                </div>
              </div>
            </div>

            <div className="demo-form-card">
              <form onSubmit={handleCheckoutSubmit} className="demo-form">
                <div className="section-chip">Simulated Payment Details</div>
                
                {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
                
                <label>
                  <span className="muted">Cardholder Name</span>
                  <input
                    type="text"
                    required
                    value={cardName}
                    placeholder="Enter Cardholder Name"
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </label>

                <label>
                  <span className="muted">Card Number</span>
                  <input
                    type="text"
                    required
                    maxLength="19"
                    value={cardNumber}
                    placeholder="4111 2222 3333 4444"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
                      setCardNumber(val);
                    }}
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <label>
                    <span className="muted">Expiry Date</span>
                    <input
                      type="text"
                      required
                      maxLength="5"
                      value={cardExpiry}
                      placeholder="MM/YY"
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 2) {
                          val = val.substr(0, 2) + "/" + val.substr(2, 2);
                        }
                        setCardExpiry(val);
                      }}
                    />
                  </label>

                  <label>
                    <span className="muted">CVV</span>
                    <input
                      type="password"
                      required
                      maxLength="3"
                      value={cardCvv}
                      placeholder="•••"
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                    />
                  </label>
                </div>

                <div className="trust-card" style={{ fontSize: 13, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 12, marginTop: 16, marginBottom: 16 }}>
                  🛡️ This is a secure checkout simulation sandbox. No real money will be charged.
                </div>

                <button 
                  type="submit" 
                  disabled={submitting} 
                  className={`demo-submit-button ${submitting ? "is-loading" : ""}`}
                  style={{ background: "linear-gradient(135deg,#c2410c,#0f766e)" }}
                >
                  {submitting ? (
                    <span className="button-progress">
                      <span className="button-spinner" aria-hidden="true" />
                      Capturing payment...
                    </span>
                  ) : (
                    `Pay INR ${info?.price} & Subscribe`
                  )}
                </button>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
