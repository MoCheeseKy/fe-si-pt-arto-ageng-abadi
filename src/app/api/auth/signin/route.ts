// src/app/api/auth/signin/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/v1/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || 'Gagal melakukan otentikasi' },
        { status: res.status },
      );
    }

    // Destructure untuk memisahkan token dari payload user
    const { accessToken, ...userData } = data.data;

    // Set cookie untuk Next.js Middleware (proxy.ts)
    const cookieStore = await cookies();
    cookieStore.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400,
    });

    // Sertakan token di response agar bisa disimpan ke Zustand Store oleh client
    return NextResponse.json({
      statusCode: 200,
      message: 'Login berhasil',
      data: { ...userData, token: accessToken },
    });
  } catch (error) {
    console.error('[DEBUG-SIGNIN] Catch Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal server' },
      { status: 500 },
    );
  }
}
