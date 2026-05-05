import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * OAuth Callback Route
 * Handles Supabase OAuth redirect after user authentication
 * Exchanges authorization code for session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase environment variables');
        return NextResponse.redirect(
          `${origin}/auth/error?message=Configuration%20error`
        );
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Exchange authorization code for session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('❌ OAuth exchange failed:', error);
        return NextResponse.redirect(
          `${origin}/auth/error?message=${encodeURIComponent(error.message)}`
        );
      }

      // Successful authentication, redirect to events
      return NextResponse.redirect(`${origin}/events`);
    }

    // No code provided
    return NextResponse.redirect(`${origin}/auth/error?message=No%20code%20provided`);
  } catch (error) {
    console.error('❌ Callback route error:', error);
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth/error?message=Unexpected%20error`
    );
  }
}