'use client';

import { useState } from 'react';

export default function SubscribeTestPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else if (res.status === 409) {
        setStatus('duplicate');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFECE5', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '24px', color: '#1f0318' }}>Subscribe Test</h1>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#666' }}>This page simulates the subscribe form on hugsandi.is</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
            placeholder="Netfangið þitt"
            required
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{ width: '100%', marginTop: '12px', padding: '10px', backgroundColor: '#1f0318', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
          >
            {status === 'loading' ? 'Subscribing...' : 'Gerast áskrifandi'}
          </button>
        </form>

        {status === 'success' && <p style={{ marginTop: '12px', color: '#16a34a', fontSize: '14px' }}>Subscribed successfully!</p>}
        {status === 'duplicate' && <p style={{ marginTop: '12px', color: '#d97706', fontSize: '14px' }}>This email is already subscribed.</p>}
        {status === 'error' && <p style={{ marginTop: '12px', color: '#dc2626', fontSize: '14px' }}>Something went wrong. Try again.</p>}
      </div>
    </div>
  );
}
