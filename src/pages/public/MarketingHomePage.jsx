import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../api/client";
import PublicMobileMenu from "../../components/PublicMobileMenu";
import {
  LayoutDashboard, Calendar, Users, CreditCard, BarChart3, Package, Settings, Shield,
  Store, ShoppingCart, FileText, UserCheck, Gift, MessageSquare, Megaphone, Star,
  Clock, MapPin, Bell, HeadphonesIcon, Globe, Repeat, Wallet, TrendingUp,
  ClipboardList, Tags, PieChart, Truck, Check
} from "lucide-react";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Platform", to: "/platform" },
  { label: "Request Demo", to: "/book-demo" }
];

const salonImages = {
  hero: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=900&fit=crop&crop=center",
  styling: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop",
  beauty: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop",
  interior: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=400&fit=crop",
  cta: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=500&fit=crop&crop=center",
  team: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop"
};

const features = [
  { icon: LayoutDashboard, title: "Multi-Branch Control", desc: "Manage unlimited branches from one dashboard. Branch-wise reporting, staff, and inventory." },
  { icon: CreditCard, title: "POS & Invoicing", desc: "Lightning-fast POS with backend-calculated totals, PDF receipts, and payment tracking." },
  { icon: Users, title: "Customer CRM", desc: "Complete customer profiles with notes, tags, birthdays, anniversaries, and billing history." },
  { icon: BarChart3, title: "Smart Reports", desc: "Sales, revenue, staff performance, branch comparison, and exportable CSV reports." },
  { icon: Shield, title: "Role-Based Access", desc: "Owner, manager, receptionist, staff - each role gets exactly the access they need." },
  { icon: HeadphonesIcon, title: "Support System", desc: "Built-in ticketing with thread trails, internal notes, and support event history." }
];

const featureCategories = [
  {
    title: "Unified Owner/Admin Panel",
    icon: LayoutDashboard,
    color: "#0d9488",
    bg: "#f0fdfa",
    features: [
      "One shared panel for owner, receptionist, manager, staff, and accountant users.",
      "Role-based sidebar and backend permission checks keep every user inside assigned scope.",
      "Branch-aware operations, custom roles, archived users, and staff-service assignment.",
      "My Workspace for staff: dashboard, appointments, schedule, commission, profile."
    ]
  },
  {
    title: "Billing & POS",
    icon: CreditCard,
    color: "#f59e0b",
    bg: "#fffbeb",
    features: [
      "POS creates invoices with backend-calculated totals, payment updates, receipt HTML, and PDF output.",
      "Customers carry notes, tags, source, birthdays, anniversaries, and billing history.",
      "Reports cover sales, payments, branches, staff-service output, customer totals, and CSV export.",
      "Payment tracking with multiple methods: cash, card, UPI, wallet, split payments."
    ]
  },
  {
    title: "E-Commerce & Online Orders",
    icon: Store,
    color: "#10b981",
    bg: "#ecfdf5",
    features: [
      "Professional website editor with sections, color picker, card shapes, banner editor.",
      "Dynamic storefront with real products, categories, cart, and checkout.",
      "Online orders management with status flow: New → Accepted → Ready → Completed.",
      "Website analytics dashboard with revenue, orders, and product performance."
    ]
  },
  {
    title: "Staff & Workforce",
    icon: Users,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    features: [
      "Staff assignment to services, branches, and schedules with availability tracking.",
      "Custom roles with granular permissions for every module and action.",
      "Commission tracking, attendance, payroll runs, and salary management.",
      "Staff notifications, announcements, and internal messaging."
    ]
  },
  {
    title: "Marketing & Growth",
    icon: Megaphone,
    color: "#ec4899",
    bg: "#fdf2f8",
    features: [
      "WhatsApp integration with settings, logs, and automation flows.",
      "Campaign management with templates, scheduling, and conversion tracking.",
      "SMS and email campaigns with audience targeting and delivery reports.",
      "Loyalty points, coupons, gift cards, and referral programs."
    ]
  },
  {
    title: "Customer Experience",
    icon: Star,
    color: "#f97316",
    bg: "#fff7ed",
    features: [
      "Customer portal for bookings, orders, invoices, and loyalty history.",
      "Feedback collection, ratings, and satisfaction reports.",
      "Enquiry capture, assignment, follow-ups, and conversion tracking.",
      "Support tickets with thread trails, internal notes, and priority management."
    ]
  }
];

