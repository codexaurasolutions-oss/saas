import { useState, useEffect } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&fit=crop";

export default function CategoryDetailPage() {
  const { salon } = useOutletContext();
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    if (!salon?.slug) return;
    Promise.all([
      api.get(`/public/salon/${salon.slug}/products`, { params: { categoryId } }).catch(() => ({ data: [] })),
      api.get(`/public/salon/${salon.slug}/categories`).catch(() => ({ data: [] }))
    ]).then(([prodRes, catRes]) => {
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setCategory((catRes.data || []).find(c => c.id === categoryId) || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [salon?.slug, categoryId]);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "price-low") return Number(a.sellingPrice) - Number(b.sellingPrice);
    if (sortBy === "price-high") return Number(b.sellingPrice) - Number(a.sellingPrice);
    if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const currency = salon.currency || "INR";

  return (
    <div>
      <div style={{ background: "#fafafa", padding: "60px 20px", borderBottom: "1px solid var(--sf-border, #e2e8f0)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Link to={`/site/${salon.slug}/collections`} style={{ color: "var(--sf-text-light, #999)", textDecoration: "none", marginBottom: 16, display: "inline-block" }}>&larr; Back to Collections</Link>
          <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "3rem", margin: 0, color: "var(--sf-primary, #111)" }}>
            {category ? category.name : "All Products"}
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--sf-text-light, #999)", marginTop: 12 }}>
            {products.length} product{products.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      <section className="sf-section">
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "220px 1fr", gap: 32 }}>
          <aside>
            <div style={{ position: "sticky", top: 100 }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#999", marginBottom: 12 }}>Categories</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Link to={`/site/${salon.slug}/collections`} style={{ padding: "8px 12px", borderRadius: 8, textDecoration: "none", color: !categoryId ? "var(--sf-accent, #c8a97e)" : "#555", fontWeight: !categoryId ? 700 : 500, background: !categoryId ? "var(--sf-accent, #c8a97e)11" : "transparent", fontSize: "0.9rem" }}>All Products</Link>
                {categories.map(cat => (
                  <Link key={cat.id} to={`/site/${salon.slug}/category/${cat.id}`} style={{ padding: "8px 12px", borderRadius: 8, textDecoration: "none", color: categoryId === cat.id ? "var(--sf-accent, #c8a97e)" : "#555", fontWeight: categoryId === cat.id ? 700 : 500, background: categoryId === cat.id ? "var(--sf-accent, #c8a97e)11" : "transparent", fontSize: "0.9rem" }}>{cat.name}</Link>
                ))}
              </div>

              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#999", marginTop: 24, marginBottom: 12 }}>Sort By</h3>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.9rem", background: "#fff" }}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </aside>

          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Loading products...</div>
            ) : sorted.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#999" }}>No products in this category yet.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                {sorted.map(product => (
                  <Link to={`/site/${salon.slug}/product/${product.id}`} key={product.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)", transition: "all .2s", border: "1px solid #f1f5f9" }}>
                      <div style={{ position: "relative" }}>
                        <img src={product.imageUrl || FALLBACK_IMG} alt={product.name} style={{ width: "100%", height: 220, objectFit: "cover" }} />
                        {product.salePrice && Number(product.salePrice) < Number(product.sellingPrice) && (
                          <span style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", background: "#ef4444", color: "#fff", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>
                            {Math.round((1 - Number(product.salePrice) / Number(product.sellingPrice)) * 100)}% OFF
                          </span>
                        )}
                      </div>
                      <div style={{ padding: 16 }}>
                        {product.category && <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#999", fontWeight: 600 }}>{product.category.name}</p>}
                        <h3 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 600 }}>{product.name}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, color: "var(--sf-accent, #c8a97e)" }}>{currency} {Number(product.salePrice || product.sellingPrice).toFixed(2)}</span>
                          {product.salePrice && Number(product.salePrice) < Number(product.sellingPrice) && (
                            <span style={{ fontSize: "0.85rem", color: "#999", textDecoration: "line-through" }}>{currency} {Number(product.sellingPrice).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
