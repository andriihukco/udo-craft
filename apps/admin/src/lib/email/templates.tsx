/**
 * Resend email templates for U:DO CRAFT Admin
 * All templates return React elements compatible with Resend's react renderer.
 */

import * as React from "react";

const BRAND_COLOR = "#1B18AC";
const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f5f5f7", fontFamily: FONT }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#f5f5f7", padding: "40px 16px" }}>
          <tbody>
            <tr>
              <td align="center">
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: 520, backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  {/* Header */}
                  <tbody>
                    <tr>
                      <td style={{ backgroundColor: BRAND_COLOR, padding: "28px 40px" }}>
                        <p style={{ margin: 0, color: "#ffffff", fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>
                          U:DO CRAFT
                        </p>
                        <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                          Адміністративна панель
                        </p>
                      </td>
                    </tr>
                    {/* Body */}
                    <tr>
                      <td style={{ padding: "36px 40px 32px" }}>
                        {children}
                      </td>
                    </tr>
                    {/* Footer */}
                    <tr>
                      <td style={{ borderTop: "1px solid #f0f0f0", padding: "20px 40px", backgroundColor: "#fafafa" }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#999", lineHeight: 1.5 }}>
                          Цей лист надіслано автоматично. Якщо ви не очікували його — просто проігноруйте.
                          <br />© {new Date().getFullYear()} U:DO CRAFT
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.3px" }}>{children}</h1>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 24px", fontSize: 14, color: "#555", lineHeight: 1.6 }}>{children}</p>;
}

function CodeBox({ code }: { code: string }) {
  return (
    <div style={{ margin: "24px 0", textAlign: "center" }}>
      <div style={{ display: "inline-block", backgroundColor: "#f5f5f7", border: "1px solid #e5e5e5", borderRadius: 12, padding: "20px 40px" }}>
        <p style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: "0.2em", color: BRAND_COLOR, fontVariantNumeric: "tabular-nums" }}>
          {code}
        </p>
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 12, color: "#999" }}>Дійсний 15 хвилин</p>
    </div>
  );
}

function CredBox({ email, password }: { email: string; password: string }) {
  return (
    <div style={{ margin: "24px 0", backgroundColor: "#f5f5f7", border: "1px solid #e5e5e5", borderRadius: 12, padding: "20px 24px" }}>
      <Row label="Email" value={email} />
      <Row label="Тимчасовий пароль" value={password} mono />
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #ebebeb" }}>
      <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1a1a1a", fontFamily: mono ? "monospace" : FONT, fontWeight: mono ? 700 : 400 }}>{value}</span>
    </div>
  );
}

function PrimaryBtn({ href, label }: { href: string; label: string }) {
  return (
    <div style={{ margin: "28px 0 0", textAlign: "center" }}>
      <a href={href} style={{ display: "inline-block", backgroundColor: BRAND_COLOR, color: "#ffffff", fontSize: 14, fontWeight: 700, padding: "14px 32px", borderRadius: 100, textDecoration: "none", letterSpacing: "-0.1px" }}>
        {label}
      </a>
    </div>
  );
}

// ── Templates ─────────────────────────────────────────────────────────────────

/** Sent when admin invites a new user — includes temp password */
export function InviteEmail({ email, tempPassword, loginUrl, inviterName }: {
  email: string;
  tempPassword: string;
  loginUrl: string;
  inviterName?: string;
}) {
  return (
    <Shell>
      <Heading>Вас запрошено до U:DO CRAFT</Heading>
      <Body>
        {inviterName ? `${inviterName} надав` : "Вам надано"} доступ до адміністративної панелі U:DO CRAFT.
        Використайте ці дані для першого входу — після входу вас попросять встановити власний пароль.
      </Body>
      <CredBox email={email} password={tempPassword} />
      <PrimaryBtn href={loginUrl} label="Увійти до панелі" />
    </Shell>
  );
}

/** Sent for password reset — OTP code */
export function ResetPasswordEmail({ otp, appName = "U:DO CRAFT Admin" }: {
  otp: string;
  appName?: string;
}) {
  return (
    <Shell>
      <Heading>Скидання пароля</Heading>
      <Body>
        Ви запросили скидання пароля для {appName}. Введіть цей код на сторінці відновлення.
      </Body>
      <CodeBox code={otp} />
      <Body>
        Якщо ви не запитували скидання пароля — просто проігноруйте цей лист. Ваш пароль залишиться незмінним.
      </Body>
    </Shell>
  );
}
