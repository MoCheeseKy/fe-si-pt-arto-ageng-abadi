'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Mail, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Schema validasi Zod sesuai AuthSigninRequest di backend
const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Simulasi call ke Next.js Route Handler (/api/auth/login) yang akan mengeksekusi api.post('/v1/auth/signin')
      await new Promise((resolve) => setTimeout(resolve, 1200));

      toast.success('Login berhasil!', {
        description: 'Selamat datang kembali.',
      });
      router.push('/overview');
    } catch (error) {
      toast.error('Gagal login', { description: 'Kredensial tidak cocok.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden'>
      {/* Background Ornament */}
      <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]' />
      <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]' />

      <div className='w-full max-w-md z-10'>
        <div className='bg-card border border-border rounded-2xl shadow-xl overflow-hidden relative'>
          <div className='absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary' />

          <div className='p-8'>
            <div className='mb-8 text-center'>
              <h1 className='text-2xl font-heading font-bold text-foreground'>
                SIMOK
              </h1>
              <p className='text-sm text-muted-foreground mt-1'>
                PT. Arto Ageng Abadi
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>
                  Email
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    {...register('email')}
                    type='email'
                    placeholder='admin@artoageng.co.id'
                    className={`pl-9 bg-background ${errors.email ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                  />
                </div>
                {errors.email && (
                  <p className='text-xs text-destructive mt-1'>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>
                  Password
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    {...register('password')}
                    type='password'
                    placeholder='••••••••'
                    className={`pl-9 bg-background ${errors.password ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                  />
                </div>
                {errors.password && (
                  <p className='text-xs text-destructive mt-1'>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type='submit'
                className='w-full bg-primary hover:bg-primary/90 text-white font-semibold transition-all h-11'
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
