import React from 'react';
import SignalDashboard from '../../components/signal/SignalDashboard';

export const metadata = {
  title: 'AI Signal | The Investowl',
  description: 'Top algorithmic trading signals based on smart money and sector rotation.',
};

export default function SignalPage() {
  return (
    <main className="min-h-screen bg-[var(--md-sys-color-surface)] p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight">AI Signal Terminal</h1>
          <p className="text-sm font-bold text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Algorithmic top picks powered by Smart Money & Sector Rotation.
          </p>
        </div>
        
        <SignalDashboard />
      </div>
    </main>
  );
}
