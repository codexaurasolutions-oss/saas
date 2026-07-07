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
const FALLBACK_PROD_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&fit=crop";

export default function CollectionsPage() {
  const { salon } = useOutletContext();
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!salon?.slug) return;
    Promise.all([
      api.get(`/public/salon/${salon.slug}/categories`).catch(() => ({ data: [] })),
      api.get(`/public/salon/${salon.slug}/products`).catch(() => ({ data: [] }))
    ]).then(([catRes, prodRes]) => {
      setCategories(catRes.data || []);
      setAllProducts(prodRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [salon?.slug]);

  const currency = salon.currency || "INR";

  const filteredProducts = activeTab === "all"
    ? allProducts
    : allProducts.filter(p => p.categoryId === activeTab);

  const sorted = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return Number(a.salePrice || a.sellingPrice) - Number(b.salePrice || b.sellingPrice);
    if (sortBy === "price-high") return Number(b.salePrice || b.sellingPrice) - Number(a.salePrice || a.sellingPrice);
    if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ background: "#111", color: "white", padding: "80px 20px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "3.5rem", margin: 0 }}>All Collections</h1>
        <p style={{ fontSize: "1.2rem", color: "#aaa", marginTop: 16 }}>
          {allProducts.length > 0 ? `${allProducts.length} products across ${categories.length} categories` : "Browse our complete range of services and products."}
        </p>
      </div>

      <section className="sf-section">
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Loading collections...</div>
        ) : (
          <>
            {/* Category Tabs */}
            {categories.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
                <button
                  onClick={() => setActiveTab("all")}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 100,
                    border: "2px solid var(--sf-accent, #c8a97e)",
                    background: activeTab === "all" ? "var(--sf-accent, #c8a97e)" : "transparent",
                    color: activeTab === "all" ? "#fff" : "var(--sf-accent, #c8a97e)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  All ({allProducts.length})
                </button>
                {categories.map(cat => {
                  const count = allProducts.filter(p => p.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      style={{
                        padding: "10px 24px",
                        borderRadius: 100,
                        border: "2px solid var(--sf-accent, #c8a97e)",
                        background: activeTab === cat.id ? "var(--sf-accent, #c8a97e)" : "transparent",
                        color: activeTab === cat.id ? "#fff" : "var(--sf-accent, #c8a97e)",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sort + View */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <span style={{ color: "#666", fontSize: "0.9rem" }}>
                Showing {sorted.length} product{sorted.length !== 1 ? "s" : ""}
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: "8px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.9rem" }}
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Product Grid */}
            {sorted.length > 0 ? (
              <div className="sf-grid">
                {sorted.map(product => (
                  <Link to={`/site/${salon.slug}/product/${product.id}`} key={product.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)", transition: "all .2s", border: "1px solid #f1f5f9" }}>
                      <div style={{ position: "relative" }}>
                        <img src={product.imageUrl || FALLBACK_PROD_IMG} alt={product.name} style={{ width: "100%", height: 220, objectFit: "cover" }} />
                        {product.salePrice && Number(product.salePrice) < Number(product.sellingPrice) && (
                          <span style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", background: "#ef4444", color: "#fff", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>
                            {Math.round((1 - Number(product.salePrice) / Number(product.sellingPrice)) * 100)}% OFF
                          </span>
                        )}
                        {product.currentStock !== undefined && product.currentStock <= 0 && (
                          <span style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", background: "#000", color: "#fff", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>
                            Out of Stock
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
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "#999" }}>
                <p>No products found in this category.</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
