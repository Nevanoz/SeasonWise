'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { requireSupabaseBrowserClient } from '../../../lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Menyelesaikan autentikasi...');

  useEffect(() => {
    const complete = async () => {
      try {
        const client = requireSupabaseBrowserClient();
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          setMessage('Tautan berhasil diproses. Silakan masuk dengan akun Anda.');
          setTimeout(() => router.replace('/auth/sign-in'), 1200);
          return;
        }
        setMessage('Autentikasi berhasil. Membuka rencana tersimpan...');
        setTimeout(() => router.replace('/saved'), 600);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Autentikasi gagal. Silakan ulangi dari halaman masuk.');
      }
    };
    void complete();
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <h1 className="text-xl font-bold text-text-primary">Menghubungkan akun</h1>
      <p role="status" className="text-sm text-text-secondary">{message}</p>
    </main>
  );
}
