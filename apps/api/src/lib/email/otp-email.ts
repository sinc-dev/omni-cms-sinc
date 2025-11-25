/**
 * Email Service for OTP Codes
 * Sends OTP codes via email
 */

/**
 * Send OTP code via email
 * @param email - Recipient email address
 * @param code - OTP code to send
 * @param env - Environment variables (for email service configuration)
 * @returns Promise that resolves when email is sent
 */
export async function sendOTPEmail(
  email: string,
  code: string,
  env?: {
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    EMAIL_FROM_NAME?: string;
  }
): Promise<void> {
  // For now, we'll use a simple email service
  // In production, integrate with Resend, SendGrid, or Cloudflare Email Workers
  
  const fromEmail = env?.EMAIL_FROM || 'noreply@omni-cms.local';
  const fromName = env?.EMAIL_FROM_NAME || 'Omni CMS';
  
  // If Resend API key is provided, use Resend
  if (env?.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [email],
          subject: 'Your Omni CMS Sign-In Code',
          html: getOTPEmailTemplate(code),
          text: getOTPEmailText(code),
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send email via Resend: ${error}`);
      }
      
      return;
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      throw error;
    }
  }
  
  // Fallback: Log email for development (in production, this should fail)
  if (process.env.NODE_ENV === 'development' || !env?.RESEND_API_KEY) {
    console.log('📧 OTP Email (development mode):');
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log(`Expires in: 10 minutes`);
    // In development, we'll just log it
    // In production, you should configure an email service
    return;
  }
  
  throw new Error('Email service not configured. Please set RESEND_API_KEY or configure another email service.');
}

/**
 * Get HTML email template for OTP
 */
function getOTPEmailTemplate(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Sign-In Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Omni CMS</h1>
  </div>
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Your Sign-In Code</h2>
    <p style="color: #6b7280; font-size: 16px;">Use the code below to sign in to your Omni CMS account:</p>
    <div style="background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; font-family: 'Courier New', monospace;">
        ${code}
      </div>
    </div>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">This code will expire in 10 minutes.</p>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If you didn't request this code, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get plain text email template for OTP
 */
function getOTPEmailText(code: string): string {
  return `
Omni CMS - Your Sign-In Code

Use the code below to sign in to your Omni CMS account:

${code}

This code will expire in 10 minutes.

If you didn't request this code, you can safely ignore this email.
  `.trim();
}

