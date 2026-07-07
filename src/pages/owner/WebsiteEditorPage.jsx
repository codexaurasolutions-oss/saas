import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";

const COLOR_PRESETS = [
  "#c8a97e", "#b08d57", "#1a1a2e", "#16213e", "#0f3460",
  "#e94560", "#533483", "#2b2d42", "#8d99ae", "#6b705c",
  "#a5a58d", "#b7b7a4", "#d5c4a1", "#ffe8d6", "#dda15e",
  "#bc6c25", "#606c38", "#283618", "#003049", "#d62828",
  "#f77f00", "#fcbf49", "#0077b6", "#023e8a", "#001d3d"
];

const CARD_SHAPES = [
  { id: "rounded", label: "Rounded", css: "16px" },
  { id: "square", label: "Square", css: "4px" },
  { id: "circle", label: "Circle", css: "50%" },
  { id: "pill", label: "Pill", css: "999px" }
];

const DEFAULT_SECTIONS = [
  { id: "hero", type: "hero", label: "Hero Banner", enabled: true },
  { id: "about", type: "about", label: "About Us", enabled: true },
  { id: "gallery", type: "gallery", label: "Gallery", enabled: true },
  { id: "services", type: "services", label: "Services / Products", enabled: true },
  { id: "banner", type: "banner", label: "Promotional Banner", enabled: false },
  { id: "testimonials", type: "testimonials", label: "Client Reviews", enabled: true },
  { id: "cta", type: "cta", label: "Call to Action", enabled: false },
  { id: "contact", type: "contact", label: "Contact Info", enabled: false },
  { id: "hours", type: "hours", label: "Business Hours", enabled: false },
  { id: "social", type: "social", label: "Social Links", enabled: false }
];

const SECTION_ICONS = {
  hero: "\u{1F3A8}", about: "\u{2139}\uFE0F", gallery: "\u{1F5BC}\uFE0F",
  services: "\u{2728}", banner: "\u{1F4E3}", testimonials: "\u{2B50}",
  cta: "\u{1F446}", contact: "\u{1F4DE}", hours: "\u{23F0}", social: "\u{1F310}"
};

const SECTION_TYPES_AVAILABLE = [
  { type: "banner", label: "Promotional Banner" },
  { type: "cta", label: "Call to Action" },
  { type: "contact", label: "Contact Info" },
  { type: "hours", label: "Business Hours" },
  { type: "social", label: "Social Links" }
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

function ColorPicker({ label, value, onChange }) {
  const [showPresets, setShowPresets] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem", fontWeight: 500 }}>
      {label}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div
          onClick={() => setShowPresets(!showPresets)}
          style={{ width: 36, height: 36, borderRadius: 8, background: value || "#ccc", border: "2px solid #e0e0e0", cursor: "pointer", flexShrink: 0 }}
          title="Click to choose color"
        />
        <input
          type="color"
          value={value || "#000000"}
          onChange={e => onChange(e.target.value)}
          style={{ width: 0, height: 0, position: "absolute", opacity: 0 }}
        />
        <input
          type="text"
          value={value || ""}
          placeholder="#c8a97e"
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1, padding: "6px 8px", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.8rem", fontFamily: "monospace" }}
        />
      </div>
      {showPresets && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 0" }}>
          {COLOR_PRESETS.map(c => (
            <div
              key={c}
              onClick={() => { onChange(c); setShowPresets(false); }}
              style={{ width: 24, height: 24, borderRadius: 4, background: c, cursor: "pointer", border: value === c ? "2px solid #111" : "1px solid #ddd" }}
            />
          ))}
        </div>
      )}
    </label>
  );
}

function ImageInput({ label, value, onChange, hint }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(value || "");
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => { setPreview(e.target.result); onChange(e.target.result); };
    reader.readAsDataURL(file);
  };
  useEffect(() => { setPreview(value || ""); }, [value]);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem", fontWeight: 500 }}>
      {label}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
        style={{ border: "2px dashed #d0d0d0", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: "#fafafa" }}
      >
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
        {preview && <img src={preview} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", border: "1px solid #e0e0e0" }} />}
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={value || ""}
            placeholder="https://... or click to upload"
            onChange={e => { setPreview(e.target.value); onChange(e.target.value); }}
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", padding: "4px 6px", border: "1px solid #ddd", borderRadius: 4, fontSize: "0.8rem" }}
          />
          {hint && <span style={{ fontSize: "0.7rem", color: "#888" }}>{hint}</span>}
        </div>
      </div>
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder, multiline, rows }) {
  const InputTag = multiline ? "textarea" : "input";
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem", fontWeight: 500 }}>
      {label}
      <InputTag
        type="text"
        rows={rows || 2}
        value={value || ""}
        placeholder={placeholder || ""}
        onChange={e => onChange(e.target.value)}
        style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.85rem", resize: multiline ? "vertical" : "none" }}
      />
    </label>
  );
}

