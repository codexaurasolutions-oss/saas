import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import "./WebsiteEditorPage.css";

const DEFAULT_SECTIONS = [
  { id: "hero", type: "hero", label: "Hero Banner", icon: "\u{1F3A8}", enabled: true, locked: true },
  { id: "about", type: "about", label: "About Us", icon: "\u{2139}\uFE0F", enabled: true, locked: true },
  { id: "gallery", type: "gallery", label: "Gallery", icon: "\u{1F5BC}\uFE0F", enabled: true, locked: true },
  { id: "services", type: "services", label: "Services & Products", icon: "\u{2728}", enabled: true, locked: true },
  { id: "testimonials", type: "testimonials", label: "Client Reviews", icon: "\u{2B50}", enabled: true, locked: false },
  { id: "banner", type: "banner", label: "Promotional Banner", icon: "\u{1F4E3}", enabled: false, locked: false },
  { id: "cta", type: "cta", label: "Call to Action", icon: "\u{1F446}", enabled: false, locked: false },
  { id: "contact", type: "contact", label: "Contact Info", icon: "\u{1F4DE}", enabled: false, locked: false },
  { id: "hours", type: "hours", label: "Business Hours", icon: "\u{23F0}", enabled: false, locked: false },
  { id: "social", type: "social", label: "Social Links", icon: "\u{1F310}", enabled: false, locked: false }
];

const ADDABLE_TYPES = [
  { type: "banner", label: "Promotional Banner", icon: "\u{1F4E3}" },
  { type: "cta", label: "Call to Action", icon: "\u{1F446}" },
  { type: "contact", label: "Contact Info", icon: "\u{1F4DE}" },
  { type: "hours", label: "Business Hours", icon: "\u{23F0}" },
  { type: "social", label: "Social Links", icon: "\u{1F310}" }
];

const COLOR_PRESETS = [
  "#c8a97e", "#b08d57", "#d4a574", "#e8c99b", "#a67c52",
  "#1a1a2e", "#16213e", "#0f3460", "#2b2d42", "#1b1b2f",
  "#e94560", "#c2185b", "#d81b60", "#ad1457", "#880e4f",
  "#533483", "#7b1fa2", "#6a1b9a", "#4a148c", "#311b92",
  "#0077b6", "#023e8a", "#001d3d", "#006d77", "#0096c7",
  "#2d6a4f", "#40916c", "#52b788", "#6b705c", "#a5a58d"
];

const CARD_SHAPES = [
  { id: "rounded", label: "Rounded", radius: "16px" },
  { id: "square", label: "Sharp", radius: "4px" },
  { id: "circle", label: "Circle", radius: "50%" },
  { id: "pill", label: "Pill", radius: "999px" }
];

const emptyConfig = {
  salonName: "", logoUrl: "",
  heroTitle: "Elevate Your Beauty Experience",
  heroSubtitle: "Discover premium salon services and exclusive products curated just for you.",
  heroImage: "", heroBtn1Text: "Shop Collections", heroBtn1Link: "collections",
  heroBtn2Text: "Book Appointment", heroBtn2Link: "book",
  aboutTitle: "", aboutDescription: "", aboutImage: "", aboutMission: "", aboutVision: "",
  galleryImages: [],
  contactPhone: "", contactEmail: "", contactAddress: "", contactMapUrl: "",
  socialFacebook: "", socialInstagram: "", socialYoutube: "", socialTiktok: "", socialTwitter: "",
  businessHours: [
    { day: "Mon-Fri", hours: "9:00 AM - 8:00 PM" },
    { day: "Saturday", hours: "10:00 AM - 6:00 PM" },
    { day: "Sunday", hours: "Closed" }
  ],
  ctaTitle: "Ready to Transform Your Look?", ctaSubtitle: "Book your appointment today and experience the difference.", ctaBtnText: "Book Now", ctaBtnLink: "book", ctaImage: "",
  testimonials: [],
  primaryColor: "#c8a97e", secondaryColor: "#111111",
  bannerImage: "", bannerTitle: "", bannerSubtitle: "", bannerBtnText: "", bannerBtnLink: "",
  cardShape: "rounded", footerText: ""
};

function Field({ label, children, hint }) {
  return (
    <div className="we-field">
      {label && <label className="we-label">{label}</label>}
      {children}
      {hint && <span className="we-hint">{hint}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, ...rest }) {
  return <input className="we-input" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} {...rest} />;
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea className="we-input we-textarea" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
}

