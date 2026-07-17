'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock } from 'lucide-react';
import { requireSupabaseBrowserClient } from '../../../lib/supabase';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'offline'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setStatus('submitting');
    setErrorMessage('');
    try {
      const client = requireSupabaseBrowserClient();
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.replace('/saved');
      router.refresh();
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Tidak dapat masuk. Periksa email dan kata sandi.');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 fade-in">
      <div className="max-w-md mx-auto bg-white border border-border p-8 rounded-xl space-y-6">
        <div className="text-center space-y-1">
        <LogIn className="w-8 h-8 text-primary mx-auto" />
        <h1 className="text-xl font-bold text-text-primary">Masuk ke Akun Anda</h1>
        <p className="text-xs text-text-secondary">Akses rencana finansial terintegrasi cloud Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-text-secondary">Alamat Email</label>
          <div className="flex border border-border rounded-lg overflow-hidden bg-background/25">
            <span className="p-2.5 bg-[#E8EFE8] border-r border-border text-text-secondary"><Mail className="w-4 h-4" /></span>
            <input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 p-2.5 text-xs bg-transparent focus:outline-none min-h-[44px]"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-text-secondary">Kata Sandi</label>
          <div className="flex border border-border rounded-lg overflow-hidden bg-background/25">
            <span className="p-2.5 bg-[#E8EFE8] border-r border-border text-text-secondary"><Lock className="w-4 h-4" /></span>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 p-2.5 text-xs bg-transparent focus:outline-none min-h-[44px]"
              required
            />
          </div>
        </div>
        {errorMessage && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-3 bg-primary text-white rounded-lg font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-opacity min-h-[44px]"
        >
          {status === 'submitting' ? 'Memproses...' : 'Masuk Akun'}
        </button>
      </form>

      <div className="text-center text-xs">
        <span className="text-text-secondary">Belum memiliki akun? </span>
        <a href="/auth/sign-up" className="text-primary font-bold hover:underline">Daftar Sekarang</a>
      </div>
      </div>
    </div>
  );
}
