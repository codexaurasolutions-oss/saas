import { useState, useEffect, useRef } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

const FALLBACK_CAT_IMAGES = [
  "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&fit=crop",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&fit=crop",
  "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&fit=crop",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&fit=crop",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&fit=crop",
  "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&fit=crop"
];
const FALLBACK_PROD_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&fit=crop";

const PRODUCTS_PER_PAGE = 12;

export default function HomePage() {
  const { salon } = useOutletContext();
  const [services, setServices] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [loading, setLoading] = useState(true);
  const categoryRollerRef = useRef(null);

  const scrollRoller = (dir) => {
    if (categoryRollerRef.current) {
      const scrollAmount = 300;
      categoryRollerRef.current.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  const config = salon?.websiteConfig || {
    heroTitle: "Elevate Your Beauty Experience",
    heroSubtitle: "Discover premium salon services and exclusive products curated just for you.",
    heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&fit=crop"
  };

  useEffect(() => {
    if (!salon?.slug) return;
    Promise.all([
      api.get(`/public/salon/${salon.slug}`).catch(() => ({ data: {} })),
      api.get(`/public/salon/${salon.slug}/categories`).catch(() => ({ data: [] })),
      api.get(`/public/salon/${salon.slug}/products`).catch(() => ({ data: [] }))
    ]).then(([salonRes, catRes, prodRes]) => {
      setServices(salonRes.data?.services || []);
      setCategories(catRes.data || []);
      setAllProducts(prodRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [salon.slug]);

  const visibleProducts = allProducts.slice(0, visibleCount);
  const hasMore = visibleCount < allProducts.length;
  const currency = salon.currency || "INR";

  return (
    <>
      {/* Hero */}
      <section className="sf-hero">
        <div className="sf-hero-content">
          <h1>{config.heroTitle || salon.name}</h1>
          <p>{config.heroSubtitle || "Discover premium salon services and products."}</p>
          <div className="sf-hero-buttons">
            <Link to={`/site/${salon.slug}/collections`} className="sf-btn sf-btn-primary">{config.heroBtn1Text || "Shop Collections"}</Link>
            <Link to={`/site/${salon.slug}/book`} className="sf-btn sf-btn-secondary">{config.heroBtn2Text || "Book Appointment"}</Link>
          </div>
        </div>
        <div className="sf-hero-visual">
          {config.heroImage ? (
            <img src={config.heroImage} alt={salon.name} />
          ) : (
            <div className="sf-placeholder-img">Image</div>
          )}
        </div>
      </section>

      {/* Categories Roller */}
      {categories.length > 0 && (
        <section className="sf-section" style={{ background: "#fafafa" }}>
          <div className="sf-section-header">
            <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>Discover</span>
            <h2>Featured Collections</h2>
            <p>Explore our carefully curated categories</p>
          </div>
          <div className="sf-roller-wrapper">
            <button className="sf-roller-btn left" onClick={() => scrollRoller("left")}>&larr;</button>
            <div className="sf-category-roller" ref={categoryRollerRef}>
              {categories.map((cat, idx) => (
                <Link to={`/site/${salon.slug}/category/${cat.id}`} key={cat.id} className="sf-category-circle-card">
                  <div className="sf-category-circle">
                    <img src={cat.imageUrl || FALLBACK_CAT_IMAGES[idx % FALLBACK_CAT_IMAGES.length]} alt={cat.name} />
                  </div>
                  <h3 className="sf-category-circle-title">{cat.name}</h3>
                </Link>
              ))}
            </div>
            <button className="sf-roller-btn right" onClick={() => scrollRoller("right")}>&rarr;</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link to={`/site/${salon.slug}/collections`} className="sf-btn sf-btn-secondary">View All Collections</Link>
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="sf-section">
        <div className="sf-section-header">
          <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>Trending</span>
          <h2>Our Products</h2>
          <p>{allProducts.length > 0 ? `${allProducts.length} product${allProducts.length !== 1 ? "s" : ""} available` : "Browse our collection"}</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Loading products...</div>
        ) : (
          <>
            <div className="sf-grid">
              {visibleProducts.map(product => (
                <Link to={`/site/${salon.slug}/product/${product.id}`} key={product.id} className="sf-product-card">
                  <div className="sf-product-media">
                    {product.salePrice && Number(product.salePrice) < Number(product.sellingPrice) && (
                      <div className="sf-product-badge" style={{ background: "#ef4444" }}>
                        {Math.round((1 - Number(product.salePrice) / Number(product.sellingPrice)) * 100)}% OFF
                      </div>
                    )}
                    <img src={product.imageUrl || FALLBACK_PROD_IMG} alt={product.name} />
                  </div>
                  <div className="sf-product-info">
                    {product.category && <span className="sf-product-category">{product.category.name}</span>}
                    <h3 className="sf-product-title">{product.name}</h3>
                    <p className="sf-product-price">
                      <span style={{ fontWeight: 700 }}>{currency} {Number(product.salePrice || product.sellingPrice).toFixed(2)}</span>
                      {product.salePrice && Number(product.salePrice) < Number(product.sellingPrice) && (
                        <span style={{ textDecoration: "line-through", opacity: 0.5, marginLeft: 6, fontSize: "0.85em" }}>{currency} {Number(product.sellingPrice).toFixed(2)}</span>
                      )}
                    </p>
                    <div style={{ marginTop: "auto", paddingTop: "20px", paddingBottom: "24px" }}>
                      <span className="sf-btn-outline">View Details</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <button
                  onClick={() => setVisibleCount(v => v + PRODUCTS_PER_PAGE)}
                  style={{
                    padding: "14px 48px",
                    background: "transparent",
                    color: "var(--sf-accent, #c8a97e)",
                    border: "2px solid var(--sf-accent, #c8a97e)",
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Load More ({allProducts.length - visibleCount} remaining)
                </button>
              </div>
            )}

            {/* Empty state */}
            {allProducts.length === 0 && services.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "#999" }}>
                <p>No products available yet. Check back soon!</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Featured Products from Services (if no e-commerce products) */}
      {!loading && allProducts.length === 0 && services.length > 0 && (
        <section className="sf-section">
          <div className="sf-section-header">
            <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>Our Services</span>
            <h2>Popular Services</h2>
          </div>
          <div className="sf-grid">
            {services.slice(0, 8).map((service, idx) => (
              <div key={service.id || idx} className="sf-product-card">
                <div className="sf-product-media">
                  <img src={`https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&fit=crop&sig=${idx}`} alt={service.name} />
                </div>
                <div className="sf-product-info">
                  <span className="sf-product-category">Service</span>
                  <h3 className="sf-product-title">{service.name}</h3>
                  <p className="sf-product-price">{currency} {Number(service.price).toFixed(2)}</p>
                  <div style={{ marginTop: "auto", paddingTop: "20px", paddingBottom: "24px" }}>
                    <Link to={`/site/${salon.slug}/book`} className="sf-btn-outline">Book Now</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="sf-section" style={{ background: "#fff" }}>
        <div className="sf-section-header">
          <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>The {salon.name} Standard</span>
          <h2>Why Choose Us</h2>
          <p>Experience the difference of true professional care.</p>
        </div>
        <div className="sf-features-split">
          <div className="sf-features-image">
            <img src={config.aboutImage || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop&sig=100"} alt={salon.name} />
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

      {/* CTA Banner */}
      {config.ctaTitle && (
        <section className="sf-section" style={{ background: "var(--sf-accent, #c8a97e)", color: "#fff", textAlign: "center", padding: "80px 20px" }}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: 12, color: "#fff" }}>{config.ctaTitle}</h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, marginBottom: 32 }}>{config.ctaSubtitle}</p>
          <Link to={config.ctaBtnLink || `/site/${salon.slug}/collections`} className="sf-btn sf-btn-secondary" style={{ borderColor: "#fff", color: "#fff" }}>
            {config.ctaBtnText || "Shop Now"}
          </Link>
        </section>
      )}

      {/* Testimonials */}
      <section className="sf-section" style={{ padding: "80px 0", overflow: "hidden" }}>
        <div className="sf-section-header">
          <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>Testimonials</span>
          <h2>Client Stories</h2>
        </div>
        <div className="sf-marquee-container">
          <div className="sf-marquee-content">
            {[1, 2].map((loop) => (
              <div key={loop} style={{ display: "flex", gap: "24px" }}>
                {(config.testimonials?.length > 0 ? config.testimonials : [
                  { author: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&fit=crop", text: "Absolutely the best salon experience I've ever had. The stylists truly listened to what I wanted and delivered perfection.", rating: 5 },
                  { author: "Michael R.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop", text: "The atmosphere is incredibly relaxing. I came in for a massage and facial, and felt like a completely new person leaving.", rating: 5 },
                  { author: "Emma Watson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&fit=crop", text: "Top-notch products and amazing service. They really know how to treat their clients. Highly recommended!", rating: 5 },
                  { author: "Chloe M.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop", text: "I got my bridal makeup done here and it stayed flawless all day. The team was so supportive and professional.", rating: 5 }
                ]).map((review, i) => (
                  <div className="sf-review-card" key={i}>
                    <div className="sf-review-header">
                      <img src={review.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&fit=crop"} className="sf-review-avatar" alt={review.author} />
                      <div>
                        <span className="sf-review-author">{review.author}</span>
                        <div className="sf-review-stars">{"★".repeat(review.rating || 5)}</div>
                      </div>
                    </div>
                    <p className="sf-review-text">"{review.text}"</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