function ColorField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label}>
      <div className="we-color-row">
        <div className="we-color-swatch-wrap" onClick={() => setOpen(!open)}>
          <div className="we-color-swatch" style={{ background: value || "#ccc" }} />
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
        <input type="color" className="we-color-native" value={value || "#000000"} onChange={e => onChange(e.target.value)} />
        <input className="we-input we-color-hex" value={value || ""} onChange={e => onChange(e.target.value)} placeholder="#c8a97e" />
      </div>
      {open && (
        <div className="we-color-palette">
          {COLOR_PRESETS.map(c => (
            <button key={c} className="we-color-dot" style={{ background: c, outline: value === c ? "2px solid #111" : "none", outlineOffset: 2 }} onClick={() => { onChange(c); setOpen(false); }} />
          ))}
        </div>
      )}
    </Field>
  );
}

function ImageField({ label, value, onChange, hint }) {
  const ref = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <Field label={label} hint={hint}>
      <div className={`we-image-drop ${dragOver ? "drag-over" : ""}`} onClick={() => ref.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}>
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
        {value ? (
          <img src={value} alt="" className="we-image-preview" />
        ) : (
          <div className="we-image-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
            <span>Click or drag image</span>
          </div>
        )}
      </div>
      <input className="we-input" value={value || ""} onChange={e => onChange(e.target.value)} placeholder="https://... or paste URL" style={{ marginTop: 6 }} />
    </Field>
  );
}

function SectionBlock({ icon, title, badge, children, defaultOpen = true, className = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`we-section ${className} ${open ? "open" : ""}`}>
      <button className="we-section-header" onClick={() => setOpen(!open)}>
        <div className="we-section-header-left">
          <span className="we-section-icon">{icon}</span>
          <span className="we-section-title">{title}</span>
          {badge && <span className="we-section-badge">{badge}</span>}
        </div>
        <svg className={`we-section-chevron ${open ? "rotated" : ""}`} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
      {open && <div className="we-section-body">{children}</div>}
    </div>
  );
}

