import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY not configured");
    return null;
  }
  resend = new Resend(key);
  return resend;
}

export async function sendVerificationCode(to: string, code: string): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.error("Cannot send email: RESEND_API_KEY missing");
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from: "Parafia Jawornik <onboarding@resend.dev>",
      to,
      subject: `Kod weryfikacyjny: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="margin: 0 0 8px; font-size: 20px; color: #111;">Logowanie do panelu admina</h2>
          <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">Parafia Ewangelicka w Wiśle Jaworniku</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${code}</span>
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 13px;">Kod jest ważny przez 5 minut. Jeśli nie próbowałeś się zalogować, zignoruj tę wiadomość.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    console.log(`Verification code sent to ${to}`);
    return true;
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return false;
  }
}
