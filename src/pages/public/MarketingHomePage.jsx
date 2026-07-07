import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import PublicMobileMenu from "../../components/PublicMobileMenu";

// Premium Interactive Visual Mocks instead of missing SVGs
function DashboardPreview() {
  return (
    <div style={{ width: "100%", borderRadius: 24, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "24px", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", borderRadius: "16px" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.05em" }}>Enterprise Live Revenue</div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#14b8a6", marginTop: "4px" }}>₹3,84,240</div>
          <div style={{ display: "flex", gap: "8px", fontSize: "0.75rem", color: "#14b8a6", marginTop: "6px", alignItems: "center", fontWeight: 600 }}>
            <span>↑ 24% this month</span>
            <span style={{ color: "#94a3b8" }}>• 12 Branches Active</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "12px" }}>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>Active Invoices</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "2px", color: "#38bdf8" }}>4,924</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "12px" }}>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>Staff Scheduled</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "2px", color: "#fb7185" }}>184</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesPreview() {
  return (
    <div style={{ width: "100%", borderRadius: 24, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "24px", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Workspace RBAC Access Control</h4>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "10px 14px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600 }}>Salon Owner</span>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Full Administrative Access</span>
          </div>
          <span style={{ padding: "4px 10px", background: "rgba(20, 184, 166, 0.1)", color: "#14b8a6", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 700 }}>Owner</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "10px 14px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600 }}>Receptionist</span>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>POS, Catalog & Bookings Only</span>
          </div>
          <span style={{ padding: "4px 10px", background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 700 }}>Reception</span>
        </div>
      </div>
    </div>
  );
}

function PricingPreview() {
  return (
    <div style={{ width: "100%", borderRadius: 24, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "24px", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Choose Standard or Custom Tiers</h4>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Starter Plan</span>
          <strong style={{ fontSize: "0.85rem", color: "#14b8a6" }}>₹4,999 / mo</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Growth Plan</span>
          <strong style={{ fontSize: "0.85rem", color: "#14b8a6" }}>₹9,999 / mo</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Enterprise Scale</span>
          <strong style={{ fontSize: "0.85rem", color: "#14b8a6" }}>Custom Quote</strong>
        </div>
      </div>
    </div>
  );
}

function PlatformPreview() {
  return (
    <div style={{ width: "100%", borderRadius: 24, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "24px", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Database Sandbox Tenancy</h4>
        <div style={{ borderLeft: "3px solid #0d9488", paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Multi-Tenant Isolation</span>
          <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Each salon is logically isolated at the query level using secure client references.</span>
        </div>
        <div style={{ borderLeft: "3px solid #38bdf8", paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Secure JWT Authentication</span>
          <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Cryptographic access tokens ensure backend routers confirm actor role and permissions.</span>
        </div>
      </div>
    </div>
  );
}

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Platform", to: "/platform" },
  { label: "Request Demo", to: "/book-demo" }
];

const brandLogo = "/logo-respark.svg";

const featureGroups = [
  {
    title: "SaaS Control",
    points: ["Super Admin controls salons, plans, subscriptions, feature flags, and maintenance mode.", "Multi-tenant isolation keeps salon data separated at API and database level.", "Plan limits govern branches, users, customers, invoices, and feature access."]
  },
  {
    title: "Unified Owner/Admin Panel",
    points: ["One shared panel for owner, receptionist, manager, staff, and accountant users.", "Role-based sidebar and backend permission checks keep every user inside assigned scope.", "Branch-aware operations, custom roles, archived users, and staff-service assignment are built in."]
  },
  {
    title: "Billing + Operations",
    points: ["POS creates invoices with backend-calculated totals, payment updates, receipt HTML, and PDF output.", "Customers carry notes, tags, source, birthdays, anniversaries, and billing history.", "Reports cover sales, payments, branches, staff-service output, customer totals, and CSV export."]
  }
];

const platformSections = [
  {
    eyebrow: "Unified Experience",
    title: "One login surface for every internal team member",
    copy: "Instead of building separate staff panels, the platform keeps owner, front desk, manager, and specialist access inside one clean workspace with role-based visibility."
  },
  {
    eyebrow: "Operational Safety",
    title: "Backend-first enforcement for serious billing flows",
    copy: "Permissions, feature flags, maintenance mode, invoice totals, and payment transitions are all enforced on the backend, not only hidden in the UI."
  },
  {
    eyebrow: "Growth Readiness",
    title: "A strong Phase 1 base for multi-branch salon businesses",
    copy: "The architecture is ready for future modules like appointments, inventory, memberships, and storefront expansion without rewriting the tenancy model."
  }
];

const pageContent = {
  "/": {
    heroEyebrow: "Salon ERP Platform",
    title: "Run your entire salon business from one calm, controlled operating system.",
    subtitle: "ReSpark brings Super Admin controls, a unified owner/admin panel, POS billing, team permissions, CRM, support, and reporting into one responsive platform for modern salon businesses.",
    primaryCta: "Request Demo",
    secondaryCta: "See Pricing"
  },
  "/features": {
    heroEyebrow: "Feature Stack",
    title: "Every essential Phase 1 feature, mapped into one connected workflow.",
    subtitle: "From tenant isolation to invoice PDFs, from staff roles to branch-wise reporting, the platform is designed so the front desk, owner, and support team can operate with clarity."
  },
  "/pricing": {
    heroEyebrow: "Plans & Pricing",
    title: "Choose the plan that matches your salon growth stage.",
    subtitle: "Transparent limits, clear feature access, and room for custom plans when a growing salon group needs a more tailored rollout."
  },
  "/platform": {
    heroEyebrow: "Inside The Platform",
    title: "Built specifically for salons that need discipline, visibility, and scale.",
    subtitle: "This is not a generic dashboard. The product structure follows real salon operations: branches, services, users, permissions, POS, payments, support, and SaaS-level controls."
  }
};

const defaultPlans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 4999,
    yearlyPrice: 49990,
    trialDays: 14,
    branchLimit: 9999,
    userLimit: 5,
    customerLimit: 500,
    invoiceLimit: 1000,
    storageLimit: 5,
    featureFlags: { pos: true, crm: true, reports: true }
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 9999,
    yearlyPrice: 99990,
    trialDays: 14,
    branchLimit: 9999,
    userLimit: 20,
    customerLimit: 3000,
    invoiceLimit: 10000,
    storageLimit: 20,
    featureFlags: { pos: true, crm: true, reports: true, whatsapp: true, digitalCatalog: true }
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: 17999,
    yearlyPrice: 179990,
    trialDays: 21,
    branchLimit: 9999,
    userLimit: 100,
    customerLimit: 20000,
    invoiceLimit: 50000,
    storageLimit: 100,
    featureFlags: { pos: true, crm: true, reports: true, whatsapp: true, digitalCatalog: true, customerPortal: true, loyalty: true }
  }
];

const industries = ["Hair Salons", "Beauty Studios", "Spa Chains", "Nail Bars", "Tattoo Studios", "Beauty Clinics", "Pet Grooming"];

const publicFeatureCards = [
  "Unified owner/admin workspace",
  "Permission-based sidebar",
  "Super Admin salon controls",
  "Plan and subscription limits",
  "Branch and service management",
  "Staff assignment and custom roles",
  "Customer CRM and billing history",
  "POS, invoices, payments, receipts, PDF",
  "Sales, customer, branch, and staff reports",
  "Support tickets with thread trail",
  "Demo lead capture and public website",
  "Maintenance mode and feature flag blocking"
];

const proofStrip = [
  { label: "Billing safe", value: "Backend totals" },
  { label: "Access model", value: "RBAC + feature flags" },
  { label: "Reports", value: "Branch and staff aware" },
  { label: "Deployment shape", value: "Unified multi-tenant SaaS" }
];

function getCurrencyMeta(currencyCode) {
  const code = String(currencyCode || "INR").toUpperCase();
  if (code === "INR") return { code, locale: "en-IN" };
  if (code === "PKR") return { code, locale: "en-PK" };
  if (code === "AED") return { code, locale: "en-AE" };
  if (code === "USD") return { code, locale: "en-US" };
  return { code, locale: "en-IN" };
}

function formatPrice(value, currencyCode) {
  const meta = getCurrencyMeta(currencyCode);
  return new Intl.NumberFormat(meta.locale, { maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function MarketingHomePage() {
  const location = useLocation();
  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/public/settings"), api.get("/public/plans").catch(() => ({ data: [] }))])
      .then(([settingsResponse, plansResponse]) => {
        if (!active) return;
        setSettings(settingsResponse.data);
        setPlans(Array.isArray(plansResponse.data) && plansResponse.data.length ? plansResponse.data : defaultPlans);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const page = pageContent[location.pathname] || pageContent["/"];
  const whatsappHref = settings?.whatsappNumber
    ? `https://wa.me/${String(settings.whatsappNumber).replace(/[^\d]/g, "")}`
    : null;
  const pricingCurrency = String(settings?.defaultCurrency || "INR").toUpperCase();

  const selectedPageFeatures = useMemo(() => {
    if (location.pathname === "/features") return publicFeatureCards;
    if (location.pathname === "/pricing") {
      return [
        "Monthly and yearly billing visibility",
        "Branch, user, customer, invoice, and storage limits",
        "Custom plan support for special rollouts",
        "Feature-based growth path instead of vague package names"
      ];
    }
    if (location.pathname === "/platform") {
      return [
        "Clean tenant isolation",
        "Role and feature enforcement",
        "Supportable SaaS architecture",
        "Responsive interface for daily operations"
      ];
    }
    return [
      "Multi-branch control",
      "POS and invoice handling",
      "Customer CRM",
      "Permission-led staff access"
    ];
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${page.title} | ${settings?.systemName || "ReSpark"}`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", page.subtitle);
  }, [page, settings]);

  return (
    <div className="public-site">
      <style>{`
        .salon-img-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 768px) { .salon-img-grid { grid-template-columns: 1fr; } .salon-hero-img { height: 200px !important; } .salon-cta-img { height: 240px !important; } }
      `}</style>
      {isLoading ? (
        <div className="page-shell" style={{ minHeight: "100vh" }}>
          <div className="panel-card">
            <PageLoader title="Loading ReSpark website" message="We are preparing plans, public settings, and the latest marketing content." />
          </div>
        </div>
      ) : (
        <>
      <div className="public-orb orb-one" />
      <div className="public-orb orb-two" />
      <header className="public-nav-shell">
        <div className="public-nav">
          <Link to="/" className="brand-mark">
            <img src={brandLogo} alt="ReSpark" className="brand-logo" />
            <span className="brand-lockup">
              <strong>{settings?.systemName || "ReSpark"}</strong>
              <small>Salon ERP Platform</small>
            </span>
          </Link>
          <nav className="public-nav-links">
            {navLinks.map((item) => (
              <Link key={item.to} to={item.to} className={location.pathname === item.to ? "active" : ""}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="public-nav-cta">
            <Link to="/book-demo" className="nav-demo-link">Request Demo</Link>
          </div>
          <PublicMobileMenu
            brand={{ label: settings?.systemName || "ReSpark", sublabel: "Salon ERP Platform", logo: brandLogo, to: "/" }}
            items={navLinks}
            cta={{ label: "Book Demo", to: "/book-demo" }}
          />
        </div>
      </header>

      <main className="public-main">
        <section className="public-hero">
          <div className="public-hero-copy">
            <div className="eyebrow-pill">{page.heroEyebrow}</div>
            <h1>{page.title}</h1>
            <p>{page.subtitle}</p>
            <div className="public-hero-actions">
              <Link to="/book-demo" className="cta-primary">
                {page.primaryCta || "Request Demo"}
              </Link>
              <Link to={location.pathname === "/pricing" ? "/features" : "/pricing"} className="cta-secondary">
                {page.secondaryCta || "Explore Plans"}
              </Link>
            </div>
            <div className="public-mini-proof">
              <span>Unified panel</span>
              <span>MySQL-backed</span>
              <span>PDF invoices</span>
              <span>Role-based access</span>
            </div>
          </div>
          <div className="public-hero-card" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="premium-illustration-container">
              <div className="svg-glow-backdrop" />
              {location.pathname === "/" && <DashboardPreview />}
              {location.pathname === "/features" && <FeaturesPreview />}
              {location.pathname === "/pricing" && <PricingPreview />}
              {location.pathname === "/platform" && <PlatformPreview />}
            </div>
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.12)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <img className="salon-hero-img" src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=450&fit=crop&crop=center" alt="Premium salon interior" style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }} />
            </div>
          </div>
        </section>

        <section className="public-trust">

          <div className="trust-card">
            <small>Best fit for</small>
            <strong>Growing salon teams</strong>
          </div>
          <div className="trust-card">
            <small>Support region</small>
            <strong>{[settings?.defaultCity, settings?.defaultCountry].filter(Boolean).join(", ") || "Global"}</strong>
          </div>
          <div className="trust-card">
            <small>Primary contact</small>
            <strong>{settings?.contactEmail || "hello@respark.local"}</strong>
          </div>
          <div className="trust-card">
            <small>Demo access</small>
            <strong>{settings?.demoBookingUrl ? "Open" : "Request based"}</strong>
          </div>
        </section>

        {settings?.maintenanceMode ? (
          <section className="public-section" style={{ paddingTop: 0 }}>
            <div className="feature-panel warm">
              <div className="section-chip">Maintenance Notice</div>
              <h2>Platform maintenance mode is currently active.</h2>
              <p>Public information is still available, but internal salon workspaces may be temporarily restricted while maintenance is in progress.</p>
            </div>
          </section>
        ) : null}

        <section className="public-proof-ribbon">
          {proofStrip.map((item) => (
            <div key={item.label} className="proof-ribbon-card">
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </div>
          ))}
        </section>

        {location.pathname === "/" && (
          <>
            <section className="public-section" style={{ paddingTop: 40 }}>
              <div className="salon-img-grid" style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,.08)" }}>
                  <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop" alt="Salon styling station" style={{ width: "100%", height: 220, objectFit: "cover", display: "block", transition: "transform .3s" }} onMouseEnter={e => e.target.style.transform = "scale(1.05)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                </div>
                <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,.08)" }}>
                  <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=300&fit=crop" alt="Spa treatment room" style={{ width: "100%", height: 220, objectFit: "cover", display: "block", transition: "transform .3s" }} onMouseEnter={e => e.target.style.transform = "scale(1.05)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                </div>
                <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,.08)" }}>
                  <img src="https://images.unsplash.com/photo-1633681122886-333f05b1054d?w=400&h=300&fit=crop" alt="Beauty salon interior" style={{ width: "100%", height: 220, objectFit: "cover", display: "block", transition: "transform .3s" }} onMouseEnter={e => e.target.style.transform = "scale(1.05)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                </div>
              </div>
            </section>

        {location.pathname === "/" && (
          <>
            <section className="public-section two-panel">
              <div className="feature-panel warm">
                <div className="section-chip">Why teams choose it</div>
                <h2>One operational rhythm from front desk to owner reporting.</h2>
                <p>
                  The platform reduces scattered processes by keeping customers, services, staff access, invoices,
                  payments, reports, and support inside one unified operational structure.
                </p>
                <div className="public-badges">
                  {selectedPageFeatures.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
              <div className="feature-panel cool">
                <div className="section-chip">Industries</div>
                <h2>Built around salon-style workflows, not generic retail assumptions.</h2>
                <ul className="public-list">
                  {industries.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </section>

            <section className="public-section">
              <div className="section-heading">
                <div className="section-chip">Core Pillars</div>
                <h2>The four areas that make the platform reliable in daily use.</h2>
              </div>
              <div className="public-card-grid">
                {featureGroups.map((group) => (
                  <article key={group.title} className="public-card tilt-card">
                    <h3>{group.title}</h3>
                    <ul className="public-list">
                      {group.points.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
            <section className="public-section spotlight-grid">
              <div className="spotlight-card dark-panel">
                <div className="section-chip">Owner Experience</div>
                <h3>From reception tasks to owner-level visibility, all in one rhythm.</h3>
                <p>Front desk billing, service selection, staff mapping, payment updates, and reporting all stay connected so small mistakes do not multiply later.</p>
              </div>
              <div className="spotlight-card light-panel">
                <div className="section-chip">SaaS Visibility</div>
                <h3>Super Admin always stays in control of plan access and platform safety.</h3>
                <p>Salons, subscriptions, feature flags, maintenance mode, and support oversight stay above tenant level where they belong.</p>
              </div>
            </section>
          </>
        )}

        {location.pathname === "/features" && (
          <>
            <section className="public-section">
              <div className="section-heading">
                <div className="section-chip">According to SRS</div>
                <h2>Phase 1 feature coverage across SaaS control, salon operations, and reporting.</h2>
              </div>
              <div className="feature-tile-grid">
                {publicFeatureCards.map((item, index) => (
                  <div key={item} className="feature-tile" style={{ animationDelay: `${index * 60}ms` }}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="public-section two-panel">
              <div className="feature-panel warm">
                <div className="section-chip">Operational Modules</div>
                <p>Branches, categories, services, staff/users, custom roles, customers, POS, invoices, payments, reports, settings, and support all work together in the owner workspace.</p>
                <ul className="public-list">
                  <li>Service-to-staff assignment for clean POS selection</li>
                  <li>Customer CRM notes, tags, dates, source, and billing history</li>
                  <li>Receipt HTML, invoice PDF, and payment tracking</li>
                </ul>
              </div>
              <div className="feature-panel cool">
                <div className="section-chip">SaaS Modules</div>
                <p>Salons, plans, subscriptions, demo leads, support supervision, settings, maintenance mode, and feature flags are controlled from Super Admin.</p>
                <ul className="public-list">
                  <li>Salon activation, suspension, trial, and expiry visibility</li>
                  <li>Plan limits, custom plans, subscription history, and upgrade flow</li>
                  <li>Ticket supervision with internal notes and support event trail</li>
                </ul>
              </div>
            </section>
          </>
        )}

        {location.pathname === "/pricing" && (
          <>
            <section className="public-section">
              <div className="section-heading">
                <div className="section-chip">Transparent Tiers</div>
                <h2>Pricing that shows both limits and real usage capacity.</h2>
              </div>
              {!plans.length ? <EmptyState title="Pricing plans unavailable right now" message="Default pricing cards will appear here once public plan rows are available for this environment." /> : null}
              <div className="pricing-grid-custom">
                {plans.map((plan, index) => (
                  <article key={plan.id} className={`price-card-premium ${index === 1 ? "featured" : ""}`}>
                    <div className="price-header">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#0d9488", fontWeight: 700, letterSpacing: "0.05em" }}>{plan.isCustom ? "Custom tier" : "Standard tier"}</span>
                        {index === 1 && <span style={{ padding: "2px 8px", background: "#ccfbf1", color: "#0f766e", borderRadius: 99, fontSize: "0.65rem", fontWeight: 800 }}>POPULAR</span>}
                      </div>
                      <h3>{plan.name}</h3>
                      <div className="price-amt">
                        <span className="currency">{pricingCurrency === "PKR" ? "Rs" : pricingCurrency === "AED" ? "AED" : "₹"}</span>
                        <span className="val">{formatPrice(plan.monthlyPrice, pricingCurrency)}</span>
                        <span className="period">/mo</span>
                      </div>
                      <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>Yearly billing: {pricingCurrency === "PKR" ? "Rs" : pricingCurrency === "AED" ? "AED" : "₹"}{formatPrice(plan.yearlyPrice, pricingCurrency)} / yr</p>
                    </div>
                    
                    <ul className="price-limits-list">
                      <li><span>Branches</span><strong>Unlimited</strong></li>
                      <li><span>Staff Users</span><strong>{plan.userLimit} Users</strong></li>
                      <li><span>CRM Customers</span><strong>{plan.customerLimit} Customers</strong></li>
                      <li><span>Monthly Invoices</span><strong>{plan.invoiceLimit} Invoices</strong></li>
                      <li><span>Cloud Storage</span><strong>{plan.storageLimit || 0} GB</strong></li>
                    </ul>

                    <div className="public-badges" style={{ marginBottom: 24, minHeight: 48 }}>
                      {Object.entries(plan.featureFlags || {}).filter(([, enabled]) => enabled).slice(0, 5).map(([key]) => (
                        <span key={`${plan.id}-${key}`} style={{ fontSize: "0.72rem", padding: "4px 8px", borderRadius: 6 }}>{key}</span>
                      ))}
                    </div>
                    
                    <Link to="/book-demo" className="plan-link" style={{ width: "100%", textAlign: "center", display: "block" }}>Request Plan Walkthrough</Link>
                  </article>
                ))}
              </div>
            </section>
            <section className="public-section two-panel">
              <div className="feature-panel warm">
                <div className="section-chip">Custom Plans</div>
                <h2>Need a different rollout shape?</h2>
                <p>Custom plan handling is supported for special branch counts, feature combinations, or rollout structures that do not fit the standard ladder.</p>
              </div>
              <div className="feature-panel cool">
                <div className="section-chip">Upgrade Path</div>
                <h2>Move up cleanly as the salon grows.</h2>
                <p>Subscriptions track status, payment state, manual discounts, and history so growth decisions stay operationally visible.</p>
              </div>
            </section>
            <section className="public-section pricing-note-card">
              <div>
                <div className="section-chip">Pricing Philosophy</div>
                <h3>No vague promises. Just clear limits, feature access, and upgrade logic.</h3>
              </div>
              <p>That makes the pricing page useful in real sales conversations, not just visually attractive.</p>
            </section>
          </>
        )}

        {location.pathname === "/platform" && (
          <>
            <section className="public-section">
              <div className="section-heading">
                <div className="section-chip">Platform Story</div>
                <h2>A platform shape that matches how salon teams actually work.</h2>
              </div>
              <div className="platform-flow">
                {platformSections.map((section) => (
                  <article key={section.title} className="platform-step">
                    <small>{section.eyebrow}</small>
                    <h3>{section.title}</h3>
                    <p>{section.copy}</p>
                  </article>
                ))}
              </div>
            </section>
            <section className="public-section two-panel">
              <div className="feature-panel warm">
                <div className="section-chip">Architecture</div>
                <p>React frontend, Node + Express backend, SQL database, salon-scoped APIs, role checks, feature flags, and backend-calculated billing totals.</p>
              </div>
              <div className="feature-panel cool">
                <div className="section-chip">Supportability</div>
                <p>Support threads, maintenance mode, demo leads, audit visibility, and tenant-aware admin controls make the platform easier to manage after launch too.</p>
              </div>
            </section>
            <section className="public-section architecture-bars">
              <div className="architecture-bar"><span>Frontend</span><strong>React</strong></div>
              <div className="architecture-bar"><span>Backend</span><strong>Node + Express</strong></div>
              <div className="architecture-bar"><span>Database</span><strong>MySQL</strong></div>
              <div className="architecture-bar"><span>Control layer</span><strong>RBAC + tenancy + feature flags</strong></div>
            </section>
          </>
        )}

        <section className="public-section" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.1)" }}>
            <img className="salon-cta-img" src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=400&fit=crop&crop=center" alt="Modern salon workspace" style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }} />
          </div>
        </section>

        <section className="public-section public-cta-band">
          <div>
            <div className="section-chip">Ready for walkthrough</div>
            <h2>See the platform with your own salon use case mapped live.</h2>
            <p>We can walk through branch structure, roles, services, billing flow, reports, and support controls in one demo.</p>
          </div>
          <div className="cta-stack">
            <Link to="/book-demo" className="cta-primary">Request Demo</Link>
            <Link to="/pricing" className="cta-secondary">Review Pricing</Link>
          </div>
        </section>

        <section className="public-section" style={{ paddingTop: 0 }}>
          <div className="feature-panel cool">
            <div className="section-chip">Policy & Contact</div>
            <div className="public-hero-actions">
              <Link to={settings?.termsUrl || "/terms"} className="cta-secondary">Terms</Link>
              <Link to={settings?.privacyUrl || "/privacy"} className="cta-secondary">Privacy</Link>
              <Link to={settings?.demoBookingUrl || "/book-demo"} className="cta-secondary">Book Demo</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <div className="footer-brand">
          <img src={brandLogo} alt="ReSpark" className="footer-brand-logo" />
          <div>
            <strong>{settings?.systemName || "ReSpark"}</strong>
            <p>{settings?.supportEmail || "support@respark.local"}</p>
          </div>
        </div>
        <div className="footer-links">
          <Link to="/features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/platform">Platform</Link>
          <Link to={settings?.termsUrl || "/terms"}>Terms</Link>
          <Link to={settings?.privacyUrl || "/privacy"}>Privacy</Link>
        </div>
      </footer>

      {whatsappHref && (
        <a href={whatsappHref} target="_blank" rel="noreferrer" className="whatsapp-fab">
          WhatsApp
        </a>
      )}
        </>
      )}
    </div>
  );
}
