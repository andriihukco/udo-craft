import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey } = getSupabasePublicEnv();

  // When Supabase env vars are absent, allow the request through to avoid
  // infinite redirect loops (e.g. during build or misconfigured environments)
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/cabinet/login";

  // Unauthenticated user trying to access a protected cabinet route → redirect to login
  if (!user && !isLoginPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/cabinet/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated user visiting the login page → redirect to cabinet home
  if (user && isLoginPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/cabinet";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
