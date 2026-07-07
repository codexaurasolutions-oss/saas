import { Link, useOutletContext } from "react-router-dom";

export default function AboutPage() {
  const { salon } = useOutletContext();
  const config = salon?.websiteConfig || {};
  const currency = salon.currency || "INR";

  return (
    <div>
      {/* Hero Banner */}
      <div style={{ background: "#111", color: "white", padding: "80px 20px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "3.5rem", margin: 0 }}>{config.aboutTitle || `About ${salon.name}`}</h1>
        <p style={{ fontSize: "1.2rem", color: "#aaa", marginTop: 16, maxWidth: 600, margin: "16px auto 0" }}>
          {config.aboutDescription || "Discover our story, our mission, and what makes us different."}
        </p>
      </div>

      {/* Mission & Vision */}
      {(config.aboutMission || config.aboutVision) && (
        <section className="sf-section" style={{ background: "#fafafa" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            {config.aboutMission && (
              <div>
                <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>Our Mission</span>
                <h2 style={{ fontSize: "2rem", marginTop: 8, marginBottom: 16 }}>What We Stand For</h2>
                <p style={{ fontSize: "1.05rem", color: "#555", lineHeight: 1.8 }}>{config.aboutMission}</p>
              </div>
            )}
            {config.aboutVision && (
              <div>
                <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>Our Vision</span>
                <h2 style={{ fontSize: "2rem", marginTop: 8, marginBottom: 16 }}>Where We're Going</h2>
                <p style={{ fontSize: "1.05rem", color: "#555", lineHeight: 1.8 }}>{config.aboutVision}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="sf-section">
        <div className="sf-section-header">
          <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>Why Us</span>
          <h2>The {salon.name} Difference</h2>
          <p>Experience the difference of true professional care.</p>
        </div>
        <div className="sf-features-split">
          <div className="sf-features-image">
            {config.aboutImage ? (
              <img src={config.aboutImage} alt={salon.name} />
            ) : (
              <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop&sig=100" alt={salon.name} />
            )}
            <div className="sf-features-image-badge">
              <span className="sf-features-badge-number">10+</span>
              <span className="sf-features-badge-text">Years of Excellence</span>
            </div>
          </div>
          <div className="sf-features-list">
            <div className="sf-feature-item">
              <span className="sf-feature-number">01</span>
              <div>
                <h3 className="sf-feature-title">Premium Products</h3>
                <p className="sf-feature-text">We exclusively use top-tier, industry-leading products to ensure the best possible results for your hair and skin.</p>
              </div>
            </div>
            <div className="sf-feature-item">
              <span className="sf-feature-number">02</span>
              <div>
                <h3 className="sf-feature-title">Expert Stylists</h3>
                <p className="sf-feature-text">Our team consists of award-winning professionals continuously trained in the latest global trends and techniques.</p>
              </div>
            </div>
            <div className="sf-feature-item">
              <span className="sf-feature-number">03</span>
              <div>
                <h3 className="sf-feature-title">Serene Atmosphere</h3>
                <p className="sf-feature-text">Step into an oasis of calm. Our salon is designed to provide a relaxing, luxurious retreat from the busy world outside.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {config.galleryImages?.length > 0 && (
        <section className="sf-section" style={{ background: "#fafafa" }}>
          <div className="sf-section-header">
            <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>Gallery</span>
            <h2>Our Space</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
            {config.galleryImages.map((img, i) => (
              <img key={i} src={img} alt={`${salon.name} gallery ${i + 1}`} style={{ width: "100%", height: 250, objectFit: "cover", borderRadius: 12 }} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="sf-section" style={{ background: "var(--sf-accent, #c8a97e)", color: "#fff", textAlign: "center", padding: "80px 20px" }}>
        <h2 style={{ fontSize: "2.5rem", marginBottom: 12, color: "#fff" }}>Ready to Experience {salon.name}?</h2>
        <p style={{ fontSize: "1.1rem", opacity: 0.9, marginBottom: 32 }}>Book your appointment today and discover what makes us different.</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to={`/site/${salon.slug}/book`} className="sf-btn sf-btn-secondary" style={{ borderColor: "#fff", color: "#fff" }}>Book Appointment</Link>
          <Link to={`/site/${salon.slug}/collections`} className="sf-btn sf-btn-secondary" style={{ borderColor: "#fff", color: "#fff" }}>Shop Products</Link>
        </div>
      </section>
    </div>
  );
}
