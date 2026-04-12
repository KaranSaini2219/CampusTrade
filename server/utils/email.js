import nodemailer from 'nodemailer';

export const sendOTPEmail = async (toEmail, otp) => {
  // Create transporter INSIDE function so .env is already loaded
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'CampusTrade NITJ — Verify your email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a5f; margin-bottom: 8px;">CampusTrade NITJ</h2>
        <p style="color: #475569;">Use the OTP below to verify your email address.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e3a5f; background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #475569;">This OTP expires in <strong>10 minutes</strong>.</p>
        <p style="color: #94a3b8; font-size: 12px;">If you didn't register on CampusTrade, ignore this email.</p>
      </div>
    `,
  });
};