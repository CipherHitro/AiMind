const nodemailer = require("nodemailer");
require("dotenv").config();

const createTransporter = () => {

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.BREVO_EMAIL_USER,
      pass: process.env.BREVO_APP_PASSWORD,
    },
  });
};

const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("Email service connection successful");
    return true;
  } catch (error) {
    console.error("Email server connection failed:", error);
    return false;
  }
};

const sendInvitationEmail = async (recipientEmail, orgId, role, orgName) => {
  try {
    const transporter = createTransporter();
    const inviteLink = `${
      process.env.FRONTEND_URL
    }/join-organization?orgId=${orgId}&role=${role}&orgName=${encodeURIComponent(
      orgName
    )}`;

    const mailOptions = {
      from: {
        name: "AiMind Team",
        address: process.env.EMAIL_USER,
      },
      to: recipientEmail,
      subject: `🎉 You're invited to join ${orgName}!`,
      html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Organization Invitation</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
                        <tr>
                            <td style="padding: 40px 20px;">
                                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                    
                                    <!-- Header with Gradient -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                            <div style="margin-bottom: 16px;">
                                                <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">AiMind</h1>
                                            </div>
                                            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Organization Invitation</p>
                                        </td>
                                    </tr>

                                    <!-- Main Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600;">You're Invited! 🎉</h2>
                                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                                You've been invited to join <strong style="color: #667eea;">${orgName}</strong> as a <strong style="text-transform: capitalize;">${role}</strong>.
                                            </p>

                                            <!-- Info Box -->
                                            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                                                <p style="margin: 0 0 12px; color: #374151; font-size: 14px; font-weight: 600;">📋 Invitation Details:</p>
                                                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                                    <strong>Organization:</strong> ${orgName}
                                                </p>
                                                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Role:</strong> <span style="text-transform: capitalize;">${role}</span>
                                                </p>
                                            </div>

                                            <!-- CTA Button -->
                                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                                                <tr>
                                                    <td style="text-align: center;">
                                                        <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                                            Accept Invitation →
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                                By accepting this invitation, you'll gain access to collaborate with your team and unlock powerful AI features.
                                            </p>

                                            <!-- Divider -->
                                            <div style="border-top: 1px solid #e5e7eb; margin: 32px 0;"></div>

                                            <!-- Alternative Link -->
                                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                                                If the button doesn't work, copy and paste this link into your browser:
                                            </p>
                                            <p style="margin: 0; color: #667eea; font-size: 12px; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                                                ${inviteLink}
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                            <p style="margin: 0 0 8px; color: #9ca3af; font-size: 13px;">
                                                This invitation was sent by AiMind
                                            </p>
                                            <p style="margin: 0 0 16px; color: #9ca3af; font-size: 12px;">
                                                If you didn't expect this invitation, you can safely ignore this email.
                                            </p>
                                            <div style="margin-top: 20px;">
                                                <a href="https://github.com/CipherHitro" style="color: #667eea; text-decoration: none; font-size: 12px; margin: 0 8px;">GitHub</a>
                                                <span style="color: #d1d5db;">•</span>
                                                <a href="#" style="color: #667eea; text-decoration: none; font-size: 12px; margin: 0 8px;">Support</a>
                                            </div>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
      text: `
        You're Invited to Join ${orgName}!

        You've been invited to join ${orgName} as a ${role}.

        Click the link below to accept your invitation:
        ${inviteLink}

        By accepting this invitation, you'll gain access to collaborate with your team and unlock powerful AI features.

        If you didn't expect this invitation, you can safely ignore this email.

        This is an automated message from AiMind.
            `,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = {
  testEmailConnection,
  sendInvitationEmail,
};
