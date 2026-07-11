import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import { Settings, MessageSquare, Globe, ShieldAlert, Save } from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
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
      setStatus({ error: "", success: "Settings saved successfully." });
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
            <span className="badge" style={{ background: "#e0e7ff", color: "#4f46e5" }}>{form.defaultCurrency}</span>
            <span className="badge" style={{ background: form.maintenanceMode ? "#fef2f2" : "#ecfdf5", color: form.maintenanceMode ? "#ef4444" : "#10b981", fontWeight: 700 }}>
              {form.maintenanceMode ? "Maintenance Active" : "System Live"}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader title="Loading settings" message="Fetching global config..." />
      ) : (
        <div style={{ display: "flex", gap: 24, background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(15,23,42,0.02)", overflow: "hidden", minHeight: 480 }}>
          {/* Tab Sidebar */}
          <div style={{ width: 240, background: "#f8fafc", borderRight: "1px solid #e2e8f0", padding: "24px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { id: "general", label: "General Settings", icon: Settings },
              { id: "comms", label: "Communications", icon: MessageSquare },
              { id: "content", label: "Content & Links", icon: Globe },
              { id: "system", label: "System & Safety", icon: ShieldAlert }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: isActive ? "1px solid #e2e8f0" : "1px solid transparent",
                    background: isActive ? "white" : "transparent",
                    color: isActive ? "#4f46e5" : "#475569",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: isActive ? "0 4px 12px rgba(15,23,42,0.04)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div style={{ flex: 1, padding: 32, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <form onSubmit={submit} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                {status.error && <div style={{ padding: 12, borderRadius: 10, marginBottom: 20, background: "#fef2f2", color: "#991b1b", fontSize: 13, fontWeight: 500 }}>{status.error}</div>}
                {status.success && <div style={{ padding: 12, borderRadius: 10, marginBottom: 20, background: "#ecfdf5", color: "#065f46", fontSize: 13, fontWeight: 500 }}>{status.success}</div>}

                {/* Tab Content: General */}
                {activeTab === "general" && (
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>General Config</h3>
                    <p style={{ margin: "0 0 24px", fontSize: "0.85rem", color: "#64748b" }}>Specify basic metadata, standard taxation labels, invoice prefixes, and currency defaults.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>System Name</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("systemName", { placeholder: "ReSpark" })} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Tax Label</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("taxLabel", { placeholder: "Tax" })} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Invoice Prefix</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("invoicePrefix", { placeholder: "INV" })} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Default Currency</span>
                        <select style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14, background: "white" }} {...input("defaultCurrency")}>
                          <option value="INR">INR - Indian Rupee</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="AED">AED - UAE Dirham</option>
                          <option value="SAR">SAR - Saudi Riyal</option>
                          <option value="PKR">PKR - Pakistani Rupee</option>
                          <option value="BDT">BDT - Bangladeshi Taka</option>
                          <option value="LKR">LKR - Sri Lankan Rupee</option>
                          <option value="NPR">NPR - Nepalese Rupee</option>
                        </select>
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Currency Options</span>
                        <select multiple style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14, background: "white", minHeight: 80 }} value={form.currencyOptions || []} onChange={(e) => setForm({ ...form, currencyOptions: Array.from(e.target.selectedOptions, (o) => o.value) })}>
                          <option value="INR">INR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="AED">AED</option>
                          <option value="SAR">SAR</option>
                          <option value="PKR">PKR</option>
                          <option value="BDT">BDT</option>
                          <option value="LKR">LKR</option>
                          <option value="NPR">NPR</option>
                        </select>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Hold Ctrl/Cmd to select multiple</span>
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Default Country</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("defaultCountry")} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Default City</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("defaultCity")} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "1 / -1" }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Default Timezone</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("defaultTimezone")} /></label>
                    </div>
                  </div>
                )}

                {/* Tab Content: Comms */}
                {activeTab === "comms" && (
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Communications & Providers</h3>
                    <p style={{ margin: "0 0 24px", fontSize: "0.85rem", color: "#64748b" }}>Manage active notification gateways, provider keys, and internal support routing mailboxes.</p>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                      {[
                        { label: "Email Gateways", checked: form.notificationEmailEnabled, key: "notificationEmailEnabled" },
                        { label: "SMS Dispatchers", checked: form.notificationSmsEnabled, key: "notificationSmsEnabled" },
                        { label: "WhatsApp APIs", checked: form.notificationWhatsappEnabled, key: "notificationWhatsappEnabled" }
                      ].map((item) => (
                        <div 
                          key={item.key}
                          onClick={() => setForm({ ...form, [item.key]: !item.checked })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "white",
                            border: "1px solid #cbd5e1",
                            borderRadius: 12,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>{item.label}</span>
                          <div 
                            style={{
                              width: 36,
                              height: 20,
                              borderRadius: 100,
                              background: item.checked ? "#10b981" : "#cbd5e1",
                              position: "relative",
                              transition: "all 0.25s"
                            }}
                          >
                            <div style={{
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              background: "white",
                              position: "absolute",
                              top: 3,
                              left: item.checked ? 19 : 3,
                              transition: "all 0.25s",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>WhatsApp Number</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("whatsappNumber")} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>SMS Provider</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("smsProviderName")} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Email Provider</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("emailProviderName")} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>WhatsApp Provider</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("whatsappProviderName")} /></label>
                      
                      <label style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "1 / -1" }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Contact Email</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} type="email" {...input("contactEmail")} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Support Email</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} type="email" {...input("supportEmail")} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Notification Email</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} type="email" {...input("notificationEmail")} /></label>
                    </div>
                  </div>
                )}

                {/* Tab Content: Content */}
                {activeTab === "content" && (
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Links & Content Settings</h3>
                    <p style={{ margin: "0 0 24px", fontSize: "0.85rem", color: "#64748b" }}>Manage public website links, legal page references, custom landing titles, and retention policy notices.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Terms URL</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("termsUrl")} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Privacy URL</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("privacyUrl")} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Demo Booking URL</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("demoBookingUrl")} /></label>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Blog Title</span><input style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} {...input("blogTitle")} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Blog Introduction</span><textarea style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "inherit" }} rows="2" value={form.blogIntro} onChange={(e) => setForm({ ...form, blogIntro: e.target.value })} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Backup Policy Note</span><textarea style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "inherit" }} rows="2" value={form.backupPolicyNote} onChange={(e) => setForm({ ...form, backupPolicyNote: e.target.value })} /></label>
                    </div>
                  </div>
                )}

                {/* Tab Content: System */}
                {activeTab === "system" && (
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>System & Safety</h3>
                    <p style={{ margin: "0 0 24px", fontSize: "0.85rem", color: "#64748b" }}>Perform global lockouts, initiate database security rules, and toggle public maintenance screens.</p>
                    
                    <div style={{ padding: 24, border: "1px solid #fca5a5", background: "#fff5f5", borderRadius: 12, display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <ShieldAlert size={24} color="#dc2626" style={{ marginTop: 2 }} />
                        <div>
                          <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700, color: "#991b1b" }}>Emergency Maintenance Lockout</h4>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#b91c1c", lineHeight: 1.5 }}>
                            Enabling maintenance mode suspends all routing actions. All salon owners, POS counters, and client storefront portals will immediately be blocked from operations until this flag is manually cleared.
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ borderTop: "1px solid #fca5a5", paddingTop: 16, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: form.maintenanceMode ? "#dc2626" : "#475569" }}>
                            {form.maintenanceMode ? "🚨 Maintenance Lockout is ACTIVE" : "Toggle Maintenance Mode (Currently Off)"}
                          </span>
                        </div>
                        <div 
                          onClick={() => setForm({ ...form, maintenanceMode: !form.maintenanceMode })}
                          style={{
                            width: 44,
                            height: 24,
                            borderRadius: 100,
                            background: form.maintenanceMode ? "#ef4444" : "#cbd5e1",
                            position: "relative",
                            cursor: "pointer",
                            transition: "all 0.25s"
                          }}
                        >
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: 3,
                            left: form.maintenanceMode ? 23 : 3,
                            transition: "all 0.25s",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button Bar */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 20, marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
                <button 
                  type="submit" 
                  disabled={saving} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8, 
                    minHeight: 40, 
                    padding: "0 24px", 
                    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", 
                    color: "white", 
                    borderRadius: 8, 
                    border: "none", 
                    fontWeight: 700, 
                    fontSize: 13, 
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.15)"
                  }}
                >
                  <Save size={14} />
                  {saving ? "Saving Changes..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
