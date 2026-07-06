import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  const nav = useNavigate();
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
            const verifyRes = await api.post(`/public/demo-checkout/verify-razorpay`, {
              leadId,
              planId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            const { setupToken, email, loginAccessToken } = verifyRes.data;
            nav(`/reset-password?token=${setupToken}&email=${email}&access=${loginAccessToken}`);
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
                <div className="section-chip">Razorpay Secure Checkout</div>
                
                {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
                
                <div style={{ background: "#fafaf9", padding: "16px", borderRadius: "12px", border: "1px solid #e7e5e4", display: "grid", gap: "12px", marginBottom: "20px" }}>
                  <div>
                    <span className="muted" style={{ fontSize: "0.8rem", display: "block" }}>Contact Person</span>
                    <strong style={{ color: "#1c1917", fontSize: "0.95rem" }}>{info?.leadName}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ fontSize: "0.8rem", display: "block" }}>Email Address</span>
                    <strong style={{ color: "#1c1917", fontSize: "0.95rem" }}>{info?.leadEmail}</strong>
                  </div>
                  {info?.company && (
                    <div>
                      <span className="muted" style={{ fontSize: "0.8rem", display: "block" }}>Company / Salon Name</span>
                      <strong style={{ color: "#1c1917", fontSize: "0.95rem" }}>{info?.company}</strong>
                    </div>
                  )}
                </div>

                <div className="trust-card" style={{ fontSize: 13, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 12, marginBottom: 20 }}>
                  🛡️ Payments are secured via Razorpay. All cards, UPI (GPay, PhonePe, Paytm), Wallets, and Netbanking are supported.
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
                      Loading Razorpay Secure Gateway...
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
