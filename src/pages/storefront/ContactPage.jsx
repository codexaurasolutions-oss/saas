import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

export default function ContactPage() {
  const { salon } = useOutletContext();
  const config = salon?.websiteConfig || {};
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/public/salon/${salon.slug}/enquiry`, form);
      setSubmitted(true);
    } catch (err) {
      alert("Failed to send enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const contactPhone = config.contactPhone || salon.phone || "";
  const contactEmail = config.contactEmail || salon.email || "";
  const contactAddress = config.contactAddress || salon.address || "";
  const mapUrl = config.contactMapUrl || "";
  const hours = config.businessHours || [];

  return (
    <div>
      {/* Header */}
      <div style={{ background: "#111", color: "white", padding: "80px 20px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "3.5rem", margin: 0 }}>Contact Us</h1>
        <p style={{ fontSize: "1.2rem", color: "#aaa", marginTop: 16 }}>Get in touch with {salon.name}</p>
      </div>

      <section className="sf-section">
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          {/* Contact Info */}
          <div>
            <h2 style={{ fontSize: "2rem", marginBottom: 24 }}>Get In Touch</h2>

            {contactPhone && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--sf-accent, #c8a97e)22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📞</div>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#999", marginBottom: 2 }}>Phone</div>
                  <a href={`tel:${contactPhone}`} style={{ fontSize: "1.1rem", fontWeight: 600, color: "inherit", textDecoration: "none" }}>{contactPhone}</a>
                </div>
              </div>
            )}

            {contactEmail && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--sf-accent, #c8a97e)22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>✉️</div>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#999", marginBottom: 2 }}>Email</div>
                  <a href={`mailto:${contactEmail}`} style={{ fontSize: "1.1rem", fontWeight: 600, color: "inherit", textDecoration: "none" }}>{contactEmail}</a>
                </div>
              </div>
            )}

            {contactAddress && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--sf-accent, #c8a97e)22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📍</div>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#999", marginBottom: 2 }}>Address</div>
                  <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>{contactAddress}</span>
                </div>
              </div>
            )}

            {/* Business Hours */}
            {hours.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: "1.1rem", marginBottom: 16 }}>Business Hours</h3>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20 }}>
                  {hours.map((h, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < hours.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                      <span style={{ fontWeight: 500 }}>{h.day || h}</span>
                      <span style={{ color: "#666" }}>{h.hours || "Closed"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: 16 }}>Follow Us</h3>
              <div style={{ display: "flex", gap: 12 }}>
                {config.socialInstagram && <a href={config.socialInstagram} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, textDecoration: "none", transition: "all 0.2s" }}>📸</a>}
                {config.socialFacebook && <a href={config.socialFacebook} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, textDecoration: "none" }}>👤</a>}
                {config.socialYoutube && <a href={config.socialYoutube} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, textDecoration: "none" }}>▶️</a>}
                {config.socialTiktok && <a href={config.socialTiktok} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, textDecoration: "none" }}>🎵</a>}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{ background: "#f8fafc", borderRadius: 16, padding: 32 }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: 8 }}>Send a Message</h2>
            <p style={{ color: "#666", marginBottom: 24 }}>We'll get back to you as soon as possible.</p>

            {submitted ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ marginBottom: 8 }}>Message Sent!</h3>
                <p style={{ color: "#666" }}>Thank you for reaching out. We'll respond shortly.</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "" }); }} style={{ marginTop: 16, padding: "10px 24px", background: "var(--sf-accent, #c8a97e)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#555", marginBottom: 6 }}>Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "1rem" }} placeholder="Your name" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#555", marginBottom: 6 }}>Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "1rem" }} placeholder="your@email.com" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#555", marginBottom: 6 }}>Phone *</label>
                    <input type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "1rem" }} placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#555", marginBottom: 6 }}>Message *</label>
                  <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "1rem", resize: "vertical" }} placeholder="How can we help you?" />
                </div>
                <button type="submit" disabled={submitting} style={{ width: "100%", padding: "14px", background: "var(--sf-accent, #c8a97e)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "1rem", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map */}
      {mapUrl && (
        <section style={{ padding: 0 }}>
          <iframe src={mapUrl} width="100%" height="400" style={{ border: 0 }} allowFullScreen="" loading="lazy" title="Salon Location" />
        </section>
      )}
    </div>
  );
}
