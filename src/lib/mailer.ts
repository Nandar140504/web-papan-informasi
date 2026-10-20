import nodemailer from 'nodemailer';

interface SendVerificationEmailParams {
  to: string;
  name: string;
  verificationToken: string;
  origin?: string;
}

export async function sendVerificationEmail({
  to,
  name,
  verificationToken,
  origin
}: SendVerificationEmailParams): Promise<{ success: boolean; messageId?: string; error?: string; verificationUrl: string }> {
  const hostUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'https://web-papan-informasi.vercel.app';
  const cleanEmail = to.trim().toLowerCase();
  const verificationUrl = `${hostUrl}/admin?verify_email=${encodeURIComponent(cleanEmail)}&token=${verificationToken}`;

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || '';
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
  const smtpSecure = smtpPort === 465;

  // Jika kredensial SMTP belum disetel di environment variables
  if (!smtpUser || !smtpPass) {
    console.warn('[Mailer] SMTP belum dikonfigurasi (SMTP_USER / SMTP_PASS kosong). Tautan verifikasi:', verificationUrl);
    return {
      success: false,
      error: 'Kredensial SMTP Gmail belum dikonfigurasi di Environment Variables.',
      verificationUrl
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"Unit Diklat PT Semen Tonasa" <${smtpUser}>`,
      to: cleanEmail,
      subject: 'Konfirmasi Pendaftaran Akun Admin Diklat - PT Semen Tonasa',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; color: #18181b; }
            .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e4e4e7; }
            .header { background: linear-gradient(135deg, #8a0b12 0%, #52050b 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
            .header p { margin: 6px 0 0 0; font-size: 12px; color: #fef08a; font-weight: 600; }
            .content { padding: 32px 24px; }
            .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
            .message { font-size: 13.5px; line-height: 1.6; color: #3f3f46; margin-bottom: 24px; }
            .btn-wrapper { text-align: center; margin: 28px 0; }
            .btn { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4); }
            .alert-box { background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #9f1239; margin-bottom: 20px; line-height: 1.5; }
            .link-alt { font-size: 11.5px; color: #71717a; word-break: break-all; margin-top: 20px; background-color: #f4f4f5; padding: 12px; border-radius: 8px; }
            .footer { background-color: #18181b; padding: 20px 24px; text-align: center; font-size: 11px; color: #a1a1aa; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PT SEMEN TONASA</h1>
              <p>UNIT LEARNING & DEVELOPMENT • SISTEM INFORMASI RUANGAN</p>
            </div>
            <div class="content">
              <div class="greeting">Halo, ${name || 'Staf Admin'}!</div>
              <div class="message">
                Terima kasih telah mendaftarkan akun staf di <strong>Portal Admin Sistem Informasi Ruangan PT Semen Tonasa</strong>.
                <br><br>
                Sesuai dengan protokol keamanan sistem, akun Anda <strong>wajib dikonfirmasi terlebih dahulu</strong> sebelum Anda dapat melakukan login ke Dashboard Admin.
              </div>
              
              <div class="alert-box">
                ⚠️ <strong>Penting:</strong> Anda tidak dapat masuk ke Dashboard Admin (meskipun password benar) sebelum mengklik tombol konfirmasi di bawah ini.
              </div>

              <div class="btn-wrapper">
                <a href="${verificationUrl}" class="btn" target="_blank">
                  ✅ AKTIFKAN AKUN ADMIN SAYA
                </a>
              </div>

              <div class="link-alt">
                Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di browser Anda:<br>
                <a href="${verificationUrl}" style="color: #dc2626;">${verificationUrl}</a>
              </div>
            </div>
            <div class="footer">
              Email ini dikirimkan secara otomatis oleh Sistem Informasi Ruangan Unit Diklat PT Semen Tonasa.<br>
              Jika Anda tidak merasa mendaftar, silakan abaikan email ini.
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailer] Email verifikasi berhasil dikirim ke:', cleanEmail, 'MessageId:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      verificationUrl
    };
  } catch (err: any) {
    console.error('[Mailer] Gagal kirim email via SMTP:', err);
    return {
      success: false,
      error: err.message,
      verificationUrl
    };
  }
}
