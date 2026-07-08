import { useState, useEffect } from "react";
import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { api } from "../../api/client";
import "../../storefront.css";

export default function StorefrontLayout() {
  const { slug } = useParams();
  const location = useLocation();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const addToCart = (item) => {
    setCart([...cart, item]);
    alert("Added to cart!");
  };

  useEffect(() => {
    api.get(`/public/salon/${slug}`)
      .then(res => {
        const fullSalon = { ...res.data.salon, websiteConfig: res.data.websiteConfig, uiSettings: res.data.uiSettings, footerContent: res.data.footerContent };
        setSalon(fullSalon);
        setLoading(false);
        const wc = res.data.websiteConfig || {};
        const ui = res.data.uiSettings || {};
        const root = document.documentElement;
        const primaryColor = wc.primaryColor || ui.buttonColor || "#c8a97e";
        const secondaryColor = wc.secondaryColor || "#111111";
        root.style.setProperty("--sf-primary", secondaryColor);
        root.style.setProperty("--sf-accent", primaryColor);
        root.style.setProperty("--sf-secondary", secondaryColor);
        root.style.setProperty("--sf-text", secondaryColor);
        if (ui.buttonColor) root.style.setProperty("--button-bg", ui.buttonColor);
        if (ui.buttonHoverColor) root.style.setProperty("--button-bg-hover", ui.buttonHoverColor);
        if (ui.sidebarColor) root.style.setProperty("--sidebar-bg", ui.sidebarColor);
        if (ui.navbarColor) root.style.setProperty("--navbar-bg", ui.navbarColor);
        if (ui.fontColor) root.style.setProperty("--font-color", ui.fontColor);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    api.post(`/public/salon/${slug}/track`, { path: location.pathname }).catch(() => {});
  }, [slug, location.pathname]);

  if (loading) return <div className="storefront-wrapper"><div className="sf-placeholder-img">Loading...</div></div>;
  if (!salon) return <div className="storefront-wrapper"><div className="sf-placeholder-img">Store Not Found</div></div>;

  return (
    <div className="storefront-wrapper">
      <header className="sf-header">
        <div className="sf-nav-container">
          <Link to={`/site/${salon.slug}`} className="sf-brand">
            {salon.logoUrl ? <img src={salon.logoUrl} alt={salon.name} /> : <div style={{ width: 40, height: 40, background: '#111', borderRadius: 8 }} />}
            {salon.name}
          </Link>

          <button className="sf-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            <span className={`sf-hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
            <span className={`sf-hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
            <span className={`sf-hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
          </button>
          
          <nav className={`sf-nav-links ${mobileMenuOpen ? "sf-nav-open" : ""}`}>
            <Link to={`/site/${salon.slug}`} onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to={`/site/${salon.slug}/collections`} onClick={() => setMobileMenuOpen(false)}>Collections</Link>
            <Link to={`/site/${salon.slug}/about`} onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            <Link to={`/site/${salon.slug}/contact`} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          </nav>
          
          <div className="sf-header-actions">
            <Link to={`/site/${salon.slug}/cart`} className="sf-btn sf-btn-secondary">
              Cart ({cart.length})
            </Link>
            <Link to={`/site/${salon.slug}/book`} className="sf-btn sf-btn-primary">
              Book Appointment
            </Link>
          </div>
        </div>
      </header>
      
      <main>
        <Outlet context={{ salon, cart, addToCart }} />
      </main>
      
      <footer style={{ padding: '60px 20px', background: '#111', color: 'white', textAlign: 'center', marginTop: 'auto' }}>
        <p>&copy; {new Date().getFullYear()} {salon.name}. All rights reserved.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <Link to={`/site/${salon.slug}/terms`} style={{ color: "#cbd5e1" }}>Terms</Link>
          <Link to={`/site/${salon.slug}/privacy`} style={{ color: "#cbd5e1" }}>Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
