import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// POST /api/users/set-role
// Bootstrap endpoint — sets role on the calling user's own account.
// Only works if the user has NO role yet (prevents privilege escalation).
// Remove or disable this route after initial setup.
export async function POST(req: NextRequest) {
  const { email, secret } = await req.json();

  // Require a bootstrap secret from env to prevent abuse
  const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
  if (!bootstrapSecret || secret !== bootstrapSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const service = createServiceClient();

  // Find user by email
  const { data: list, error: listErr } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

  const user = list.users.find((u) => u.email === email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Only bootstrap if no role is set yet
  if (user.user_metadata?.role) {
    return NextResponse.json({ error: "User already has a role: " + user.user_metadata.role }, { status: 400 });
  }

  const { data, error } = await service.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, role: "admin" },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, user: data.user });
}
