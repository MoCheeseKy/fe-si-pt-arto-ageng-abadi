import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // --- DEBUG LOG START ---
    console.log('\n[DEBUG-SIGNIN] Target BACKEND_URL:', BACKEND_URL);
    console.log('[DEBUG-SIGNIN] Payload sent:', body);
    // --- DEBUG LOG END ---

    // Forward request ke backend asli
    const res = await fetch(`${BACKEND_URL}/v1/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // --- DEBUG LOG START ---
    console.log(`[DEBUG-SIGNIN] Response Status: ${res.status}`);
    console.log(
      '[DEBUG-SIGNIN] Backend Response Data:',
      JSON.stringify(data, null, 2),
    );
    // --- DEBUG LOG END ---

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || 'Gagal melakukan otentikasi' },
        { status: res.status },
      );
    }

    // Destructure untuk memisahkan token dari payload user
    const { accessToken, ...userData } = data.data;

    // Fix Next.js 15+ Async Cookies API
    const cookieStore = await cookies();
    cookieStore.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400, // Expire dalam 24 jam (86400 detik)
    });

    // Return data user saja tanpa accessToken agar lebih aman
    return NextResponse.json({
      statusCode: 200,
      message: 'Login berhasil',
      data: userData,
    });
  } catch (error) {
    console.error('[DEBUG-SIGNIN] Catch Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal server' },
      { status: 500 },
    );
  }
}
