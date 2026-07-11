import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&fit=crop";

export default function CheckoutPage() {
  const { salon, cart, removeFromCart, updateCartQty } = useOutletContext();
  const navigate = useNavigate();
  const currency = salon.currency || "INR";
  const ecommerceSettings = salon.ecommerceSettings || {};

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    note: "", paymentMode: "PAY_AT_SALON", fulfillmentMethod: "PICKUP",
    address: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const subtotal = cart.reduce((sum, item) => {
    const price = item.salePrice && Number(item.salePrice) > 0 && Number(item.salePrice) < Number(item.sellingPrice)
      ? Number(item.salePrice) : Number(item.sellingPrice);
    return sum + price * item.qty;
  }, 0);

  const taxPercent = Number(ecommerceSettings.taxPercent) || 0;
  const deliveryFee = form.fulfillmentMethod === "DELIVERY" ? (Number(ecommerceSettings.deliveryFee) || 0) : 0;
  const taxAmount = Math.round(subtotal * taxPercent / 100 * 100) / 100;
  const total = Math.round((subtotal + taxAmount + deliveryFee) * 100) / 100;

  if (cart.length === 0) {
    return (
      <div style={{ background: '#fafafa', minHeight: '100vh', padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '2.5rem', margin: '0 0 24px' }}>Checkout</h1>
        <p style={{ color: '#999', marginBottom: 24 }}>Your cart is empty.</p>
        <Link to={`/site/${salon.slug}/collections`} className="sf-btn sf-btn-primary" style={{ padding: '14px 32px' }}>Browse Collections</Link>
      </div>
    );
  }

  const loadRazorpay = () => new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const submitOrder = async (paymentDetails = null) => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerPhone: form.phone,
        customerEmail: form.email || undefined,
        note: form.note || undefined,
        paymentMode: form.paymentMode,
        fulfillmentMethod: form.fulfillmentMethod,
        taxPercent,
        deliveryFee: form.fulfillmentMethod === "DELIVERY" ? deliveryFee : 0,
        items: cart.map(c => ({ productId: c.id, qty: c.qty }))
      };

      const res = await api.post(`/public/salons/${salon.slug}/orders`, payload);
      const order = res.data;

      if (paymentDetails) {
        try {
          await api.post(`/public/salon/${salon.slug}/verify-razorpay-payment`, {
            razorpayOrderId: paymentDetails.razorpay_order_id,
            razorpayPaymentId: paymentDetails.razorpay_payment_id,
            razorpaySignature: paymentDetails.razorpay_signature
          });
        } catch (e) { console.error("Payment verification failed:", e); }
      }

      localStorage.removeItem("sf_cart");
      navigate(`/site/${salon.slug}/order-confirmation?orderNumber=${order.orderNumber}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!form.firstName || !form.phone) {
      setError("Please fill in your name and phone number.");
      return;
    }
    if (form.fulfillmentMethod === "DELIVERY" && !form.address) {
      setError("Please enter your delivery address.");
      return;
    }

    if (form.paymentMode === "ONLINE") {
      const loaded = await loadRazorpay();
      if (!loaded) { setError("Failed to load payment gateway. Please try again."); return; }

      try {
        const orderRes = await api.post(`/public/salon/${salon.slug}/razorpay-order`, {
          amount: total,
          currency: "INR",
          receipt: `order_${Date.now()}`
        });

        const rzp = new window.Razorpay({
          key: orderRes.data.keyId,
          amount: orderRes.data.amount,
          currency: orderRes.data.currency,
          name: salon.name,
          description: `Order - ${salon.name}`,
          order_id: orderRes.data.orderId,
          handler: function (response) { submitOrder(response); },
          prefill: { name: `${form.firstName} ${form.lastName}`, email: form.email, contact: form.phone },
          theme: { color: "var(--sf-accent, #c8a97e)" },
          modal: { ondismiss: () => { setSubmitting(false); setError("Payment was cancelled."); } }
        });
        rzp.open();
        setSubmitting(false);
      } catch (err) {
        setError(err.response?.data?.message || "Payment failed. Please try again.");
        setSubmitting(false);
      }
    } else {
      await submitOrder();
    }
  };

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh', padding: '60px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 60 }}>
        
        <div>
          <Link to={`/site/${salon.slug}/cart`} style={{ color: '#999', textDecoration: 'none', marginBottom: 32, display: 'inline-block' }}>&larr; Back to Cart</Link>
          <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '2.5rem', margin: '0 0 32px' }}>Checkout</h1>
          
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #fecaca' }}>{error}</div>}

          <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}>Contact Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <input type="text" placeholder="First Name *" value={form.firstName} onChange={set('firstName')} required style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8, width: '100%' }} />
                <input type="text" placeholder="Last Name" value={form.lastName} onChange={set('lastName')} style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8, width: '100%' }} />
              </div>
              <input type="email" placeholder="Email Address (optional)" value={form.email} onChange={set('email')} style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8, width: '100%' }} />
              <input type="text" placeholder="Phone Number *" value={form.phone} onChange={set('phone')} required style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8, width: '100%' }} />
            </div>

            <h2 style={{ fontSize: '1.2rem', margin: '40px 0 24px', borderBottom: '1px solid #eee', paddingBottom: 16 }}>Fulfillment</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              {ecommerceSettings.pickupEnabled !== false && (
                <button onClick={() => setForm({ ...form, fulfillmentMethod: "PICKUP" })} style={{ flex: 1, padding: 14, border: `2px solid ${form.fulfillmentMethod === "PICKUP" ? "var(--sf-accent, #c8a97e)" : "#ddd"}`, borderRadius: 8, background: form.fulfillmentMethod === "PICKUP" ? "var(--sf-accent, #c8a97e)11" : "white", cursor: 'pointer', fontWeight: 600, color: form.fulfillmentMethod === "PICKUP" ? "var(--sf-accent, #c8a97e)" : "#666" }}>
                  Pickup
                </button>
              )}
              {ecommerceSettings.deliveryEnabled && (
                <button onClick={() => setForm({ ...form, fulfillmentMethod: "DELIVERY" })} style={{ flex: 1, padding: 14, border: `2px solid ${form.fulfillmentMethod === "DELIVERY" ? "var(--sf-accent, #c8a97e)" : "#ddd"}`, borderRadius: 8, background: form.fulfillmentMethod === "DELIVERY" ? "var(--sf-accent, #c8a97e)11" : "white", cursor: 'pointer', fontWeight: 600, color: form.fulfillmentMethod === "DELIVERY" ? "var(--sf-accent, #c8a97e)" : "#666" }}>
                  Delivery {deliveryFee > 0 ? `(+${currency} ${deliveryFee.toFixed(2)})` : "(Free)"}
                </button>
              )}
            </div>
            {form.fulfillmentMethod === "DELIVERY" && (
              <textarea placeholder="Delivery Address *" value={form.address} onChange={set('address')} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, marginTop: 16, resize: 'vertical', boxSizing: 'border-box' }} />
            )}

            <h2 style={{ fontSize: '1.2rem', margin: '40px 0 24px', borderBottom: '1px solid #eee', paddingBottom: 16 }}>Payment</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ecommerceSettings.allowPayAtSalon !== false && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: `2px solid ${form.paymentMode === "PAY_AT_SALON" ? "var(--sf-accent, #c8a97e)" : "#ddd"}`, borderRadius: 8, cursor: 'pointer', background: form.paymentMode === "PAY_AT_SALON" ? "var(--sf-accent, #c8a97e)11" : "white" }}>
                  <input type="radio" name="payment" value="PAY_AT_SALON" checked={form.paymentMode === "PAY_AT_SALON"} onChange={set('paymentMode')} />
                  <span style={{ fontWeight: 600 }}>Pay at Salon Counter</span>
                </label>
              )}
              {ecommerceSettings.allowCod && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: `2px solid ${form.paymentMode === "COD" ? "var(--sf-accent, #c8a97e)" : "#ddd"}`, borderRadius: 8, cursor: 'pointer', background: form.paymentMode === "COD" ? "var(--sf-accent, #c8a97e)11" : "white" }}>
                  <input type="radio" name="payment" value="COD" checked={form.paymentMode === "COD"} onChange={set('paymentMode')} />
                  <span style={{ fontWeight: 600 }}>Cash on Delivery</span>
                </label>
              )}
              {ecommerceSettings.allowOnlinePayment && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: `2px solid ${form.paymentMode === "ONLINE" ? "var(--sf-accent, #c8a97e)" : "#ddd"}`, borderRadius: 8, cursor: 'pointer', background: form.paymentMode === "ONLINE" ? "var(--sf-accent, #c8a97e)11" : "white" }}>
                  <input type="radio" name="payment" value="ONLINE" checked={form.paymentMode === "ONLINE"} onChange={set('paymentMode')} />
                  <span style={{ fontWeight: 600 }}>Pay Online (Razorpay)</span>
                </label>
              )}
            </div>

            <textarea placeholder="Order Notes (optional)" value={form.note} onChange={set('note')} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, marginTop: 24, resize: 'vertical', boxSizing: 'border-box' }} />

            <button onClick={handlePlaceOrder} disabled={submitting} className="sf-btn sf-btn-primary" style={{ width: '100%', padding: 16, marginTop: 40, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Processing..." : form.paymentMode === "ONLINE" ? `Pay ${currency} ${total.toFixed(2)}` : "Place Order"}
            </button>
          </div>
        </div>

        <div>
          <div style={{ position: 'sticky', top: 100, background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem' }}>Order Summary ({cart.length} items)</h3>
            {cart.map(item => {
              const price = item.salePrice && Number(item.salePrice) > 0 && Number(item.salePrice) < Number(item.sellingPrice)
                ? Number(item.salePrice) : Number(item.sellingPrice);
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <img src={item.imageUrl || FALLBACK_IMG} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} alt={item.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <p style={{ margin: 0, color: '#999', fontSize: '0.8rem' }}>Qty: {item.qty}</p>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{currency} {(price * item.qty).toFixed(2)}</div>
                </div>
              );
            })}

            <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#666' }}>
                <span>Subtotal</span>
                <span>{currency} {subtotal.toFixed(2)}</span>
              </div>
              {taxPercent > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#666' }}>
                  <span>Tax ({taxPercent}%)</span>
                  <span>{currency} {taxAmount.toFixed(2)}</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#666' }}>
                  <span>Delivery Fee</span>
                  <span>{currency} {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee', fontSize: '1.3rem', fontWeight: 700 }}>
                <span>Total</span>
                <span>{currency} {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
