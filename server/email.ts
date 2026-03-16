import nodemailer from "nodemailer";

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;

  if (!user || !pass) {
    console.warn("SMTP credentials not configured (SMTP_USER / SMTP_APP_PASSWORD missing)");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

let transporter = createTransporter();

export async function sendVerificationCode(to: string, code: string): Promise<boolean> {
  if (!transporter) {
    transporter = createTransporter();
  }
  if (!transporter) {
    console.error("Cannot send email: SMTP not configured");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Parafia Jawornik" <${process.env.SMTP_USER}>`,
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
    console.log(`Verification code sent to ${to}`);
    return true;
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return false;
  }
}
