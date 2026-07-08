import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    systemName: "",
    maintenanceMode: false,
    taxLabel: "Tax",
    defaultCurrency: "INR",
    currencyOptions: "INR, USD, AED",
    defaultCountry: "",
    defaultCity: "",
    defaultTimezone: "",
    notificationEmailEnabled: true,
    notificationSmsEnabled: false,
    notificationWhatsappEnabled: true,
    whatsappNumber: "",
    smsProviderName: "",
    emailProviderName: "",
    whatsappProviderName: "",
    contactEmail: "",
    supportEmail: "",
    notificationEmail: "",
    termsUrl: "/terms",
    privacyUrl: "/privacy",
    demoBookingUrl: "/book-demo",
    blogTitle: "",
    blogIntro: "",
    backupPolicyNote: "",
    invoicePrefix: "INV"
  });

  useEffect(() => {
    api.get("/super-admin/settings").then((res) => {
      const d = res.data || {};
      const notif = d.notificationDefaults || {};
      setForm({
        systemName: d.systemName || "",
        maintenanceMode: Boolean(d.maintenanceMode),
        taxLabel: d.taxLabel || "Tax",
        defaultCurrency: d.defaultCurrency || "INR",
        currencyOptions: Array.isArray(d.currencyOptions) ? d.currencyOptions.join(", ") : d.currencyOptions || "INR, USD, AED",
        defaultCountry: d.defaultCountry || "",
        defaultCity: d.defaultCity || "",
        defaultTimezone: d.defaultTimezone || "",
        notificationEmailEnabled: notif.email !== false,
        notificationSmsEnabled: Boolean(notif.sms),
        notificationWhatsappEnabled: notif.whatsapp !== false,
        whatsappNumber: d.whatsappNumber || "",
        smsProviderName: d.smsProviderName || "",
        emailProviderName: d.emailProviderName || "",
        whatsappProviderName: d.whatsappProviderName || "",
        contactEmail: d.contactEmail || "",
        supportEmail: d.supportEmail || "",
        notificationEmail: d.notificationEmail || "",
        termsUrl: d.termsUrl || "/terms",
        privacyUrl: d.privacyUrl || "/privacy",
        demoBookingUrl: d.demoBookingUrl || "/book-demo",
        blogTitle: d.blogTitle || "",
        blogIntro: d.blogIntro || "",
        backupPolicyNote: d.backupPolicyNote || "",
        invoicePrefix: d.invoicePrefix || "INV"
      });
      setLoading(false);
    }).catch((err) => {
      setStatus({ error: formatApiError(err, "Could not load settings."), success: "" });
      setLoading(false);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (form.maintenanceMode && !window.confirm("Enable maintenance mode? All salon owners will be locked out until you disable it.")) {
      return;
    }
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      await api.post("/super-admin/settings", {
        systemName: form.systemName,
        maintenanceMode: form.maintenanceMode,
        taxLabel: form.taxLabel,
        defaultCurrency: form.defaultCurrency,
        currencyOptions: form.currencyOptions.split(",").map((s) => s.trim()).filter(Boolean),
        defaultCountry: form.defaultCountry,
        defaultCity: form.defaultCity,
        defaultTimezone: form.defaultTimezone,
        notificationDefaults: {
          email: form.notificationEmailEnabled,
          sms: form.notificationSmsEnabled,
          whatsapp: form.notificationWhatsappEnabled
        },
        whatsappNumber: form.whatsappNumber,
        smsProviderName: form.smsProviderName,
        emailProviderName: form.emailProviderName,
        whatsappProviderName: form.whatsappProviderName,
        contactEmail: form.contactEmail,
        supportEmail: form.supportEmail,
        notificationEmail: form.notificationEmail,
        termsUrl: form.termsUrl,
        privacyUrl: form.privacyUrl,
        demoBookingUrl: form.demoBookingUrl,
        blogTitle: form.blogTitle,
        blogIntro: form.blogIntro,
        backupPolicyNote: form.backupPolicyNote,
        invoicePrefix: form.invoicePrefix
      });
      setStatus({ error: "", success: "Settings saved." });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not save settings"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const input = (key, opts = {}) => ({
    value: form[key],
    placeholder: opts.placeholder || "",
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
    ...(opts.type ? { type: opts.type } : {})
  });

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Global Settings</h1>
            <p style={{ marginBottom: 0 }}>System defaults, provider config, maintenance mode, and communication settings.</p>
          </div>
          <div className="badge-row">
            <span className="badge">{form.defaultCurrency}</span>
            <span className="badge">{form.maintenanceMode ? "Maintenance On" : "Live"}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader title="Loading settings" message="Fetching global config..." />
      ) : (
        <div className="panel-card" style={{ maxWidth: "100%" }}>
          {status.error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{status.error}</p>}
          {status.success && <p style={{ color: "#10b981", fontSize: 13, marginBottom: 12 }}>{status.success}</p>}

          <form onSubmit={submit}>
            {/* Section: General */}
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 0 }}>General</h3>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              <label><span>System Name</span><input {...input("systemName", { placeholder: "ReSpark" })} /></label>
              <label><span>Tax Label</span><input {...input("taxLabel", { placeholder: "Tax" })} /></label>
              <label><span>Invoice Prefix</span><input {...input("invoicePrefix", { placeholder: "INV" })} /></label>
              <label><span>Default Currency</span><input {...input("defaultCurrency", { placeholder: "INR" })} /></label>
              <label><span>Currency List (comma separated)</span><input {...input("currencyOptions", { placeholder: "INR, USD, AED" })} /></label>
              <label><span>Default Country</span><input {...input("defaultCountry")} /></label>
              <label><span>Default City</span><input {...input("defaultCity")} /></label>
              <label><span>Default Timezone</span><input {...input("defaultTimezone")} /></label>
            </div>

            {/* Section: Notifications */}
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 0 }}>Notifications</h3>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.notificationEmailEnabled} onChange={(e) => setForm({ ...form, notificationEmailEnabled: e.target.checked })} style={{ minHeight: "auto", width: "auto" }} />
                <span>Email Notifications</span>
              </label>
              <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.notificationSmsEnabled} onChange={(e) => setForm({ ...form, notificationSmsEnabled: e.target.checked })} style={{ minHeight: "auto", width: "auto" }} />
                <span>SMS Notifications</span>
              </label>
              <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.notificationWhatsappEnabled} onChange={(e) => setForm({ ...form, notificationWhatsappEnabled: e.target.checked })} style={{ minHeight: "auto", width: "auto" }} />
                <span>WhatsApp Notifications</span>
              </label>
            </div>

            {/* Section: Providers */}
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 0 }}>Providers</h3>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              <label><span>WhatsApp Number</span><input {...input("whatsappNumber")} /></label>
              <label><span>SMS Provider</span><input {...input("smsProviderName")} /></label>
              <label><span>Email Provider</span><input {...input("emailProviderName")} /></label>
              <label><span>WhatsApp Provider</span><input {...input("whatsappProviderName")} /></label>
            </div>

            {/* Section: Contact Emails */}
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 0 }}>Contact Emails</h3>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              <label><span>Contact Email</span><input type="email" {...input("contactEmail")} /></label>
              <label><span>Support Email</span><input type="email" {...input("supportEmail")} /></label>
              <label><span>Notification Email</span><input type="email" {...input("notificationEmail")} /></label>
            </div>

            {/* Section: Public Links */}
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 0 }}>Public Links</h3>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              <label><span>Terms URL</span><input {...input("termsUrl")} /></label>
              <label><span>Privacy URL</span><input {...input("privacyUrl")} /></label>
              <label><span>Demo Booking URL</span><input {...input("demoBookingUrl")} /></label>
            </div>

            {/* Section: Blog */}
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 0 }}>Blog</h3>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              <label><span>Blog Title</span><input {...input("blogTitle")} /></label>
              <label style={{ gridColumn: "1 / -1" }}><span>Blog Introduction</span><textarea rows="3" value={form.blogIntro} onChange={(e) => setForm({ ...form, blogIntro: e.target.value })} /></label>
            </div>

            {/* Section: Policy */}
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 0 }}>Policy</h3>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              <label style={{ gridColumn: "1 / -1" }}><span>Backup & Retention Note</span><textarea rows="3" value={form.backupPolicyNote} onChange={(e) => setForm({ ...form, backupPolicyNote: e.target.value })} /></label>
            </div>

            {/* Section: Maintenance */}
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 0 }}>System</h3>
            <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })} style={{ minHeight: "auto", width: "auto" }} />
              <span style={{ fontWeight: 600, color: form.maintenanceMode ? "#dc2626" : "#334155" }}>Enable Maintenance Mode</span>
              {form.maintenanceMode && <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 600 }}>(All salon owners will be locked out)</span>}
            </label>

            <button disabled={saving} style={{ width: "100%" }}>{saving ? "Saving..." : "Save Settings"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
