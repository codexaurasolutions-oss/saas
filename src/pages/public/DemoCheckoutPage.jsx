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

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // 1. Dynamically load Razorpay SDK
      const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!loaded) {
        throw new Error("Failed to load Razorpay payment SDK. Please check your internet connection.");
      }

      // 2. Call backend to create Razorpay Order
      const res = await api.post(`/public/demo-checkout/${leadId}/razorpay-order`, { planId });
      const order = res.data;

      // 3. Configure Razorpay modal options
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ReSpark Salon ERP",
        description: `Subscription to ${info?.planName} Plan`,
        order_id: order.orderId,
        handler: async function (response) {
          setSubmitting(true);
          try {
            // 4. Verify Razorpay Payment Signature
            await api.post(`/public/demo-checkout/verify-razorpay`, {
              leadId,
              planId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            setSuccess(true);
          } catch (err) {
            setError(formatApiError(err, "Payment verification failed. Please contact support."));
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: order.leadName,
          email: order.leadEmail,
          contact: order.leadPhone
        },
        theme: {
          color: "#0f766e"
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(formatApiError(err, "Could not initialize payment check. Please try again."));
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
              <h1 style={{ background: "linear-gradient(135deg, #0f172a 0%, #0d9488 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Activate your subscription</h1>
              <p className="muted" style={{ fontSize: "1.05rem", lineHeight: "1.6", marginBottom: "24px" }}>
                Complete your checkout to spin up your active, paid business workspace. All plan limits and permissions will be applied to your custom salon slug.
              </p>

              <div className="ledger-card">
                <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: "1.1rem", fontWeight: 800 }}>Plan Ledger: {info?.planName}</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="ledger-item">
                    <span className="muted">Branches Allowed</span>
                    <strong>Unlimited</strong>
                  </div>
                  <div className="ledger-item">
                    <span className="muted">Stylist & Admin Accounts</span>
                    <strong>{info?.limits?.users} Users</strong>
                  </div>
                  <div className="ledger-item">
                    <span className="muted">CRM Client Limit</span>
                    <strong>{info?.limits?.customers} Contacts</strong>
                  </div>
                  <div className="ledger-item">
                    <span className="muted">POS Invoices / month</span>
                    <strong>{info?.limits?.invoices} Receipts</strong>
                  </div>
                  <div className="ledger-item">
                    <span className="muted">Base Platform Fee</span>
                    <span>INR {info?.price}</span>
                  </div>
                  <div className="ledger-item" style={{ color: "#16a34a" }}>
                    <span className="muted">Setup Cost</span>
                    <span>₹0 (Waived)</span>
                  </div>
                </div>

                <div className="ledger-total">
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1e293b" }}>Total Recurring:</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f766e" }}>INR {info?.price} <small style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "normal" }}>/ mo</small></span>
                </div>
              </div>
            </div>

            <div className="demo-form-card" style={{ padding: "32px", borderRadius: "24px" }}>
              <form onSubmit={handleCheckoutSubmit} className="demo-form" style={{ display: "grid", gap: "18px" }}>
                <div className="section-chip" style={{ justifySelf: "start" }}>Secure Gateway Checkout</div>
                
                {error && <p className="error-text" style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>{error}</p>}
                
                <div style={{ background: "rgba(244, 244, 245, 0.6)", padding: "20px", borderRadius: "16px", border: "1px solid #e4e4e7", display: "grid", gap: "14px" }}>
                  <div>
                    <span className="muted" style={{ fontSize: "0.72rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#71717a" }}>Billing Contact</span>
                    <strong style={{ color: "#18181b", fontSize: "1rem", fontWeight: 750 }}>{info?.leadName}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ fontSize: "0.72rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#71717a" }}>Billing Email</span>
                    <strong style={{ color: "#18181b", fontSize: "0.95rem", fontWeight: 600 }}>{info?.leadEmail}</strong>
                  </div>
                  {info?.company && (
                    <div>
                      <span className="muted" style={{ fontSize: "0.72rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#71717a" }}>Salon Organization</span>
                      <strong style={{ color: "#18181b", fontSize: "0.95rem", fontWeight: 600 }}>{info?.company}</strong>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: "0.8rem", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 12, display: "flex", gap: "8px", alignItems: "center" }}>
                  <span>🛡️</span>
                  <span>Payments are secured via Razorpay. All cards, UPI, Wallets, and Netbanking are supported.</span>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting} 
                  className={`demo-submit-button ${submitting ? "is-loading" : ""}`}
                  style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", color: "white", padding: "14px", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "0.95rem", transition: "all 0.25s" }}
                >
                  {submitting ? (
                    <span className="button-progress">
                      <span className="button-spinner" aria-hidden="true" />
                      Launching Secure Gateway...
                    </span>
                  ) : (
                    `Pay INR ${info?.price} via Razorpay`
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
