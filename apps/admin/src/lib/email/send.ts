import { Resend } from "resend";
import { createElement } from "react";
import { InviteEmail, ResetPasswordEmail } from "./templates";

const FROM = "U:DO CRAFT <noreply@u-do-craft.store>";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export async function sendInviteEmail({
  to,
  tempPassword,
  loginUrl,
  inviterName,
}: {
  to: string;
  tempPassword: string;
  loginUrl: string;
  inviterName?: string;
}) {
  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Запрошення до U:DO CRAFT Admin",
    react: createElement(InviteEmail, { email: to, tempPassword, loginUrl, inviterName }),
  });
}

export async function sendResetPasswordEmail({
  to,
  otp,
}: {
  to: string;
  otp: string;
}) {
  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Скидання пароля — U:DO CRAFT Admin",
    react: createElement(ResetPasswordEmail, { otp }),
  });
}
