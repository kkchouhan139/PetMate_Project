const nodemailer = require('nodemailer');

const port = Number(process.env.EMAIL_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  pool: true,
  maxConnections: 5,
  maxMessages: 10
});

const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your email for PetMate',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { margin: 0; padding: 0; background: #f5f7fb; color: #1f2937; font-family: Arial, Helvetica, sans-serif; }
          .wrapper { width: 100%; background: #f5f7fb; padding: 24px 0; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
          .header { background: #111827; color: #ffffff; padding: 24px; text-align: left; }
          .brand { font-size: 20px; font-weight: 700; letter-spacing: 0.2px; }
          .content { padding: 28px; }
          .title { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
          .text { font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 12px; }
          .otp { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; text-align: center; border-radius: 10px; margin: 16px 0; }
          .otp-code { font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #f97316; }
          .muted { font-size: 12px; color: #6b7280; margin-top: 8px; }
          .footer { padding: 16px 28px 24px; font-size: 12px; color: #6b7280; }
          .divider { height: 1px; background: #e5e7eb; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="brand">PetMate</div>
            </div>
            <div class="content">
              <h1 class="title">Verify your email</h1>
              <p class="text">Hi ${name},</p>
              <p class="text">Use the verification code below to complete your sign-up. This code expires in 10 minutes.</p>
              <div class="otp">
                <div class="otp-code">${otp}</div>
                <div class="muted">Do not share this code with anyone.</div>
              </div>
              <p class="text">If you did not request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <div class="divider"></div>
              <div>PetMate Team</div>
              <div class="muted">If you need help, reply to this email or contact support.</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, resetToken, name) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Reset your PetMate password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { margin: 0; padding: 0; background: #f5f7fb; color: #1f2937; font-family: Arial, Helvetica, sans-serif; }
          .wrapper { width: 100%; background: #f5f7fb; padding: 24px 0; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
          .header { background: #111827; color: #ffffff; padding: 24px; text-align: left; }
          .brand { font-size: 20px; font-weight: 700; letter-spacing: 0.2px; }
          .content { padding: 28px; }
          .title { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
          .text { font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 12px; }
          .button { display: inline-block; background: #f97316; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 700; }
          .link { word-break: break-all; color: #2563eb; }
          .footer { padding: 16px 28px 24px; font-size: 12px; color: #6b7280; }
          .divider { height: 1px; background: #e5e7eb; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="brand">PetMate</div>
            </div>
            <div class="content">
              <h1 class="title">Reset your password</h1>
              <p class="text">Hi ${name},</p>
              <p class="text">We received a request to reset your PetMate password. Click the button below to continue.</p>
              <p class="text">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p class="text">This link expires in 1 hour and can only be used once.</p>
              <p class="text">If you did not request this, you can ignore this email.</p>
              <p class="text">Having trouble with the button? Use this link:</p>
              <p class="text link">${resetUrl}</p>
            </div>
            <div class="footer">
              <div class="divider"></div>
              <div>PetMate Team</div>
              <div class="muted">If you need help, reply to this email or contact support.</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendPasswordResetEmail };
