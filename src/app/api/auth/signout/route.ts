import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Fix Next.js 15+ Async Cookies API
    const cookieStore = await cookies();

    // Matikan/clear cookie dengan memberikan maxAge 0
    cookieStore.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({
      statusCode: 200,
      message: 'Logout berhasil',
      data: { success: true },
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal saat logout' },
      { status: 500 },
    );
  }
}
