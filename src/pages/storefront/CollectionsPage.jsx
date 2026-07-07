import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&h=300&fit=crop"
];

export default function CollectionsPage() {
  const { salon } = useOutletContext();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salon?.slug) return;
    Promise.all([
      api.get(`/public/salon/${salon.slug}/categories`).catch(() => ({ data: [] })),
      api.get(`/public/salon/${salon.slug}/products`).catch(() => ({ data: [] }))
    ]).then(([catRes, prodRes]) => {
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [salon?.slug]);

  const getCategoryProductCount = (catId) => products.filter(p => p.categoryId === catId).length;

  return (
    <div>
      <div style={{ background: "#111", color: "white", padding: "80px 20px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "3.5rem", margin: 0 }}>All Collections</h1>
        <p style={{ fontSize: "1.2rem", color: "#aaa", marginTop: 16 }}>
          {categories.length > 0 ? `Browse our ${categories.length} categories` : "Browse our complete range of services and products."}
        </p>
      </div>

      <section className="sf-section">
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Loading collections...</div>
        ) : categories.length > 0 ? (
          <div className="sf-grid">
            {categories.map((cat, idx) => (
              <Link to={`/site/${salon.slug}/category/${cat.id}`} key={cat.id} className="sf-category-card">
                <img src={cat.imageUrl || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]} alt={cat.name} />
                <div className="sf-category-overlay">
                  <h3>{cat.name}</h3>
                  <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    {getCategoryProductCount(cat.id)} Items <span style={{ fontSize: "1.2rem" }}>&rarr;</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div>
            <h2 style={{ textAlign: "center", marginBottom: 32 }}>All Products</h2>
            <div className="sf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {products.map(product => (
                <Link to={`/site/${salon.slug}/product/${product.id}`} key={product.id} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)", transition: "all .2s" }}>
                    <img src={product.imageUrl || FALLBACK_IMAGES[0]} alt={product.name} style={{ width: "100%", height: 200, objectFit: "cover" }} />
                    <div style={{ padding: 16 }}>
                      <h3 style={{ margin: "0 0 4px", fontSize: "1rem" }}>{product.name}</h3>
                      {product.category && <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "#999" }}>{product.category.name}</p>}
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--sf-accent, #c8a97e)" }}>{salon.currency || "INR"} {Number(product.salePrice || product.sellingPrice).toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>
            <p>No collections or products available yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
