export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Return empty strings during build — runtime will fail fast if vars are missing
  return {
    url: url ?? "",
    anonKey: anonKey ?? "",
  };
}