const allFeatures = [
  { icon: LayoutDashboard, title: "Dashboard", desc: "Real-time overview of revenue, appointments, orders, and staff performance." },
  { icon: Calendar, title: "Appointments", desc: "Book, reschedule, and manage appointments with calendar views and reminders." },
  { icon: CreditCard, title: "POS & Invoicing", desc: "Lightning-fast POS with backend-calculated totals, PDF receipts, and payment tracking." },
  { icon: Users, title: "Customer CRM", desc: "Complete customer profiles with notes, tags, birthdays, anniversaries, and billing history." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Sales, revenue, staff performance, branch comparison, and exportable CSV reports." },
  { icon: Package, title: "Inventory Management", desc: "Products, stock movements, purchase orders, suppliers, and low-stock alerts." },
  { icon: Store, title: "E-Commerce Store", desc: "Professional storefront with products, categories, cart, checkout, and online orders." },
  { icon: Globe, title: "Website Editor", desc: "Customize hero, sections, colors, card shapes, banners, and testimonials." },
  { icon: ShoppingCart, title: "Online Orders", desc: "Accept, process, and fulfill online orders with status tracking and invoice conversion." },
  { icon: MapPin, title: "Multi-Branch", desc: "Manage unlimited branches with branch-wise reporting, staff, and inventory." },
  { icon: UserCheck, title: "Staff Management", desc: "Assign services, track availability, manage schedules, and calculate commissions." },
  { icon: Shield, title: "Role-Based Access", desc: "Owner, manager, receptionist, staff - each role gets exactly the access they need." },
  { icon: Gift, title: "Memberships & Packages", desc: "Recurring membership plans and prepaid packages with usage tracking." },
  { icon: Star, title: "Loyalty Program", desc: "Points, tiers, rewards, and redemption rules to boost customer retention." },
  { icon: Tags, title: "Coupons & Gift Cards", desc: "Discount coupons, percentage-off deals, and digital gift cards." },
  { icon: MessageSquare, title: "WhatsApp Integration", desc: "Automated messages, notifications, and conversation logs." },
  { icon: Megaphone, title: "Campaigns", desc: "SMS, email, and WhatsApp campaigns with templates and conversion tracking." },
  { icon: FileText, title: "Enquiries", desc: "Capture, assign, follow up, and convert enquiries from multiple sources." },
  { icon: HeadphonesIcon, title: "Support Tickets", desc: "Ticketing system with thread trails, internal notes, and priority management." },
  { icon: PieChart, title: "Expense Tracking", desc: "Track expenses by type, category, account, and generate financial reports." },
  { icon: Wallet, title: "Payroll", desc: "Salary calculations, deductions, advances, and payroll run management." },
  { icon: Repeat, title: "Feedback & Reviews", desc: "Collect customer feedback, ratings, and generate satisfaction reports." },
  { icon: Bell, title: "Notifications", desc: "In-app, email, and push notifications with configurable toggles." },
  { icon: Clock, title: "Audit Logs", desc: "Complete activity trail for compliance, debugging, and accountability." },
  { icon: Truck, title: "Stock Transfers", desc: "Move inventory between branches with approval workflows." },
  { icon: ClipboardList, title: "Attendance", desc: "Clock in/out, attendance reports, and shift management." },
  { icon: TrendingUp, title: "Trends & Insights", desc: "AI-powered trends, peak hours analysis, and growth predictions." },
  { icon: Settings, title: "Settings", desc: "Business hours, tax rates, notifications, legal content, and UI customization." }
];

const stats = [
  { value: "4,924+", label: "Active Invoices" },
  { value: "184", label: "Staff Members" },
  { value: "12", label: "Branches Active" },
  { value: "24%", label: "Monthly Growth" }
];

const industries = ["Hair Salons", "Beauty Studios", "Spa Chains", "Nail Bars", "Tattoo Studios", "Beauty Clinics", "Pet Grooming"];

const defaultPlans = [
  { id: "starter", name: "Starter", monthlyPrice: 4999, yearlyPrice: 49990, branchLimit: 9999, userLimit: 5, customerLimit: 500, invoiceLimit: 1000, storageLimit: 5, featureFlags: { pos: true, crm: true, reports: true } },
  { id: "growth", name: "Growth", monthlyPrice: 9999, yearlyPrice: 99990, branchLimit: 9999, userLimit: 20, customerLimit: 3000, invoiceLimit: 10000, storageLimit: 20, featureFlags: { pos: true, crm: true, reports: true, whatsapp: true, digitalCatalog: true } },
  { id: "scale", name: "Scale", monthlyPrice: 17999, yearlyPrice: 179990, branchLimit: 9999, userLimit: 100, customerLimit: 20000, invoiceLimit: 50000, storageLimit: 100, featureFlags: { pos: true, crm: true, reports: true, whatsapp: true, digitalCatalog: true, customerPortal: true, loyalty: true } }
];

const testimonials = [
  { name: "Priya Sharma", role: "Owner, Luxe Studio", text: "ReSpark transformed how we manage 3 branches. The POS is lightning fast and reports give me real-time visibility.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop" },
  { name: "Rahul Mehta", role: "Director, Glamour Salon", text: "Finally a platform built for Indian salons. The multi-branch feature alone saved us hours of manual coordination.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop" },
  { name: "Ananya Patel", role: "Manager, Spa Bliss", text: "Customer CRM is amazing. We track every client's preferences, birthdays, and history. Our retention increased 40%.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop" }
];

export default function MarketingHomePage() {
  const location = useLocation();
  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/public/settings"), api.get("/public/plans").catch(() => ({ data: [] }))])
      .then(([settingsRes, plansRes]) => {
        if (!active) return;
        setSettings(settingsRes.data);
        setPlans(Array.isArray(plansRes.data) && plansRes.data.length ? plansRes.data : defaultPlans);
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const whatsappHref = settings?.whatsappNumber
    ? `https://wa.me/${String(settings.whatsappNumber).replace(/[^\d]/g, "")}`
    : null;
  const pricingCurrency = String(settings?.defaultCurrency || "INR").toUpperCase();
  const currencySymbol = pricingCurrency === "PKR" ? "Rs" : pricingCurrency === "AED" ? "AED" : "₹";

  const isHome = location.pathname === "/";
  const isFeatures = location.pathname === "/features";
  const isPricing = location.pathname === "/pricing";
  const isPlatform = location.pathname === "/platform";

  useEffect(() => {
    const titles = { "/": "ReSpark - Salon ERP Platform", "/features": "Features | ReSpark", "/pricing": "Pricing | ReSpark", "/platform": "Platform | ReSpark" };
    document.title = titles[location.pathname] || "ReSpark";
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "4px solid #e2e8f0", borderTopColor: "#0d9488", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: "#64748b", fontSize: 14 }}>Loading ReSpark...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>R</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", lineHeight: 1.2 }}>ReSpark</div>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Salon ERP Platform</div>
            </div>
          </Link>
          <nav className="public-nav-links" style={{ gap: 32 }}>
            {navLinks.map(item => (
              <Link key={item.to} to={item.to} style={{ textDecoration: "none", fontSize: 14, fontWeight: 500, color: location.pathname === item.to ? "#0d9488" : "#64748b", transition: "color 0.2s" }}>{item.label}</Link>
            ))}
          </nav>
          <div className="public-nav-cta" style={{ gap: 12 }}>
            <Link to="/login" style={{ textDecoration: "none", fontSize: 14, fontWeight: 600, color: "#64748b", padding: "8px 16px" }}>Login</Link>
            <Link to="/book-demo" style={{ textDecoration: "none", fontSize: 14, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #0d9488, #14b8a6)", padding: "10px 24px", borderRadius: 10, boxShadow: "0 2px 8px rgba(13,148,136,0.3)" }}>Request Demo</Link>
          </div>
          <PublicMobileMenu
            brand={{ label: "ReSpark", sublabel: "Salon ERP Platform", logo: "/logo-respark.svg", to: "/" }}
            items={navLinks}
            cta={{ label: "Book Demo", to: "/book-demo" }}
          />
        </div>
      </header>

      <main>
        {/* ============ HOME PAGE ============ */}
        {isHome && (
          <>
            {/* HERO */}
            <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #f0fdfa 0%, #f8fafc 50%, #ecfdf5 100%)" }}>
              <div className="public-hero" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 60px", gap: 60 }}>
                <div>
                  <div style={{ display: "inline-block", padding: "6px 16px", background: "#ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 20 }}>SALON ERP PLATFORM</div>
                  <h1 className="marketing-hero-heading" style={{ margin: "0 0 20px" }}>
                    Run your entire salon business from one calm, <span style={{ color: "#0d9488" }}>controlled</span> operating system.
                  </h1>
                  <p style={{ fontSize: "1.15rem", color: "#64748b", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 520 }}>
                    ReSpark brings Super Admin controls, a unified owner/admin panel, POS billing, team permissions, CRM, support, and reporting into one responsive platform for modern salon businesses.
                  </p>
                  <div className="public-hero-actions" style={{ display: "flex", gap: 16, marginBottom: 40 }}>
                    <Link to="/book-demo" style={{ textDecoration: "none", fontSize: 16, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #0d9488, #14b8a6)", padding: "16px 36px", borderRadius: 12, boxShadow: "0 4px 16px rgba(13,148,136,0.3)", transition: "all 0.2s" }}>Request Demo</Link>
                    <Link to="/pricing" style={{ textDecoration: "none", fontSize: 16, fontWeight: 700, color: "#0d9488", background: "#fff", padding: "16px 36px", borderRadius: 12, border: "2px solid #0d9488", transition: "all 0.2s" }}>See Pricing</Link>
                  </div>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    {["Unified panel", "MySQL-backed", "PDF invoices", "Role-based access"].map(item => (
                      <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#14b8a6" }} />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ position: "relative" }}>
                  {/* Main Salon Banner Image */}
                  <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", position: "relative" }}>
                    <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop&crop=center" alt="Premium salon interior" style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "40px 24px 24px" }}>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "12px 16px", color: "#fff" }}>
                          <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Live Revenue</div>
                          <div style={{ fontSize: 20, fontWeight: 800 }}>₹3,84,240</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "12px 16px", color: "#fff" }}>
                          <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Active Invoices</div>
                          <div style={{ fontSize: 20, fontWeight: 800 }}>4,924</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "12px 16px", color: "#fff" }}>
                          <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Staff</div>
                          <div style={{ fontSize: 20, fontWeight: 800 }}>184</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Floating badge */}
                  <div style={{ position: "absolute", top: -16, right: -16, background: "#fff", borderRadius: 16, padding: "12px 20px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10, zIndex: 3 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #10b981, #34d399)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>✓</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>12 Branches</div>
                      <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>↑ 24% growth</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* STATS BAR */}
            <section style={{ background: "#0f172a", padding: "40px 24px" }}>
              <div className="marketing-stats-grid" style={{ maxWidth: 1200, margin: "0 auto" }}>
                {stats.map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#14b8a6" }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* SALON IMAGES GRID */}
            <section style={{ padding: "80px 24px", background: "#fff" }}>
              <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>OUR WORLD</div>
                <h2 className="marketing-section-heading">Built for Premium Salons</h2>
                <p style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: 600, margin: "0 auto" }}>From luxury spas to neighborhood studios, ReSpark powers the modern salon experience.</p>
              </div>
              <div className="marketing-images-grid" style={{ maxWidth: 1200, margin: "0 auto" }}>
                {[salonImages.styling, salonImages.spa, salonImages.beauty].map((img, i) => (
                  <div key={i} style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", transition: "all 0.3s", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.15)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.08)"; }}>
                    <img src={img} alt="" style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            </section>

            {/* FEATURES */}
            <section style={{ padding: "80px 24px", background: "#f8fafc" }}>
              <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>FEATURES</div>
                <h2 className="marketing-section-heading">Everything Your Salon Needs</h2>
                <p style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: 600, margin: "0 auto" }}>One platform to manage branches, staff, customers, billing, and growth.</p>
              </div>
              <div className="marketing-features-grid" style={{ maxWidth: 1200, margin: "0 auto" }}>
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #e2e8f0", transition: "all 0.2s", cursor: "default" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                        <Icon size={24} color="#0d9488" />
                      </div>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{f.title}</h3>
                      <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* WHY CHOOSE US */}
            <section style={{ padding: "80px 24px", background: "#fff" }}>
              <div className="marketing-why-grid" style={{ maxWidth: 1200, margin: "0 auto", alignItems: "center" }}>
                <div>
                  <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>WHY REARK</div>
                  <h2 className="marketing-section-heading" style={{ margin: "0 0 20px", lineHeight: 1.2 }}>One operational rhythm from front desk to owner reporting.</h2>
                  <p style={{ fontSize: "1.05rem", color: "#64748b", lineHeight: 1.7, margin: "0 0 32px" }}>
                    The platform reduces scattered processes by keeping customers, services, staff access, invoices, payments, reports, and support inside one unified operational structure.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {["Multi-branch control", "POS and invoice handling", "Customer CRM", "Permission-led staff access"].map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 8, background: "#ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#0f766e", fontWeight: 700 }}>✓</div>
                        <span style={{ fontSize: 15, color: "#334155", fontWeight: 500 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
                  <img src={salonImages.interior} alt="Salon workspace" style={{ width: "100%", height: 400, objectFit: "cover" }} />
                </div>
              </div>
            </section>

            {/* INDUSTRIES */}
            <section style={{ padding: "60px 24px", background: "#f8fafc" }}>
              <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>INDUSTRIES</p>
                <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", margin: "0 0 32px" }}>Built for salon-style workflows</h3>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  {industries.map(ind => (
                    <span key={ind} style={{ padding: "10px 24px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 100, fontSize: 14, fontWeight: 500, color: "#334155" }}>{ind}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* TESTIMONIALS */}
            <section style={{ padding: "80px 24px", background: "#fff" }}>
              <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>TESTIMONIALS</div>
                <h2 className="marketing-section-heading" style={{ margin: 0 }}>What Salon Owners Say</h2>
              </div>
              <div className="marketing-testimonials-grid" style={{ maxWidth: 1200, margin: "0 auto" }}>
                {testimonials.map((t, i) => (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 16, padding: 32, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                      <img src={t.avatar} alt={t.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>{t.name}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{t.role}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>"{t.text}"</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ============ FEATURES PAGE ============ */}
        {isFeatures && (
          <>
            {/* Feature Categories */}
            <section style={{ padding: "60px 24px", maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>FEATURE CATEGORIES</div>
                <h2 className="marketing-section-heading">Deep dive into each module</h2>
              </div>
              <div className="marketing-categories-grid">
                {featureCategories.map((cat, i) => {
                  const CatIcon = cat.icon;
                  return (
                    <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CatIcon size={22} color={cat.color} />
                        </div>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>{cat.title}</h3>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {cat.features.map((feat, j) => (
                          <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <Check size={16} color={cat.color} style={{ marginTop: 3, flexShrink: 0 }} />
                            <span style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* All 28 Features Grid */}
            <section style={{ padding: "60px 24px", background: "#f8fafc" }}>
              <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                  <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>ALL FEATURES</div>
                  <h2 className="marketing-section-heading">{allFeatures.length} features built for real salon operations</h2>
                  <p style={{ fontSize: "1rem", color: "#64748b" }}>Every module is designed around how salons actually work.</p>
                </div>
                <div className="marketing-all-features-grid">
                  {allFeatures.map((f, i) => {
                    const FeatIcon = f.icon;
                    return (
                      <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1px solid #e2e8f0", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                          <FeatIcon size={20} color="#0d9488" />
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{f.title}</h4>
                        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ============ PRICING PAGE ============ */}
        {isPricing && (
          <section style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>PLANS & PRICING</div>
              <h1 className="marketing-hero-heading" style={{ margin: "0 0 16px" }}>Choose the plan that matches your salon growth stage.</h1>
              <p style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: 700, margin: "0 auto" }}>Transparent limits, clear feature access, and room for custom plans.</p>
            </div>
            <div className="marketing-plans-grid">
              {plans.map((plan) => (
                <div key={plan.id} style={{ background: "#fff", borderRadius: 20, padding: 32, border: plan.isPopular ? "2px solid #0d9488" : "1px solid #e2e8f0", position: "relative", boxShadow: plan.isPopular ? "0 8px 30px rgba(13,148,136,0.15)" : "none" }}>
                  {plan.isPopular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#0d9488", color: "#fff", padding: "4px 16px", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>MOST POPULAR</div>}
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Standard tier</div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>{plan.name}</h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 20, color: "#64748b" }}>{currencySymbol}</span>
                    <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#0f172a" }}>{Number(plan.monthlyPrice).toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: 14, color: "#64748b" }}>/mo</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>Yearly: {currencySymbol}{Number(plan.yearlyPrice).toLocaleString("en-IN")}/yr</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                    {[`Unlimited Branches`, `${plan.userLimit} Staff Users`, `${plan.customerLimit} Customers`, `${plan.invoiceLimit} Invoices/mo`, `${plan.storageLimit} GB Storage`].map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#475569" }}>
                        <span style={{ color: "#14b8a6", fontWeight: 700 }}>✓</span> {item}
                      </div>
                    ))}
                  </div>
                  <Link to="/book-demo" style={{ display: "block", textAlign: "center", padding: "14px", background: plan.isPopular ? "linear-gradient(135deg, #0d9488, #14b8a6)" : "#f8fafc", color: plan.isPopular ? "#fff" : "#0d9488", borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: "none", border: plan.isPopular ? "none" : "1px solid #e2e8f0" }}>Request Walkthrough</Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ PLATFORM PAGE ============ */}
        {isPlatform && (
          <section style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>PLATFORM</div>
              <h1 className="marketing-hero-heading" style={{ margin: "0 0 16px" }}>Built specifically for salons that need discipline, visibility, and scale.</h1>
              <p style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: 700, margin: "0 auto" }}>This is not a generic dashboard. The product structure follows real salon operations.</p>
            </div>
            <div className="marketing-platform-grid">
              {[
                { title: "Multi-Tenant Isolation", desc: "Each salon is logically isolated at the query level using secure client references." },
                { title: "Secure JWT Authentication", desc: "Cryptographic access tokens ensure backend routers confirm actor role and permissions." },
                { title: "RBAC + Feature Flags", desc: "Permissions, feature flags, and maintenance mode enforced on the backend." },
                { title: "Branch-Aware Architecture", desc: "Services, products, invoices, and reports are branch-scoped for clean operations." }
              ].map((item, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 16, padding: 32, border: "1px solid #e2e8f0" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="marketing-platform-badges-grid" style={{ marginTop: 40 }}>
              {[{ label: "Frontend", value: "React" }, { label: "Backend", value: "Node + Express" }, { label: "Database", value: "MySQL" }, { label: "Control", value: "RBAC + Tenancy" }].map((b, i) => (
                <div key={i} style={{ background: "#0f172a", borderRadius: 12, padding: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{b.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#14b8a6" }}>{b.value}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA BAND (all pages) */}
        <section style={{ padding: "80px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", textAlign: "center" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "inline-block", padding: "6px 16px", background: "rgba(20,184,166,0.1)", color: "#14b8a6", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>READY FOR WALKTHROUGH</div>
            <h2 className="marketing-section-heading" style={{ color: "#fff", margin: "0 0 16px" }}>See the platform with your salon use case mapped live.</h2>
            <p style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: 32 }}>We can walk through branch structure, roles, services, billing flow, reports, and support controls in one demo.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <Link to="/book-demo" style={{ textDecoration: "none", fontSize: 16, fontWeight: 700, color: "#0f172a", background: "#fff", padding: "16px 36px", borderRadius: 12 }}>Request Demo</Link>
              <Link to="/pricing" style={{ textDecoration: "none", fontSize: 16, fontWeight: 700, color: "#fff", background: "transparent", padding: "16px 36px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.2)" }}>Review Pricing</Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ padding: "40px 24px", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>R</div>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{settings?.systemName || "ReSpark"}</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <Link to="/features" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Features</Link>
            <Link to="/pricing" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Pricing</Link>
            <Link to="/platform" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Platform</Link>
            <Link to="/terms" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Terms</Link>
            <Link to="/privacy" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Privacy</Link>
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>© {new Date().getFullYear()} {settings?.systemName || "ReSpark"}. All rights reserved.</div>
        </div>
      </footer>

      {/* WHATSAPP FAB */}
      {whatsappHref && (
        <a href={whatsappHref} target="_blank" rel="noreferrer" style={{ position: "fixed", bottom: 24, right: 24, background: "#25d366", color: "#fff", padding: "14px 24px", borderRadius: 100, fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 16px rgba(37,211,102,0.4)", zIndex: 1000, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>💬</span> WhatsApp
        </a>
      )}
    </div>
  );
}
