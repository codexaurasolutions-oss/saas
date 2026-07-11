import { useState, useEffect } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { api } from "../../api/client";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop";

export default function ProductDetailPage() {
  const { salon, addToCart } = useOutletContext();
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!salon?.slug || !id) return;
    api.get(`/public/salon/${salon.slug}/product/${id}`)
      .then(res => { setProduct(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [salon?.slug, id]);

  if (loading) return <div style={{ maxWidth: 1300, margin: "0 auto", padding: "60px 20px", textAlign: "center", color: "#999" }}>Loading product...</div>;
  if (!product) return <div style={{ maxWidth: 1300, margin: "0 auto", padding: "60px 20px", textAlign: "center", color: "#999" }}>Product not found</div>;

  const allImages = [product.imageUrl, ...(Array.isArray(product.displayImages) ? product.displayImages : [])].filter(Boolean);
  if (allImages.length === 0) allImages.push(FALLBACK_IMG);
  const price = Number(product.salePrice || product.sellingPrice);
  const currency = salon.currency || "INR";

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "60px 20px" }}>
      <Link to={`/site/${salon.slug}/collections`} style={{ color: "var(--sf-text-light, #999)", textDecoration: "none", marginBottom: 32, display: "inline-block" }}>&larr; Back to Collections</Link>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
        <div>
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
            <img src={allImages[selectedImage]} alt={product.name} style={{ width: "100%", height: 480, objectFit: "cover" }} />
          </div>
          {allImages.length > 1 && (
            <div style={{ display: "flex", gap: 8 }}>
              {allImages.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => setSelectedImage(i)} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: selectedImage === i ? "2px solid var(--sf-accent, #c8a97e)" : "2px solid transparent" }} />
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && <span style={{ display: "inline-block", padding: "4px 12px", background: "var(--sf-accent, #c8a97e)22", color: "var(--sf-accent, #c8a97e)", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600, marginBottom: 12 }}>{product.category.name}</span>}
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 8px" }}>{product.name}</h1>
          {product.sku && <p style={{ color: "#999", fontSize: "0.85rem", margin: "0 0 16px" }}>SKU: {product.sku}</p>}
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--sf-accent, #c8a97e)", margin: "0 0 16px" }}>
            {currency} {price.toFixed(2)}
            {product.salePrice && product.sellingPrice && Number(product.salePrice) < Number(product.sellingPrice) && (
              <span style={{ fontSize: "1rem", color: "#999", textDecoration: "line-through", marginLeft: 8 }}>{currency} {Number(product.sellingPrice).toFixed(2)}</span>
            )}
          </div>
          {product.description && <p style={{ color: "#555", lineHeight: 1.7, margin: "0 0 24px" }}>{product.description}</p>}
          {product.benefits && <div style={{ marginBottom: 16 }}><strong style={{ fontSize: "0.85rem" }}>Benefits:</strong><p style={{ color: "#555", fontSize: "0.9rem", margin: "4px 0 0" }}>{product.benefits}</p></div>}
          {product.ingredients && <div style={{ marginBottom: 16 }}><strong style={{ fontSize: "0.85rem" }}>Ingredients:</strong><p style={{ color: "#555", fontSize: "0.9rem", margin: "4px 0 0" }}>{product.ingredients}</p></div>}
          {product.usageInstructions && <div style={{ marginBottom: 16 }}><strong style={{ fontSize: "0.85rem" }}>How to Use:</strong><p style={{ color: "#555", fontSize: "0.9rem", margin: "4px 0 0" }}>{product.usageInstructions}</p></div>}
          
          <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "24px 0" }}>
            <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 40, height: 40, border: "none", background: "#f8fafc", cursor: "pointer", fontSize: "1.1rem" }}>-</button>
              <span style={{ width: 48, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{qty}</span>
              <button onClick={() => setQty(Math.min(product.currentStock || 99, qty + 1))} style={{ width: 40, height: 40, border: "none", background: "#f8fafc", cursor: "pointer", fontSize: "1.1rem" }}>+</button>
            </div>
            {product.currentStock > 0 ? (
              <button onClick={() => { addToCart({ id: product.id, name: product.name, imageUrl: product.imageUrl, sellingPrice: product.sellingPrice, salePrice: product.salePrice, category: product.category, currentStock: product.currentStock }, qty); alert("Added to cart!"); setQty(1); }} style={{ flex: 1, padding: "14px 24px", background: "var(--sf-accent, #c8a97e)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}>
                Add to Cart - {currency} {(price * qty).toFixed(2)}
              </button>
            ) : (
              <button disabled style={{ flex: 1, padding: "14px 24px", background: "#d1d5db", color: "#6b7280", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "1rem", cursor: "not-allowed" }}>
                Out of Stock
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 24, paddingTop: 24, borderTop: "1px solid #f1f5f9" }}>
            {product.currentStock > 0 && <span style={{ fontSize: "0.85rem", color: "#10b981" }}>&#10003; In Stock ({product.currentStock} available)</span>}
            {product.currentStock <= 0 && <span style={{ fontSize: "0.85rem", color: "#ef4444" }}>Out of Stock</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
