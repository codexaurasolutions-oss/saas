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
    notificationDefaultsText: JSON.stringify({ email: true, sms: false, whatsapp: true }, null, 2),
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
    api.get("/super-admin/settings").then((response) => {
      setForm({
        systemName: response.data?.systemName || "",
        maintenanceMode: Boolean(response.data?.maintenanceMode),
        taxLabel: response.data?.taxLabel || "Tax",
        defaultCurrency: response.data?.defaultCurrency || "INR",
        currencyOptions: Array.isArray(response.data?.currencyOptions) ? response.data.currencyOptions.join(", ") : response.data?.currencyOptions || "INR, USD, AED",
        defaultCountry: response.data?.defaultCountry || "",
        defaultCity: response.data?.defaultCity || "",
        defaultTimezone: response.data?.defaultTimezone || "",
        notificationDefaultsText: JSON.stringify(response.data?.notificationDefaults || { email: true, sms: false, whatsapp: true }, null, 2),
        whatsappNumber: response.data?.whatsappNumber || "",
        smsProviderName: response.data?.smsProviderName || "",
        emailProviderName: response.data?.emailProviderName || "",
        whatsappProviderName: response.data?.whatsappProviderName || "",
        contactEmail: response.data?.contactEmail || "",
        supportEmail: response.data?.supportEmail || "",
        notificationEmail: response.data?.notificationEmail || "",
        termsUrl: response.data?.termsUrl || "/terms",
        privacyUrl: response.data?.privacyUrl || "/privacy",
        demoBookingUrl: response.data?.demoBookingUrl || "/book-demo",
        blogTitle: response.data?.blogTitle || "",
        blogIntro: response.data?.blogIntro || "",
        backupPolicyNote: response.data?.backupPolicyNote || "",
        invoicePrefix: response.data?.invoicePrefix || "INV"
      });
      setLoading(false);
    }).catch((err) => {
      setStatus({ error: formatApiError(err, "Could not load global settings."), success: "" });
      setLoading(false);
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      await api.post("/super-admin/settings", {
        systemName: form.systemName,
        maintenanceMode: form.maintenanceMode,
        taxLabel: form.taxLabel,
        defaultCurrency: form.defaultCurrency,
        currencyOptions: form.currencyOptions.split(",").map((item) => item.trim()).filter(Boolean),
        defaultCountry: form.defaultCountry,
        defaultCity: form.defaultCity,
        defaultTimezone: form.defaultTimezone,
        notificationDefaults: { email: true, sms: true, whatsapp: true },
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
      setStatus({ error: "", success: "Global settings saved." });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save global settings"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Global Settings</h1>
            <p style={{ marginBottom: 0 }}>Control public defaults, provider references, maintenance mode, and system-wide communication settings.</p>
          </div>
          <div className="badge-row">
            <span className="badge">Currency {form.defaultCurrency || "INR"}</span>
            <span className="badge">{form.maintenanceMode ? "Maintenance On" : "Live Platform"}</span>
          </div>
        </div>
      </div>
      {loading ? (
        <PageLoader
          title="Loading platform settings"
          message="Collecting communication defaults, public links, and system controls."
        />
      ) : (
      <div>
        <div className="panel-card" style={{ maxWidth: "100%" }}>
          {status.error && <p className="error-text">{status.error}</p>}
          {status.success && <p className="success-text">{status.success}</p>}
          <form onSubmit={submit} className="form-grid">
            <label>
              <span>System Name</span>
              <input value={form.systemName} placeholder="System name" onChange={(event) => setForm({ ...form, systemName: event.target.value })} />
            </label>
            <label>
              <span>Tax Label</span>
              <input value={form.taxLabel} placeholder="Tax label" onChange={(event) => setForm({ ...form, taxLabel: event.target.value })} />
            </label>
            <label>
              <span>Default Currency</span>
              <input value={form.defaultCurrency} placeholder="Default currency" onChange={(event) => setForm({ ...form, defaultCurrency: event.target.value })} />
            </label>
            <label>
              <span>Currency List (comma separated)</span>
              <input value={form.currencyOptions} placeholder="Currency list" onChange={(event) => setForm({ ...form, currencyOptions: event.target.value })} />
            </label>
            <label>
              <span>Default Country</span>
              <input value={form.defaultCountry} placeholder="Default country" onChange={(event) => setForm({ ...form, defaultCountry: event.target.value })} />
            </label>
            <label>
              <span>Default City</span>
              <input value={form.defaultCity} placeholder="Default city" onChange={(event) => setForm({ ...form, defaultCity: event.target.value })} />
            </label>
            <label>
              <span>Default Timezone</span>
              <input value={form.defaultTimezone} placeholder="Default timezone" onChange={(event) => setForm({ ...form, defaultTimezone: event.target.value })} />
            </label>
            <label>
              <span>WhatsApp Number</span>
              <input value={form.whatsappNumber} placeholder="WhatsApp number" onChange={(event) => setForm({ ...form, whatsappNumber: event.target.value })} />
            </label>
            <label>
              <span>SMS Provider Name</span>
              <input value={form.smsProviderName} placeholder="SMS provider" onChange={(event) => setForm({ ...form, smsProviderName: event.target.value })} />
            </label>
            <label>
              <span>Email Provider Name</span>
              <input value={form.emailProviderName} placeholder="Email provider" onChange={(event) => setForm({ ...form, emailProviderName: event.target.value })} />
            </label>
            <label>
              <span>WhatsApp Provider Name</span>
              <input value={form.whatsappProviderName} placeholder="WhatsApp provider" onChange={(event) => setForm({ ...form, whatsappProviderName: event.target.value })} />
            </label>
            <label>
              <span>Contact Email</span>
              <input value={form.contactEmail} placeholder="Contact email" onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} />
            </label>
            <label>
              <span>Support Email</span>
              <input value={form.supportEmail} placeholder="Support email" onChange={(event) => setForm({ ...form, supportEmail: event.target.value })} />
            </label>
            <label>
              <span>Notification Email</span>
              <input value={form.notificationEmail} placeholder="Notification email" onChange={(event) => setForm({ ...form, notificationEmail: event.target.value })} />
            </label>
            <label>
              <span>Terms URL</span>
              <input value={form.termsUrl} placeholder="Terms URL" onChange={(event) => setForm({ ...form, termsUrl: event.target.value })} />
            </label>
            <label>
              <span>Privacy URL</span>
              <input value={form.privacyUrl} placeholder="Privacy URL" onChange={(event) => setForm({ ...form, privacyUrl: event.target.value })} />
            </label>
            <label>
              <span>Demo Booking URL</span>
              <input value={form.demoBookingUrl} placeholder="Demo booking URL" onChange={(event) => setForm({ ...form, demoBookingUrl: event.target.value })} />
            </label>
            <label>
              <span>Invoice Prefix</span>
              <input value={form.invoicePrefix} placeholder="Invoice Prefix" onChange={(event) => setForm({ ...form, invoicePrefix: event.target.value })} />
            </label>
            <label>
              <span>Blog Title</span>
              <input value={form.blogTitle} placeholder="Blog title" onChange={(event) => setForm({ ...form, blogTitle: event.target.value })} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <span>Blog Introduction Text</span>
              <textarea rows="3" value={form.blogIntro} placeholder="Blog intro" onChange={(event) => setForm({ ...form, blogIntro: event.target.value })} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <span>Backup & Retention Policy Note</span>
              <textarea rows="3" value={form.backupPolicyNote} placeholder="Backup / retention note" onChange={(event) => setForm({ ...form, backupPolicyNote: event.target.value })} />
            </label>
            <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.maintenanceMode} onChange={(event) => setForm({ ...form, maintenanceMode: event.target.checked })} style={{ minHeight: "auto", width: "auto" }} />
              <span>Enable Maintenance Mode</span>
            </label>
            <div style={{ gridColumn: "1 / -1", marginTop: 10 }}>
              <button disabled={saving}>{saving ? "Saving Global Settings..." : "Save Global Settings"}</button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