function LivePreview({ config, sections, device }) {
  const radius = CARD_SHAPES.find(s => s.id === config.cardShape)?.radius || "16px";
  const accent = config.primaryColor || "#c8a97e";
  const textColor = config.secondaryColor || "#111111";
  const enabledSections = sections.filter(s => s.enabled);

  const previewStyle = useMemo(() => ({
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: textColor,
    background: "#ffffff",
    margin: 0,
    padding: 0,
    overflowY: "auto",
    overflowX: "hidden",
    width: "100%",
    height: "100%",
  }), [textColor]);

  const renderHero = () => (
    <div style={{ position: "relative", background: config.heroImage ? `url(${config.heroImage}) center/cover` : `linear-gradient(135deg, ${accent}22, ${accent}11)`, padding: device === "mobile" ? "40px 16px 32px" : "60px 40px 50px", textAlign: "center" }}>
      {config.heroImage && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: device === "mobile" ? 22 : 32, fontWeight: 800, margin: "0 0 12px", color: config.heroImage ? "#fff" : textColor, lineHeight: 1.2 }}>{config.heroTitle || "Elevate Your Beauty"}</h1>
        <p style={{ fontSize: device === "mobile" ? 13 : 15, color: config.heroImage ? "#ffffffcc" : "#666", margin: "0 0 24px", lineHeight: 1.6 }}>{config.heroSubtitle || "Premium salon services"}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {config.heroBtn1Text && <span style={{ padding: "10px 24px", background: accent, color: "#fff", borderRadius: radius, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{config.heroBtn1Text}</span>}
          {config.heroBtn2Text && <span style={{ padding: "10px 24px", background: "transparent", color: config.heroImage ? "#fff" : accent, border: `2px solid ${config.heroImage ? "#fff" : accent}`, borderRadius: radius, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{config.heroBtn2Text}</span>}
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div style={{ padding: device === "mobile" ? "32px 16px" : "50px 40px", display: "flex", gap: 30, flexDirection: config.aboutImage ? "row" : "column", alignItems: "center" }}>
      {config.aboutImage && <img src={config.aboutImage} alt="" style={{ width: device === "mobile" ? "100%" : "45%", borderRadius: radius, objectFit: "cover", maxHeight: 200 }} />}
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: device === "mobile" ? 20 : 24, fontWeight: 700, margin: "0 0 12px" }}>{config.aboutTitle || "About Us"}</h2>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 16px" }}>{config.aboutDescription || "Tell your salon story..."}</p>
        {(config.aboutMission || config.aboutVision) && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {config.aboutMission && <div style={{ flex: 1, minWidth: 120, padding: 12, background: `${accent}11`, borderRadius: radius }}><strong style={{ fontSize: 12, color: accent }}>Mission</strong><p style={{ fontSize: 13, margin: "4px 0 0", color: "#555" }}>{config.aboutMission}</p></div>}
            {config.aboutVision && <div style={{ flex: 1, minWidth: 120, padding: 12, background: `${accent}11`, borderRadius: radius }}><strong style={{ fontSize: 12, color: accent }}>Vision</strong><p style={{ fontSize: 13, margin: "4px 0 0", color: "#555" }}>{config.aboutVision}</p></div>}
          </div>
        )}
      </div>
    </div>
  );

  const renderGallery = () => (
    <div style={{ padding: device === "mobile" ? "32px 16px" : "50px 40px" }}>
      <h2 style={{ fontSize: device === "mobile" ? 20 : 24, fontWeight: 700, margin: "0 0 16px", textAlign: "center" }}>Gallery</h2>
      <div style={{ display: "grid", gridTemplateColumns: device === "mobile" ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 8 }}>
        {(config.galleryImages || []).slice(0, 6).map((img, i) => (
          <div key={i} style={{ aspectRatio: "1", borderRadius: radius, overflow: "hidden" }}><img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
        ))}
        {(!config.galleryImages || config.galleryImages.length === 0) && <div style={{ gridColumn: "1/-1", padding: 30, background: "#f9fafb", borderRadius: radius, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No gallery images yet</div>}
      </div>
    </div>
  );

  const renderServices = () => (
    <div style={{ padding: device === "mobile" ? "32px 16px" : "50px 40px", background: "#f9fafb" }}>
      <h2 style={{ fontSize: device === "mobile" ? 20 : 24, fontWeight: 700, margin: "0 0 16px", textAlign: "center" }}>Services & Products</h2>
      <div style={{ display: "grid", gridTemplateColumns: device === "mobile" ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: "#fff", borderRadius: radius, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.06)", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${accent}22`, margin: "0 auto 12px" }} />
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Service {i}</div>
            <div style={{ fontSize: 12, color: "#999" }}>Auto-populated</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTestimonials = () => (
    <div style={{ padding: device === "mobile" ? "32px 16px" : "50px 40px" }}>
      <h2 style={{ fontSize: device === "mobile" ? 20 : 24, fontWeight: 700, margin: "0 0 16px", textAlign: "center" }}>Client Reviews</h2>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {(config.testimonials || []).length > 0 ? config.testimonials.map((t, i) => (
          <div key={i} style={{ minWidth: device === "mobile" ? 220 : 260, padding: 20, background: "#f9fafb", borderRadius: radius, flexShrink: 0 }}>
            <div style={{ color: accent, fontSize: 16, marginBottom: 8 }}>{"\u2605".repeat(t.rating || 5)}</div>
            <p style={{ fontSize: 13, color: "#555", margin: "0 0 12px", lineHeight: 1.5 }}>"{t.text || "Great experience!"}"</p>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.author || "Client"}</div>
          </div>
        )) : <div style={{ width: "100%", padding: 30, background: "#f9fafb", borderRadius: radius, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No reviews yet</div>}
      </div>
    </div>
  );

  const renderBanner = () => config.bannerTitle ? (
    <div style={{ padding: device === "mobile" ? "32px 16px" : "50px 40px", background: config.bannerImage ? `url(${config.bannerImage}) center/cover` : `${accent}15`, textAlign: "center" }}>
      <h2 style={{ fontSize: device === "mobile" ? 20 : 28, fontWeight: 700, margin: "0 0 8px", color: config.bannerImage ? "#fff" : textColor }}>{config.bannerTitle}</h2>
      {config.bannerSubtitle && <p style={{ fontSize: 14, color: config.bannerImage ? "#ffffffcc" : "#666", margin: "0 0 16px" }}>{config.bannerSubtitle}</p>}
      {config.bannerBtnText && <span style={{ display: "inline-block", padding: "10px 24px", background: accent, color: "#fff", borderRadius: radius, fontWeight: 600, fontSize: 13 }}>{config.bannerBtnText}</span>}
    </div>
  ) : null;

  const renderCTA = () => (
    <div style={{ padding: device === "mobile" ? "32px 16px" : "50px 40px", background: config.ctaImage ? `url(${config.ctaImage}) center/cover` : `${accent}10`, textAlign: "center" }}>
      <h2 style={{ fontSize: device === "mobile" ? 20 : 24, fontWeight: 700, margin: "0 0 8px", color: config.ctaImage ? "#fff" : textColor }}>{config.ctaTitle || "Ready to Transform?"}</h2>
      {config.ctaSubtitle && <p style={{ fontSize: 14, color: config.ctaImage ? "#ffffffcc" : "#666", margin: "0 0 16px" }}>{config.ctaSubtitle}</p>}
      {config.ctaBtnText && <span style={{ display: "inline-block", padding: "10px 24px", background: accent, color: "#fff", borderRadius: radius, fontWeight: 600, fontSize: 13 }}>{config.ctaBtnText}</span>}
    </div>
  );

  const renderContact = () => (
    <div style={{ padding: device === "mobile" ? "32px 16px" : "50px 40px", background: "#f9fafb" }}>
      <h2 style={{ fontSize: device === "mobile" ? 20 : 24, fontWeight: 700, margin: "0 0 16px", textAlign: "center" }}>Contact Us</h2>
      <div style={{ display: "grid", gridTemplateColumns: device === "mobile" ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
        {config.contactPhone && <div style={{ padding: 16, background: "#fff", borderRadius: radius, textAlign: "center" }}><div style={{ fontSize: 20, marginBottom: 8 }}>&#128222;</div><div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Phone</div><div style={{ fontSize: 13, color: "#666" }}>{config.contactPhone}</div></div>}
        {config.contactEmail && <div style={{ padding: 16, background: "#fff", borderRadius: radius, textAlign: "center" }}><div style={{ fontSize: 20, marginBottom: 8 }}>&#9993;</div><div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Email</div><div style={{ fontSize: 13, color: "#666" }}>{config.contactEmail}</div></div>}
        {config.contactAddress && <div style={{ padding: 16, background: "#fff", borderRadius: radius, textAlign: "center" }}><div style={{ fontSize: 20, marginBottom: 8 }}>&#128205;</div><div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Address</div><div style={{ fontSize: 13, color: "#666" }}>{config.contactAddress}</div></div>}
      </div>
    </div>
  );

  const renderHours = () => (
    <div style={{ padding: device === "mobile" ? "32px 16px" : "50px 40px" }}>
      <h2 style={{ fontSize: device === "mobile" ? 20 : 24, fontWeight: 700, margin: "0 0 16px", textAlign: "center" }}>Business Hours</h2>
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        {(config.businessHours || []).map((bh, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee", fontSize: 14 }}>
            <span style={{ fontWeight: 600 }}>{bh.day}</span><span style={{ color: "#666" }}>{bh.hours}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSocial = () => {
    const links = [
      { label: "Instagram", url: config.socialInstagram },
      { label: "Facebook", url: config.socialFacebook },
      { label: "YouTube", url: config.socialYoutube },
      { label: "TikTok", url: config.socialTiktok },
      { label: "Twitter", url: config.socialTwitter },
    ].filter(l => l.url);
    if (links.length === 0) return null;
    return (
      <div style={{ padding: device === "mobile" ? "32px 16px" : "50px 40px", textAlign: "center" }}>
        <h2 style={{ fontSize: device === "mobile" ? 20 : 24, fontWeight: 700, margin: "0 0 16px" }}>Follow Us</h2>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {links.map((l, i) => (
            <span key={i} style={{ padding: "8px 16px", background: accent, color: "#fff", borderRadius: radius, fontSize: 13, fontWeight: 600 }}>{l.label}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderSection = (sec) => {
    switch (sec.type) {
      case "hero": return renderHero();
      case "about": return renderAbout();
      case "gallery": return renderGallery();
      case "services": return renderServices();
      case "testimonials": return renderTestimonials();
      case "banner": return renderBanner();
      case "cta": return renderCTA();
      case "contact": return renderContact();
      case "hours": return renderHours();
      case "social": return renderSocial();
      default: return null;
    }
  };

  return (
    <div style={previewStyle}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 10, background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
        {config.logoUrl ? <img src={config.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} /> : <div style={{ width: 28, height: 28, borderRadius: 6, background: accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>{(config.salonName || "S")[0]}</div>}
        <span style={{ fontWeight: 700, fontSize: 14 }}>{config.salonName || "Your Salon"}</span>
      </div>
      {enabledSections.length > 0 ? enabledSections.map(sec => (
        <div key={sec.id}>{renderSection(sec)}</div>
      )) : (
        <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>Enable sections to see preview</div>
      )}
      <div style={{ padding: "20px 16px", background: textColor, color: "#fff", textAlign: "center", fontSize: 12 }}>
        {config.footerText || `\u00A9 ${new Date().getFullYear()} ${config.salonName || "Salon"}. All rights reserved.`}
      </div>
    </div>
  );
}

export default function WebsiteEditorPage() {
  const { auth } = useAuth();
  const [config, setConfig] = useState(emptyConfig);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [activeTab, setActiveTab] = useState("sections");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const slug = auth?.membership?.salonSlug || auth?.membership?.salon?.slug || "";

  useEffect(() => {
    let active = true;
    api.get("/owner/website/config").then((res) => {
      if (!active) return;
      const d = res.data || {};
      setConfig(prev => {
        const next = { ...prev };
        Object.keys(prev).forEach(k => { if (d[k] !== undefined && d[k] !== null && d[k] !== "") next[k] = d[k]; });
        return next;
      });
      if (d.sections && Array.isArray(d.sections) && d.sections.length > 0) {
        const merged = d.sections.map(s => {
          const def = DEFAULT_SECTIONS.find(ds => ds.type === s.type);
          return { ...def, ...s };
        });
        const newTypes = DEFAULT_SECTIONS.filter(ds => !merged.find(m => m.type === ds.type));
        setSections([...merged, ...newTypes]);
      }
    }).catch(() => {
      if (!active) return;
      setStatus({ error: "Could not load editor", success: "" });
    });
    return () => { active = false; };
  }, []);

  const update = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setStatus({ error: "", success: "" });
    try {
      await api.post("/owner/website/config", { ...config, sections });
      setStatus({ error: "", success: "Published!" });
      setTimeout(() => setStatus({ error: "", success: "" }), 3000);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Publish failed"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (id) => setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));

  const addSection = (type) => {
    if (sections.find(s => s.type === type)) return;
    const info = ADDABLE_TYPES.find(t => t.type === type);
    setSections(prev => [...prev, { id: `${type}-${Date.now()}`, type, label: info?.label || type, icon: info?.icon || "\u{1F4D6}", enabled: true, locked: false }]);
  };

  const removeSection = (id) => setSections(prev => prev.filter(s => s.id !== id));

  const handleDragStart = (idx) => { dragItem.current = idx; };
  const handleDragEnter = (idx) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from !== null && to !== null && from !== to) {
      const copy = [...sections];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      setSections(copy);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const enabledCount = sections.filter(s => s.enabled).length;

  const renderSectionEditor = () => {
    return (
      <>
        {sections.find(s => s.type === "hero")?.enabled && (
          <SectionBlock icon="\u{1F3A8}" title="Hero Banner" badge="Main" defaultOpen={true}>
            <Field label="Headline"><Input value={config.heroTitle} onChange={v => update("heroTitle", v)} placeholder="Your headline here" /></Field>
            <Field label="Subtitle"><Textarea value={config.heroSubtitle} onChange={v => update("heroSubtitle", v)} placeholder="Your subtitle..." rows={2} /></Field>
            <ImageField label="Background Image" value={config.heroImage} onChange={v => update("heroImage", v)} hint="1920 x 800" />
            <div className="we-row-2">
              <Field label="Button 1"><Input value={config.heroBtn1Text} onChange={v => update("heroBtn1Text", v)} placeholder="Shop Now" /></Field>
              <Field label="Link"><Input value={config.heroBtn1Link} onChange={v => update("heroBtn1Link", v)} placeholder="collections" /></Field>
            </div>
            <div className="we-row-2">
              <Field label="Button 2"><Input value={config.heroBtn2Text} onChange={v => update("heroBtn2Text", v)} placeholder="Book Now" /></Field>
              <Field label="Link"><Input value={config.heroBtn2Link} onChange={v => update("heroBtn2Link", v)} placeholder="book" /></Field>
            </div>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "about")?.enabled && (
          <SectionBlock icon="\u{2139}\uFE0F" title="About Us" defaultOpen={false}>
            <Field label="Title"><Input value={config.aboutTitle} onChange={v => update("aboutTitle", v)} placeholder="About Our Salon" /></Field>
            <Field label="Description"><Textarea value={config.aboutDescription} onChange={v => update("aboutDescription", v)} rows={3} placeholder="Tell your story..." /></Field>
            <div className="we-row-2">
              <Field label="Mission"><Textarea value={config.aboutMission} onChange={v => update("aboutMission", v)} rows={2} /></Field>
              <Field label="Vision"><Textarea value={config.aboutVision} onChange={v => update("aboutVision", v)} rows={2} /></Field>
            </div>
            <ImageField label="Image" value={config.aboutImage} onChange={v => update("aboutImage", v)} hint="800 x 600" />
          </SectionBlock>
        )}

        {sections.find(s => s.type === "gallery")?.enabled && (
          <SectionBlock icon="\u{1F5BC}\uFE0F" title="Photo Gallery" badge={`${(config.galleryImages || []).length} photos`} defaultOpen={false}>
            <div className="we-gallery-grid">
              {(config.galleryImages || []).map((img, idx) => (
                <div key={idx} className="we-gallery-thumb">
                  <img src={img} alt="" />
                  <button className="we-gallery-remove" onClick={() => update("galleryImages", config.galleryImages.filter((_, i) => i !== idx))}>&times;</button>
                </div>
              ))}
              <label className="we-gallery-add">
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => update("galleryImages", [...(config.galleryImages || []), ev.target.result]);
                  reader.readAsDataURL(file);
                }} />
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="10" y1="4" x2="10" y2="16" /><line x1="4" y1="10" x2="16" y2="10" /></svg>
              </label>
            </div>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "services")?.enabled && (
          <SectionBlock icon="\u{2728}" title="Services & Products" badge="Auto" defaultOpen={false}>
            <div className="we-info-box">Auto-populated from your POS and Inventory.</div>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "testimonials")?.enabled && (
          <SectionBlock icon="\u{2B50}" title="Client Reviews" badge={`${(config.testimonials || []).length}`} defaultOpen={false}>
            {(config.testimonials || []).map((t, idx) => (
              <div key={idx} className="we-review-item">
                <div className="we-review-header">
                  <span className="we-review-num">#{idx + 1}</span>
                  <button className="we-review-delete" onClick={() => update("testimonials", config.testimonials.filter((_, i) => i !== idx))}>&times;</button>
                </div>
                <Field label="Author"><Input value={t.author} onChange={v => { const c = [...config.testimonials]; c[idx] = { ...c[idx], author: v }; update("testimonials", c); }} placeholder="John D." /></Field>
                <Field label="Review"><Textarea value={t.text} onChange={v => { const c = [...config.testimonials]; c[idx] = { ...c[idx], text: v }; update("testimonials", c); }} rows={2} /></Field>
                <Field label="Rating">
                  <div className="we-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} className={`we-star ${(t.rating || 5) >= star ? "active" : ""}`} onClick={() => { const c = [...config.testimonials]; c[idx] = { ...c[idx], rating: star }; update("testimonials", c); }}>&#9733;</button>
                    ))}
                  </div>
                </Field>
              </div>
            ))}
            <button className="we-add-btn" onClick={() => update("testimonials", [...(config.testimonials || []), { author: "", text: "", rating: 5 }])}>+ Add Review</button>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "banner")?.enabled && (
          <SectionBlock icon="\u{1F4E3}" title="Promotional Banner" defaultOpen={false}>
            <Field label="Title"><Input value={config.bannerTitle} onChange={v => update("bannerTitle", v)} placeholder="Summer Sale!" /></Field>
            <Field label="Subtitle"><Textarea value={config.bannerSubtitle} onChange={v => update("bannerSubtitle", v)} rows={2} /></Field>
            <ImageField label="Banner Image" value={config.bannerImage} onChange={v => update("bannerImage", v)} hint="1200 x 500" />
            <div className="we-row-2">
              <Field label="Button"><Input value={config.bannerBtnText} onChange={v => update("bannerBtnText", v)} /></Field>
              <Field label="Link"><Input value={config.bannerBtnLink} onChange={v => update("bannerBtnLink", v)} /></Field>
            </div>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "cta")?.enabled && (
          <SectionBlock icon="\u{1F446}" title="Call to Action" defaultOpen={false}>
            <Field label="Title"><Input value={config.ctaTitle} onChange={v => update("ctaTitle", v)} placeholder="Ready to Transform?" /></Field>
            <Field label="Subtitle"><Textarea value={config.ctaSubtitle} onChange={v => update("ctaSubtitle", v)} rows={2} /></Field>
            <div className="we-row-2">
              <Field label="Button"><Input value={config.ctaBtnText} onChange={v => update("ctaBtnText", v)} /></Field>
              <Field label="Link"><Input value={config.ctaBtnLink} onChange={v => update("ctaBtnLink", v)} /></Field>
            </div>
            <ImageField label="Background" value={config.ctaImage} onChange={v => update("ctaImage", v)} hint="1200 x 500" />
          </SectionBlock>
        )}

        {sections.find(s => s.type === "contact")?.enabled && (
          <SectionBlock icon="\u{1F4DE}" title="Contact Info" defaultOpen={false}>
            <Field label="Phone"><Input value={config.contactPhone} onChange={v => update("contactPhone", v)} placeholder="+91 98765 43210" /></Field>
            <Field label="Email"><Input value={config.contactEmail} onChange={v => update("contactEmail", v)} placeholder="info@salon.com" /></Field>
            <Field label="Address"><Textarea value={config.contactAddress} onChange={v => update("contactAddress", v)} rows={2} /></Field>
            <Field label="Google Maps URL"><Input value={config.contactMapUrl} onChange={v => update("contactMapUrl", v)} placeholder="https://maps.google.com/..." /></Field>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "hours")?.enabled && (
          <SectionBlock icon="\u{23F0}" title="Business Hours" defaultOpen={false}>
            {(config.businessHours || []).map((bh, idx) => (
              <div key={idx} className="we-hours-row">
                <Input value={bh.day} onChange={v => { const c = [...config.businessHours]; c[idx] = { ...c[idx], day: v }; update("businessHours", c); }} placeholder="Monday" />
                <Input value={bh.hours} onChange={v => { const c = [...config.businessHours]; c[idx] = { ...c[idx], hours: v }; update("businessHours", c); }} placeholder="9AM - 5PM" />
                <button className="we-hours-remove" onClick={() => update("businessHours", config.businessHours.filter((_, i) => i !== idx))}>&times;</button>
              </div>
            ))}
            <button className="we-add-btn" onClick={() => update("businessHours", [...(config.businessHours || []), { day: "", hours: "" }])}>+ Add Day</button>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "social")?.enabled && (
          <SectionBlock icon="\u{1F310}" title="Social Links" defaultOpen={false}>
            <Field label="Instagram"><Input value={config.socialInstagram} onChange={v => update("socialInstagram", v)} placeholder="@salon" /></Field>
            <Field label="Facebook"><Input value={config.socialFacebook} onChange={v => update("socialFacebook", v)} placeholder="https://..." /></Field>
            <Field label="YouTube"><Input value={config.socialYoutube} onChange={v => update("socialYoutube", v)} placeholder="https://..." /></Field>
            <Field label="TikTok"><Input value={config.socialTiktok} onChange={v => update("socialTiktok", v)} placeholder="@salon" /></Field>
            <Field label="Twitter"><Input value={config.socialTwitter} onChange={v => update("socialTwitter", v)} placeholder="@salon" /></Field>
          </SectionBlock>
        )}
      </>
    );
  };

  return (
    <div className="we-root">
      <div className="we-sidebar">
        <div className="we-sidebar-header">
          <div className="we-sidebar-title">
            <h2>Website Editor</h2>
            <span className="we-sidebar-slug">{config.salonName || "Salon"} &mdash; {slug}</span>
          </div>
          <button className="we-publish-btn" onClick={handleSave} disabled={saving}>
            {saving ? <span className="we-spinner" /> : null}
            {saving ? "Publishing..." : "Publish"}
          </button>
        </div>

        {status.error && <div className="we-toast we-toast-error">{status.error}</div>}
        {status.success && <div className="we-toast we-toast-success">{status.success}</div>}

        <div className="we-tabs">
          <button className={`we-tab ${activeTab === "sections" ? "active" : ""}`} onClick={() => setActiveTab("sections")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="14" height="4" rx="1" /><rect x="1" y="7" width="14" height="4" rx="1" /><rect x="1" y="13" width="14" height="2" rx="1" /></svg>
            Sections
          </button>
          <button className={`we-tab ${activeTab === "design" ? "active" : ""}`} onClick={() => setActiveTab("design")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2" /></svg>
            Design
          </button>
        </div>

        <div className="we-sidebar-scroll">
          {activeTab === "sections" ? (
            <div className="we-tab-content">
              <div className="we-section-list-header">
                <span>Section Order</span>
                <span className="we-section-count">{enabledCount} active</span>
              </div>
              <div className="we-section-list">
                {sections.map((sec, idx) => (
                  <div key={sec.id} className={`we-section-item ${!sec.enabled ? "disabled" : ""}`} draggable onDragStart={() => handleDragStart(idx)} onDragEnter={() => handleDragEnter(idx)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}>
                    <span className="we-drag-handle">&#9776;</span>
                    <span className="we-section-item-icon">{sec.icon}</span>
                    <span className="we-section-item-label">{sec.label}</span>
                    <button className={`we-toggle ${sec.enabled ? "on" : ""}`} onClick={() => toggleSection(sec.id)}>
                      <span className="we-toggle-knob" />
                    </button>
                    {!sec.locked && <button className="we-remove-btn" onClick={() => removeSection(sec.id)}>&times;</button>}
                  </div>
                ))}
              </div>

              <div className="we-add-section-header">Add Section</div>
              <div className="we-add-section-grid">
                {ADDABLE_TYPES.filter(t => !sections.find(s => s.type === t.type)).map(t => (
                  <button key={t.type} className="we-add-section-btn" onClick={() => addSection(t.type)}>
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>

              <div className="we-divider" />

              {renderSectionEditor()}

              <SectionBlock icon="\u{1F4DD}" title="Footer" defaultOpen={false}>
                <Field label="Footer Text"><Textarea value={config.footerText} onChange={v => update("footerText", v)} rows={2} placeholder="All rights reserved..." /></Field>
              </SectionBlock>
            </div>
          ) : (
            <div className="we-tab-content">
              <SectionBlock icon="\u{1F3A8}" title="Colors & Branding">
                <div className="we-color-grid">
                  <ColorField label="Accent / Buttons" value={config.primaryColor} onChange={v => update("primaryColor", v)} />
                  <ColorField label="Text / Headings" value={config.secondaryColor} onChange={v => update("secondaryColor", v)} />
                </div>
              </SectionBlock>

              <SectionBlock icon="\u{25A0}" title="Card Style" defaultOpen={false}>
                <div className="we-shape-grid">
                  {CARD_SHAPES.map(shape => (
                    <button key={shape.id} className={`we-shape-btn ${config.cardShape === shape.id ? "selected" : ""}`} onClick={() => update("cardShape", shape.id)}>
                      <div className="we-shape-preview" style={{ borderRadius: shape.radius, background: config.primaryColor || "#c8a97e" }} />
                      <span>{shape.label}</span>
                    </button>
                  ))}
                </div>
              </SectionBlock>

              <SectionBlock icon="\u{1F3E2}" title="Salon Identity" defaultOpen={false}>
                <Field label="Salon Name"><Input value={config.salonName} onChange={v => update("salonName", v)} placeholder="Your Salon" /></Field>
                <ImageField label="Logo" value={config.logoUrl} onChange={v => update("logoUrl", v)} hint="200 x 200" />
              </SectionBlock>
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div className="we-preview-area">
        <div className="we-preview-toolbar">
          <div className="we-device-toggle">
            <button className={`we-device-btn ${previewDevice === "desktop" ? "active" : ""}`} onClick={() => setPreviewDevice("desktop")}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="16" height="12" rx="1.5" /><line x1="5" y1="16" x2="13" y2="16" /></svg>
              Desktop
            </button>
            <button className={`we-device-btn ${previewDevice === "mobile" ? "active" : ""}`} onClick={() => setPreviewDevice("mobile")}>
              <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="1" width="12" height="16" rx="2" /><line x1="6" y1="15" x2="10" y2="15" /></svg>
              Mobile
            </button>
          </div>
          {slug && (
            <a href={`/site/${slug}`} target="_blank" rel="noopener noreferrer" className="we-preview-link">
              View Live Site
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 2H3v9h9V8" /><path d="M8 2h4v4" /><path d="M12 2L6 8" /></svg>
            </a>
          )}
        </div>
        <div className={`we-preview-frame ${previewDevice === "mobile" ? "we-mobile-frame" : ""}`}>
          {previewDevice === "mobile" && <div className="we-mobile-notch" />}
          <div className={`we-preview-inner ${previewDevice === "mobile" ? "we-mobile-inner" : ""}`}>
            <LivePreview config={config} sections={sections} device={previewDevice} />
          </div>
          {previewDevice === "mobile" && <div className="we-mobile-bar" />}
        </div>
      </div>
    </div>
  );
}
