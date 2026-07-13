import nodemailer from 'nodemailer';

const createTransporter = () => {
  // EMAIL_USER and EMAIL_PASS are supported for existing CampusTrade setups.
  // New deployments should prefer the SMTP_* names documented in .env.example.
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const requiredVariables = [
    ['SMTP_HOST', process.env.SMTP_HOST],
    ['SMTP_USER (or EMAIL_USER)', smtpUser],
    ['SMTP_PASS (or EMAIL_PASS)', smtpPass],
  ];
  const missingVariables = requiredVariables
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new Error(`SMTP configuration is incomplete: ${missingVariables.join(', ')}`);
  }

  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

export const sendOTPEmail = async (toEmail, otp) => {
  const transporter = createTransporter();

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

export const sendNewConversationEmail = async ({ seller, buyer, listing }) => {
  const transporter = createTransporter();
  const buyerName = buyer.name || 'A buyer';
  const listingTitle = listing.title || 'your listing';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: seller.email,
    subject: `New buyer inquiry for ${listingTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a5f; margin-bottom: 8px;">CampusTrade NITJ</h2>
        <p style="color: #475569;">Hi ${seller.name || 'there'},</p>
        <p style="color: #475569;"><strong>${buyerName}</strong> started a conversation about your listing, <strong>${listingTitle}</strong>.</p>
        <p style="color: #475569;">Open CampusTrade to view and reply to the inquiry.</p>
      </div>
    `,
  });
};
