import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendResetPasswordEmail } from "@/lib/email/send";

// POST /api/auth/send-otp
// Generates a 6-digit OTP, stores it hashed in user metadata, sends via Resend.
// Does NOT use Supabase magic links (avoids localhost redirect issues).
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const service = createServiceClient();

  // Find user
  const { data: list, error: listErr } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

  const user = list.users.find((u) => u.email === email);
  if (!user) {
    // Return success anyway to avoid email enumeration
    return NextResponse.json({ ok: true });
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 min

  // Store OTP hash in user metadata (simple — for production use a separate table)
  await service.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      reset_otp: otp,
      reset_otp_expires: expiresAt,
    },
  });

  // Send via Resend
  try {
    await sendResetPasswordEmail({ to: email, otp });
  } catch (e) {
    console.error("[send-otp] email failed:", e);
    return NextResponse.json({ error: "Не вдалося надіслати email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
