const Brevo = require("@getbrevo/brevo");
require("dotenv").config();

const apiInstance = new Brevo.AccountApi();
const transactionalEmailApi = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  Brevo.AccountApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

transactionalEmailApi.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

async function testBrevoConnection() {
  try {
    const response = await apiInstance.getAccount();
    console.log("✅ Brevo connection successful");
    console.log("Account info:", response);
  } catch (error) {
    console.error(
      "❌ Brevo connection failed",
      error.response?.body || error.message
    );
  }
}

const sendBrevoInvitationEmail = async (recipientEmail, orgId, role, orgName) => {
  try {
    const inviteLink = `${
      process.env.FRONTEND_URL
    }/join-organization?orgId=${orgId}&role=${role}&orgName=${encodeURIComponent(
      orgName
    )}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>Organization Invitation</title></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;">
        <table role="presentation" style="width:100%;background:#f3f4f6;">
          <tr>
            <td style="padding:40px 20px;">
              <table role="presentation" style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px;text-align:center;color:#fff;">
                    <h1 style="margin:0;font-size:32px;font-weight:700;">AiMind</h1>
                    <p style="margin:0;">Organization Invitation</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 30px;">
                    <h2 style="margin-bottom:16px;color:#1f2937;">You're Invited! 🎉</h2>
                    <p style="margin-bottom:24px;color:#4b5563;">
                      You've been invited to join <strong>${orgName}</strong> as a <strong>${role}</strong>.
                    </p>
                    <div style="background:#f3f4f6;border-left:4px solid #667eea;border-radius:8px;padding:20px;margin-bottom:32px;">
                      <p style="margin:0 0 8px;color:#6b7280;"><strong>Organization:</strong> ${orgName}</p>
                      <p style="margin:0;color:#6b7280;"><strong>Role:</strong> ${role}</p>
                    </div>
                    <div style="text-align:center;margin-bottom:24px;">
                      <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;text-decoration:none;padding:16px 48px;border-radius:12px;font-weight:600;">Accept Invitation →</a>
                    </div>
                    <p style="font-size:14px;color:#6b7280;">If the button doesn't work, copy this link:</p>
                    <p style="word-break:break-all;color:#667eea;font-size:12px;background:#f9fafb;padding:12px;border-radius:6px;border:1px solid #e5e7eb;">${inviteLink}</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:30px;text-align:center;font-size:12px;color:#9ca3af;">
                    This invitation was sent by AiMind<br>
                    If you didn't expect this invitation, ignore this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`;

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: "AiMind Team", email: process.env.EMAIL_USER };
    sendSmtpEmail.to = [{ email: recipientEmail }];
    sendSmtpEmail.subject = `🎉 You're invited to join ${orgName}!`;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = `
                                You're Invited to Join ${orgName}!

                                You've been invited to join ${orgName} as a ${role}.

                                Click below to accept:
                                ${inviteLink}
    `;

    const result = await transactionalEmailApi.sendTransacEmail(sendSmtpEmail);
    console.log(
      "✅ Email sent successfully via Brevo API:",
      result.messageId || result
    );
    return { success: true, result };
  } catch (error) {
    console.error(
      "❌ Error sending email via Brevo API:",
      error.response?.body || error.message
    );
    throw new Error("Failed to send email");
  }
};

module.exports = {
  testBrevoConnection,
  sendBrevoInvitationEmail,
};