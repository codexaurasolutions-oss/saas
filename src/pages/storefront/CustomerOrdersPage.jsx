import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

const STATUS_COLORS = {
  NEW: { bg: '#fef3c7', color: '#92400e' },
  ACCEPTED: { bg: '#dbeafe', color: '#1e40af' },
  READY: { bg: '#e0e7ff', color: '#3730a3' },
  COMPLETED: { bg: '#dcfce7', color: '#166534' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b' }
};

export default function CustomerOrdersPage() {
  const { salon } = useOutletContext();
  const currency = salon.currency || "INR";
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const trackOrder = async () => {
    if (!orderNumber.trim()) { setError("Please enter your order number."); return; }
    setLoading(true);
    setError("");
    setOrder(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({ orderNumber: orderNumber.trim() });
      if (phone.trim()) params.append("phone", phone.trim());
      const res = await api.get(`/public/salon/${salon.slug}/track-order?${params.toString()}`);
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Order not found. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 20px', minHeight: '60vh' }}>
      <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '3rem', margin: '0 0 16px', color: 'var(--sf-primary)' }}>Track Your Order</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Enter your order number and phone number to track your order status.</p>

      <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Order Number (e.g. ORD-00001)" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} style={{ flex: 1, minWidth: 200, padding: 12, border: '1px solid #ccc', borderRadius: 8 }} />
          <input type="text" placeholder="Phone Number (optional)" value={phone} onChange={e => setPhone(e.target.value)} style={{ flex: 1, minWidth: 200, padding: 12, border: '1px solid #ccc', borderRadius: 8 }} />
          <button onClick={trackOrder} disabled={loading} className="sf-btn sf-btn-primary" style={{ padding: '12px 32px', opacity: loading ? 0.6 : 1 }}>
            {loading ? "Tracking..." : "Track Order"}
          </button>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #fecaca' }}>{error}</div>}

      {order && (
        <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <p style={{ margin: 0, color: '#999', fontSize: '0.85rem' }}>Order Number</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem' }}>{order.orderNumber}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '0.85rem' }}>Status</p>
              <span style={{ display: 'inline-block', padding: '4px 12px', background: STATUS_COLORS[order.status]?.bg || '#f3f4f6', color: STATUS_COLORS[order.status]?.color || '#374151', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600 }}>
                {order.status}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 16, color: '#666', fontSize: '0.9rem' }}>
            <p style={{ margin: '0 0 4px' }}>Placed on: {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            {order.completedAt && <p style={{ margin: 0 }}>Completed on: {new Date(order.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
          </div>

          {order.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: i === 0 ? '1px solid #eee' : 'none' }}>
              <span>{item.name || item.productName} x {item.qty}</span>
              <span style={{ fontWeight: 600 }}>{currency} {Number(item.price || item.unitPrice || 0).toFixed(2)}</span>
            </div>
          ))}

          <div style={{ borderTop: '2px solid #eee', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700 }}>
            <span>Total</span>
            <span>{currency} {Number(order.total).toFixed(2)}</span>
          </div>

          {order.timeline?.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Order Timeline</h3>
              {order.timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.9rem' }}>
                  <span style={{ color: '#999', minWidth: 140 }}>{new Date(t.createdAt).toLocaleString()}</span>
                  <span style={{ fontWeight: 600 }}>{t.status}</span>
                  {t.note && <span style={{ color: '#666' }}>- {t.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {searched && !loading && !order && !error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <p>No order found with these details.</p>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link to={`/site/${salon.slug}/collections`} style={{ color: 'var(--sf-accent, #c8a97e)', textDecoration: 'none' }}>&larr; Back to Collections</Link>
      </div>
    </div>
  );
}
