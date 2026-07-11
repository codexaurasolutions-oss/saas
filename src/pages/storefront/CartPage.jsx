import { Link, useOutletContext } from "react-router-dom";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&fit=crop";

export default function CartPage() {
  const { salon, cart, removeFromCart, updateCartQty } = useOutletContext();
  const currency = salon.currency || "INR";

  const subtotal = cart.reduce((sum, item) => {
    const price = item.salePrice && Number(item.salePrice) > 0 && Number(item.salePrice) < Number(item.sellingPrice)
      ? Number(item.salePrice) : Number(item.sellingPrice);
    return sum + price * item.qty;
  }, 0);

  if (cart.length === 0) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 20px', minHeight: '60vh', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '3rem', margin: '0 0 24px', color: 'var(--sf-primary)' }}>Your Cart</h1>
        <p style={{ color: '#999', fontSize: '1.1rem', marginBottom: 32 }}>Your cart is empty.</p>
        <Link to={`/site/${salon.slug}/collections`} className="sf-btn sf-btn-primary" style={{ padding: '14px 32px' }}>Browse Collections</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 20px', minHeight: '60vh' }}>
      <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '3rem', margin: '0 0 40px', color: 'var(--sf-primary)' }}>Your Cart</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
        {cart.map(item => {
          const price = item.salePrice && Number(item.salePrice) > 0 && Number(item.salePrice) < Number(item.sellingPrice)
            ? Number(item.salePrice) : Number(item.sellingPrice);
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 24, border: '1px solid var(--sf-border, #e2e8f0)', borderRadius: 'var(--sf-radius-md, 12px)' }}>
              <img src={item.imageUrl || FALLBACK_IMG} style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover' }} alt={item.name} />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{item.name}</h3>
                {item.category && <p style={{ margin: 0, color: '#999', fontSize: '0.85rem' }}>{item.category.name}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--sf-accent, #c8a97e)' }}>{currency} {price.toFixed(2)}</span>
                  {item.salePrice && Number(item.salePrice) < Number(item.sellingPrice) && (
                    <span style={{ fontSize: '0.85rem', color: '#999', textDecoration: 'line-through' }}>{currency} {Number(item.sellingPrice).toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => updateCartQty(item.id, item.qty - 1)} style={{ width: 36, height: 36, border: 'none', background: '#f8fafc', cursor: 'pointer', fontSize: '1rem' }}>-</button>
                <span style={{ width: 40, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>{item.qty}</span>
                <button onClick={() => updateCartQty(item.id, item.qty + 1)} style={{ width: 36, height: 36, border: 'none', background: '#f8fafc', cursor: 'pointer', fontSize: '1rem' }}>+</button>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 80, textAlign: 'right' }}>{currency} {(price * item.qty).toFixed(2)}</div>
              <button onClick={() => removeFromCart(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8, fontSize: '0.85rem' }}>Remove</button>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fafafa', padding: 32, borderRadius: 'var(--sf-radius-lg, 16px)', textAlign: 'right' }}>
        <p style={{ fontSize: '1.2rem', margin: '0 0 8px', color: '#666' }}>Subtotal: {currency} {subtotal.toFixed(2)}</p>
        <p style={{ fontSize: '1.5rem', margin: '0 0 24px', fontWeight: 700 }}>Total: {currency} {subtotal.toFixed(2)}</p>
        <Link to={`/site/${salon.slug}/checkout`} className="sf-btn sf-btn-primary" style={{ padding: '16px 48px' }}>Proceed to Checkout</Link>
      </div>
    </div>
  );
}
