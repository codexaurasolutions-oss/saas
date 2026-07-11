import { useState, useEffect } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";

export default function OrderConfirmationPage() {
  const { salon } = useOutletContext();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = salon.currency || "INR";

  useEffect(() => {
    if (!salon?.slug || !orderNumber) { setLoading(false); return; }
    api.get(`/public/salon/${salon.slug}/track-order?orderNumber=${orderNumber}`)
      .then(res => { setOrder(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [salon?.slug, orderNumber]);

  if (loading) return <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 20px', textAlign: 'center', color: '#999' }}>Loading order details...</div>;

  if (!order) return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '2.5rem', marginBottom: 16 }}>Thank You!</h1>
      <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: 32 }}>Your order has been placed successfully.</p>
      {orderNumber && <p style={{ color: '#999', marginBottom: 24 }}>Order Number: <strong>{orderNumber}</strong></p>}
      <Link to={`/site/${salon.slug}`} className="sf-btn sf-btn-primary" style={{ padding: '14px 32px' }}>Continue Shopping</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '2rem' }}>&#10003;</div>
        <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '2.5rem', margin: '0 0 8px' }}>Order Confirmed!</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Thank you for your order. We&apos;ll start processing it shortly.</p>
      </div>

      <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)', marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, color: '#999', fontSize: '0.85rem' }}>Order Number</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem' }}>{order.orderNumber}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#999', fontSize: '0.85rem' }}>Status</p>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: '#fef3c7', color: '#92400e', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600 }}>{order.status}</span>
          </div>
        </div>

        {order.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: i === 0 ? '1px solid #eee' : 'none' }}>
            <span style={{ color: '#333' }}>{item.name || item.productName} x {item.qty}</span>
            <span style={{ fontWeight: 600 }}>{currency} {Number(item.price || item.unitPrice || 0).toFixed(2)}</span>
          </div>
        ))}

        <div style={{ borderTop: '2px solid #eee', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 700 }}>
          <span>Total</span>
          <span>{currency} {Number(order.total).toFixed(2)}</span>
        </div>
      </div>

      <div style={{ background: '#f9fafb', padding: 24, borderRadius: 12, marginBottom: 32 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 600 }}>What&apos;s next?</p>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#555', lineHeight: 1.8 }}>
          <li>We&apos;ll review and accept your order</li>
          <li>You&apos;ll receive updates as your order progresses</li>
          {order.status === "PAY_AT_SALON" || order.status === "COD" ? <li>Pay when you receive your order</li> : <li>Payment has been processed</li>}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <Link to={`/site/${salon.slug}/collections`} className="sf-btn sf-btn-secondary" style={{ padding: '14px 32px' }}>Continue Shopping</Link>
        <Link to={`/site/${salon.slug}`} className="sf-btn sf-btn-primary" style={{ padding: '14px 32px' }}>Back to Home</Link>
      </div>
    </div>
  );
}