function CollapsibleSection({ icon, title, badge, children, defaultOpen, onToggle, enabled }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const toggle = () => { setOpen(!open); onToggle?.(!open); };
  return (
    <div style={{ background: "#f9f9f9", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
      <div
        onClick={toggle}
        style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none", background: enabled === false ? "#f0f0f0" : "transparent" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1rem" }}>{icon}</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{title}</span>
          {badge && <span style={{ fontSize: "0.7rem", color: "#888", background: "#e8e8e8", padding: "2px 6px", borderRadius: 4 }}>{badge}</span>}
        </div>
        <span style={{ fontSize: "0.8rem", color: "#888", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>&#9660;</span>
      </div>
      {open && <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>}
    </div>
  );
}

export default function WebsiteEditorPage() {
  const { auth } = useAuth();
  const [config, setConfig] = useState(emptyConfig);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [status, setStatus] = useState({ error: "", success: "" });
  const [dragIdx, setDragIdx] = useState(null);

  const slug = auth?.membership?.salonSlug || auth?.membership?.salon?.slug || "";

  useEffect(() => {
    let active = true;
    api.get("/owner/website/config").then((res) => {
      if (!active) return;
      const d = res.data || {};
      setConfig(prev => ({
        ...prev,
        ...Object.fromEntries(Object.keys(prev).map(k => [k, d[k] !== undefined ? d[k] : prev[k]]))
      }));
      if (d.sections && Array.isArray(d.sections)) setSections(d.sections);
    }).catch(() => {
      if (!active) return;
      setStatus({ error: "Could not load editor settings", success: "" });
    });
    return () => { active = false; };
  }, []);

  const update = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setStatus({ error: "", success: "" });
    try {
      const payload = { ...config, sections };
      await api.post("/owner/website/config", payload);
      setIframeKey(Date.now());
      setStatus({ error: "", success: "Published successfully!" });
      setTimeout(() => setStatus({ error: "", success: "" }), 3000);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Publish failed"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (id) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const addSection = (type) => {
    if (sections.find(s => s.type === type)) return;
    const info = SECTION_TYPES_AVAILABLE.find(t => t.type === type);
    setSections(prev => [...prev, { id: `${type}-${Date.now()}`, type, label: info?.label || type, enabled: true }]);
  };

  const removeSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const moveSection = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= sections.length) return;
    const copy = [...sections];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    setSections(copy);
  };

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) moveSection(dragIdx, idx); };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f0f0f0", fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* Editor Sidebar */}
      <div style={{ width: 440, background: "#fff", borderRight: "1px solid #e0e0e0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
          <div>
            <h2 style={{ fontSize: "1.05rem", margin: 0, fontWeight: 700 }}>Website Editor</h2>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "#888" }}>{config.salonName || "Salon"} &mdash; {slug || "no slug"}</p>
          </div>
          <button onClick={handleSave} disabled={saving} style={{ background: "#111", color: "#fff", border: "none", padding: "8px 22px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>
            {saving ? "Saving..." : "Publish"}
          </button>
        </div>

        {status.error && (
          <div style={{ padding: "10px 20px", background: "#fef2f2", color: "#b91c1c", fontSize: "0.82rem", fontWeight: 600 }}>{status.error}</div>
        )}
        {status.success && (
          <div style={{ padding: "10px 20px", background: "#f0fdf4", color: "#166534", fontSize: "0.82rem", fontWeight: 600 }}>{status.success}</div>
        )}

        {/* Scrollable Sections */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Section Order */}
          <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "0 4px" }}>Section Order</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                  borderRadius: 8, border: "1px solid #eee", background: dragIdx === idx ? "#f0f0ff" : "#fafafa",
                  cursor: "grab", fontSize: "0.82rem", transition: "all 0.15s",
                  opacity: sec.enabled ? 1 : 0.5
                }}
              >
                <span style={{ cursor: "grab", color: "#bbb", fontSize: "1rem" }}>&#9776;</span>
                <span style={{ fontSize: "0.9rem" }}>{SECTION_ICONS[sec.type] || "\u{1F4D6}"}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{sec.label}</span>
                <button onClick={() => toggleSection(sec.id)} style={{ background: sec.enabled ? "#10b981" : "#ccc", color: "#fff", border: "none", width: 32, height: 18, borderRadius: 9, cursor: "pointer", fontSize: "0.65rem", position: "relative", transition: "background 0.2s" }}>
                  {sec.enabled ? "ON" : "OFF"}
                </button>
                {idx > 0 && <button onClick={() => moveSection(idx, idx - 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "#888" }}>&#9650;</button>}
                {idx < sections.length - 1 && <button onClick={() => moveSection(idx, idx + 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "#888" }}>&#9660;</button>}
                {!["hero", "about", "gallery", "services"].includes(sec.type) && (
                  <button onClick={() => removeSection(sec.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", color: "#e74c3c" }}>&times;</button>
                )}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #eee" }} />

          {/* Add New Section */}
          <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "0 4px" }}>Add Section</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SECTION_TYPES_AVAILABLE.filter(t => !sections.find(s => s.type === t.type)).map(t => (
              <button key={t.type} onClick={() => addSection(t.type)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px dashed #ccc", background: "#fafafa", cursor: "pointer", fontSize: "0.78rem", color: "#555", fontWeight: 500, transition: "all 0.15s" }}
                onMouseOver={e => { e.target.style.borderColor = "#111"; e.target.style.background = "#f0f0f0"; }}
                onMouseOut={e => { e.target.style.borderColor = "#ccc"; e.target.style.background = "#fafafa"; }}
              >
                + {t.label}
              </button>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #eee" }} />

          {/* Color & Brand */}
          <CollapsibleSection icon={"\u{1F3A8}"} title="Colors & Brand">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <ColorPicker label="Primary / Accent" value={config.primaryColor} onChange={v => update("primaryColor", v)} />
              <ColorPicker label="Text / Dark" value={config.secondaryColor} onChange={v => update("secondaryColor", v)} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {["rounded", "square", "circle", "pill"].map(shape => (
                <button key={shape} onClick={() => update("cardShape", shape)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 8, border: config.cardShape === shape ? "2px solid #111" : "1px solid #ddd",
                  background: config.cardShape === shape ? "#f0f0f0" : "#fff", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
                  textTransform: "capitalize", transition: "all 0.15s"
                }}>
                  <div style={{ width: 28, height: 28, margin: "0 auto 4px", background: config.primaryColor || "#c8a97e", borderRadius: CARD_SHAPES.find(c => c.id === shape)?.css || "16px" }} />
                  {shape}
                </button>
              ))}
            </div>
            <TextInput label="Salon Name" value={config.salonName} onChange={v => update("salonName", v)} placeholder="Your Salon Name" />
            <ImageInput label="Logo" value={config.logoUrl} onChange={v => update("logoUrl", v)} hint="Square logo, 200x200px" />
          </CollapsibleSection>

          {/* Hero */}
          {sections.find(s => s.type === "hero")?.enabled && (
            <CollapsibleSection icon={"\u{1F3A8}"} title="Hero Banner" badge="Home Page">
              <TextInput label="Headline" value={config.heroTitle} onChange={v => update("heroTitle", v)} placeholder="Elevate Your Beauty Experience" />
              <TextInput label="Subtitle" value={config.heroSubtitle} onChange={v => update("heroSubtitle", v)} multiline rows={2} placeholder="Discover premium salon services..." />
              <ImageInput label="Background Image" value={config.heroImage} onChange={v => update("heroImage", v)} hint="1920 x 800px, wide landscape" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <TextInput label="Button 1 Text" value={config.heroBtn1Text} onChange={v => update("heroBtn1Text", v)} />
                <TextInput label="Button 1 Link" value={config.heroBtn1Link} onChange={v => update("heroBtn1Link", v)} placeholder="collections" />
                <TextInput label="Button 2 Text" value={config.heroBtn2Text} onChange={v => update("heroBtn2Text", v)} />
                <TextInput label="Button 2 Link" value={config.heroBtn2Link} onChange={v => update("heroBtn2Link", v)} placeholder="book" />
              </div>
            </CollapsibleSection>
          )}

          {/* About */}
          {sections.find(s => s.type === "about")?.enabled && (
            <CollapsibleSection icon={"\u{2139}\uFE0F"} title="About Us" badge="About Page">
              <TextInput label="Section Title" value={config.aboutTitle} onChange={v => update("aboutTitle", v)} placeholder="About Our Salon" />
              <TextInput label="Description" value={config.aboutDescription} onChange={v => update("aboutDescription", v)} multiline rows={3} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <TextInput label="Mission" value={config.aboutMission} onChange={v => update("aboutMission", v)} multiline rows={2} />
                <TextInput label="Vision" value={config.aboutVision} onChange={v => update("aboutVision", v)} multiline rows={2} />
              </div>
              <ImageInput label="About Image" value={config.aboutImage} onChange={v => update("aboutImage", v)} hint="800 x 600px" />
            </CollapsibleSection>
          )}

          {/* Gallery */}
          {sections.find(s => s.type === "gallery")?.enabled && (
            <CollapsibleSection icon={"\u{1F5BC}\uFE0F"} title="Photo Gallery" badge={`${(config.galleryImages || []).length} photos`}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {(config.galleryImages || []).map((img, idx) => (
                  <div key={idx} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "1" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => update("galleryImages", config.galleryImages.filter((_, i) => i !== idx))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: "0.7rem" }}>&times;</button>
                  </div>
                ))}
                <label style={{ border: "2px dashed #ccc", borderRadius: 8, aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem", color: "#aaa", transition: "all 0.15s" }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "#888"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "#ccc"; }}
                >
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => update("galleryImages", [...(config.galleryImages || []), ev.target.result]);
                    reader.readAsDataURL(file);
                  }} />
                  +
                </label>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#888" }}>Click + to add images. 800 x 800px recommended.</span>
            </CollapsibleSection>
          )}

          {/* Services / Products */}
          {sections.find(s => s.type === "services")?.enabled && (
            <CollapsibleSection icon={"\u{2728}"} title="Services & Products" badge="Dynamic">
              <p style={{ fontSize: "0.78rem", color: "#888", margin: 0 }}>This section automatically displays your services and products. Manage them from the POS and Inventory pages.</p>
            </CollapsibleSection>
          )}

          {/* Promotional Banner */}
          {sections.find(s => s.type === "banner")?.enabled && (
            <CollapsibleSection icon={"\u{1F4E3}"} title="Promotional Banner">
              <TextInput label="Banner Title" value={config.bannerTitle} onChange={v => update("bannerTitle", v)} placeholder="Summer Sale - 20% Off" />
              <TextInput label="Subtitle" value={config.bannerSubtitle} onChange={v => update("bannerSubtitle", v)} multiline />
              <ImageInput label="Banner Image" value={config.bannerImage} onChange={v => update("bannerImage", v)} hint="1200 x 500px, wide banner" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <TextInput label="Button Text" value={config.bannerBtnText} onChange={v => update("bannerBtnText", v)} />
                <TextInput label="Button Link" value={config.bannerBtnLink} onChange={v => update("bannerBtnLink", v)} />
              </div>
            </CollapsibleSection>
          )}

          {/* Testimonials */}
          {sections.find(s => s.type === "testimonials")?.enabled && (
            <CollapsibleSection icon={"\u{2B50}"} title="Client Reviews" badge={`${(config.testimonials || []).length} reviews`}>
              {(config.testimonials || []).map((t, idx) => (
                <div key={idx} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 10, position: "relative" }}>
                  <button onClick={() => update("testimonials", config.testimonials.filter((_, i) => i !== idx))} style={{ position: "absolute", top: 6, right: 6, background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "0.85rem" }}>&times;</button>
                  <TextInput label="Author" value={t.author} onChange={v => { const copy = [...config.testimonials]; copy[idx] = { ...copy[idx], author: v }; update("testimonials", copy); }} />
                  <TextInput label="Review" value={t.text} onChange={v => { const copy = [...config.testimonials]; copy[idx] = { ...copy[idx], text: v }; update("testimonials", copy); }} multiline rows={2} />
                  <label style={{ fontSize: "0.8rem", fontWeight: 500 }}>Rating
                    <select value={t.rating || 5} onChange={e => { const copy = [...config.testimonials]; copy[idx] = { ...copy[idx], rating: parseInt(e.target.value) }; update("testimonials", copy); }} style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd" }}>
                      {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                    </select>
                  </label>
                </div>
              ))}
              <button onClick={() => update("testimonials", [...(config.testimonials || []), { author: "", text: "", rating: 5 }])} style={{ padding: "8px", borderRadius: 8, border: "1px dashed #ccc", background: "#fafafa", cursor: "pointer", fontSize: "0.8rem", color: "#555" }}>
                + Add Review
              </button>
            </CollapsibleSection>
          )}

          {/* CTA */}
          {sections.find(s => s.type === "cta")?.enabled && (
            <CollapsibleSection icon={"\u{1F446}"} title="Call to Action">
              <TextInput label="CTA Title" value={config.ctaTitle} onChange={v => update("ctaTitle", v)} placeholder="Ready to Transform Your Look?" />
              <TextInput label="Subtitle" value={config.ctaSubtitle} onChange={v => update("ctaSubtitle", v)} multiline />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <TextInput label="Button Text" value={config.ctaBtnText} onChange={v => update("ctaBtnText", v)} />
                <TextInput label="Button Link" value={config.ctaBtnLink} onChange={v => update("ctaBtnLink", v)} />
              </div>
              <ImageInput label="CTA Background" value={config.ctaImage} onChange={v => update("ctaImage", v)} hint="1200 x 500px" />
            </CollapsibleSection>
          )}

          {/* Contact */}
          {sections.find(s => s.type === "contact")?.enabled && (
            <CollapsibleSection icon={"\u{1F4DE}"} title="Contact Information">
              <TextInput label="Phone" value={config.contactPhone} onChange={v => update("contactPhone", v)} placeholder="+91 98765 43210" />
              <TextInput label="Email" value={config.contactEmail} onChange={v => update("contactEmail", v)} placeholder="info@yoursalon.com" />
              <TextInput label="Address" value={config.contactAddress} onChange={v => update("contactAddress", v)} multiline rows={2} />
              <TextInput label="Google Maps Embed URL" value={config.contactMapUrl} onChange={v => update("contactMapUrl", v)} placeholder="https://maps.google.com/..." />
            </CollapsibleSection>
          )}

          {/* Business Hours */}
          {sections.find(s => s.type === "hours")?.enabled && (
            <CollapsibleSection icon={"\u{23F0}"} title="Business Hours">
              {(config.businessHours || []).map((bh, idx) => (
                <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input value={bh.day} onChange={e => { const copy = [...config.businessHours]; copy[idx] = { ...copy[idx], day: e.target.value }; update("businessHours", copy); }} style={{ width: 100, padding: "5px 8px", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.82rem" }} />
                  <input value={bh.hours} onChange={e => { const copy = [...config.businessHours]; copy[idx] = { ...copy[idx], hours: e.target.value }; update("businessHours", copy); }} style={{ flex: 1, padding: "5px 8px", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.82rem" }} />
                  <button onClick={() => update("businessHours", config.businessHours.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer" }}>&times;</button>
                </div>
              ))}
              <button onClick={() => update("businessHours", [...(config.businessHours || []), { day: "Day", hours: "9:00 AM - 5:00 PM" }])} style={{ padding: "6px", borderRadius: 6, border: "1px dashed #ccc", background: "#fafafa", cursor: "pointer", fontSize: "0.78rem", color: "#555" }}>
                + Add Day
              </button>
            </CollapsibleSection>
          )}

          {/* Social Links */}
          {sections.find(s => s.type === "social")?.enabled && (
            <CollapsibleSection icon={"\u{1F310}"} title="Social Media Links">
              <TextInput label="Instagram" value={config.socialInstagram} onChange={v => update("socialInstagram", v)} placeholder="@yoursalon" />
              <TextInput label="Facebook" value={config.socialFacebook} onChange={v => update("socialFacebook", v)} placeholder="https://facebook.com/..." />
              <TextInput label="YouTube" value={config.socialYoutube} onChange={v => update("socialYoutube", v)} placeholder="https://youtube.com/..." />
              <TextInput label="TikTok" value={config.socialTiktok} onChange={v => update("socialTiktok", v)} placeholder="@yoursalon" />
              <TextInput label="Twitter / X" value={config.socialTwitter} onChange={v => update("socialTwitter", v)} placeholder="@yoursalon" />
            </CollapsibleSection>
          )}

          {/* Footer */}
          <CollapsibleSection icon={"\u{1F4DD}"} title="Footer" defaultOpen={false}>
            <TextInput label="Footer Text" value={config.footerText} onChange={v => update("footerText", v)} placeholder="All rights reserved..." multiline />
          </CollapsibleSection>

        </div>
      </div>

      {/* Live Preview */}
      <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#e0e0e0", padding: "6px 16px", borderRadius: 100, fontSize: "0.82rem", fontWeight: 600 }}>Desktop Preview</div>
          <a href={slug ? `/site/${slug}` : "#"} target="_blank" rel="noopener noreferrer" style={{ color: slug ? "#3b82f6" : "#999", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600, pointerEvents: slug ? "auto" : "none" }}>
            View Full Screen &#8599;
          </a>
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", border: "1px solid #ddd" }}>
          {slug ? (
            <iframe key={iframeKey} src={`/site/${slug}`} style={{ width: "100%", height: "100%", border: "none", minHeight: 600 }} title="Live Preview" />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999", fontSize: "0.9rem" }}>
              No slug configured. Contact support.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
