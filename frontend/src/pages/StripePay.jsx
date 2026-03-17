import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';

function CheckoutForm({ orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        await api.post('/payment/stripe/confirm', {
          order_id: orderId,
          payment_intent_id: paymentIntent.id,
        });
        navigate('/order-success', { state: { order: { id: orderId } } });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to confirm payment with server');
        setProcessing(false);
      }
    } else {
      setError('Payment was not completed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <div className="alert alert-danger mt-3 py-2" style={{ borderRadius: '10px', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn btn-primary w-100 fw-bold mt-4"
        style={{ borderRadius: '12px', padding: '13px', fontSize: '1rem' }}
      >
        {processing ? (
          <><span className="spinner-border spinner-border-sm me-2" />Processing payment...</>
        ) : '🔒 Pay Now'}
      </button>
    </form>
  );
}

export default function StripePay() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, clientSecret, publishableKey } = location.state || {};
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    if (!publishableKey || !clientSecret || !orderId) {
      navigate('/cart');
      return;
    }
    setStripePromise(loadStripe(publishableKey));
  }, [publishableKey, clientSecret, orderId, navigate]);

  if (!stripePromise || !clientSecret) return null;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#1d4ed8',
        colorBackground: '#ffffff',
        fontFamily: '"Inter", system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">

          {/* Header */}
          <div className="text-center mb-4">
            <div className="mb-3" style={{ fontSize: '2.5rem' }}>💳</div>
            <h3 className="fw-bold text-dark">Complete Your Payment</h3>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Secured by Stripe — your card details are never stored on our servers
            </p>
          </div>

          {/* Stripe Card */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4">
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm orderId={orderId} />
              </Elements>
            </div>
          </div>

          {/* Trust badges */}
          <div className="d-flex justify-content-center gap-4 mt-3">
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>🔒 SSL Encrypted</span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>✅ PCI Compliant</span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>🛡 Stripe Secured</span>
          </div>

          {/* Sandbox test note */}
          <div className="alert alert-info mt-4 py-2" style={{ borderRadius: '10px', fontSize: '0.8rem' }}>
            <strong>Test Mode:</strong> Use card <code>4242 4242 4242 4242</code>, any future expiry, any CVC.
          </div>
        </div>
      </div>
    </div>
  );
}
