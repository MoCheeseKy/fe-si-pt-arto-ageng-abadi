// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input'; // <-- MENGGUNAKAN REUSABLE COMPONENT KITA
import { useAuthStore } from '@/store/useAuthStore'; // <-- IMPORT ZUSTAND STORE

// Schema validasi Zod
const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null); // State khusus error dari backend

  const setUser = useAuthStore((state) => state.setUser); // Ambil action dari store

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema as any),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Panggil Route Handler internal Next.js (bukan lewat api.ts interceptor)
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        // Jika gagal, set state error untuk ditampilkan di bawah form
        setServerError(
          responseData.message ||
            'Kredensial tidak valid atau terjadi kesalahan.',
        );
        toast.error('Gagal login', {
          description: 'Mohon periksa kembali email dan password Anda.',
        });
        return;
      }

      // Jika sukses, simpan data user ke Zustand (tersimpan juga di localStorage)
      setUser(responseData.data);

      toast.success('Login berhasil!', {
        description: `Selamat datang kembali, ${responseData.data.fullname}.`,
      });

      // Redirect ke dashboard
      router.push('/overview');
    } catch (error) {
      setServerError(
        'Gagal terhubung ke server. Periksa koneksi internet Anda.',
      );
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden'>
      {/* Background Ornament */}
      <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]' />
      <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]' />

      <div className='w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500'>
        <div className='bg-card border border-border rounded-2xl shadow-xl overflow-hidden relative'>
          <div className='absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary' />

          <div className='p-8'>
            <div className='mb-8 text-center'>
              <h1 className='text-2xl font-heading font-bold text-foreground tracking-tight'>
                Sistem Informasi Manajemen Operasional dan Keuangan
              </h1>
              <p className='text-sm text-muted-foreground mt-1 tracking-widest uppercase font-bold text-[10px]'>
                PT. Arto Ageng Abadi
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              {/* Menggunakan Custom Reusable Input */}
              <div className='space-y-4'>
                <Input
                  label='Email Address'
                  icon={Mail}
                  type='email'
                  placeholder='admin@artoageng.co.id'
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label='Password'
                  icon={Lock}
                  type='password'
                  placeholder='••••••••'
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              {/* Tampilan Error Backend Khusus */}
              {serverError && (
                <div className='p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3'>
                  <AlertCircle className='w-5 h-5 text-destructive shrink-0 mt-0.5' />
                  <p className='text-sm text-destructive font-medium leading-snug'>
                    {serverError}
                  </p>
                </div>
              )}

              <Button
                type='submit'
                className='w-full bg-primary hover:bg-primary/90 text-white font-bold tracking-wide transition-all h-11 shadow-md hover:shadow-primary/25'
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Memverifikasi...
                  </>
                ) : (
                  'Masuk ke Sistem'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
