import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Send email verification email
 * @param to Recipient email address
 * @param token Verification token
 * @param name User's name (optional)
 */
export async function sendVerificationEmail(
    to: string,
    token: string,
    name?: string | null
) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject: "Verify your GitDoc email address",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">GitDoc</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">
                                            ${name ? `Hi ${name},` : 'Hello,'}
                                        </h2>
                                        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                            Thank you for signing up for GitDoc! To complete your registration, please verify your email address using the code below.
                                        </p>
                                        
                                        <!-- OTP Code Box -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; display: inline-block;">
                                                        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                                                        <p style="color: #ffffff; font-size: 48px; font-weight: bold; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${token}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                                            Enter this code on the verification page to confirm your email address.
                                        </p>
                                        
                                        <p style="color: #ff6b6b; font-size: 14px; line-height: 1.6; margin: 20px 0; padding: 15px; background-color: #fff5f5; border-left: 4px solid #ff6b6b; border-radius: 4px;">
                                            <strong>⏰ This code expires in 15 minutes</strong> for your security.
                                        </p>
                                        
                                        <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                            If you didn't create an account with GitDoc, you can safely ignore this email.
                                        </p>
                                        
                                        <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0; font-style: italic;">
                                            🔒 For security reasons, never share this code with anyone.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                                        <p style="color: #999999; font-size: 12px; margin: 0;">
                                            © ${new Date().getFullYear()} GitDoc. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${to}`);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
    }
}


