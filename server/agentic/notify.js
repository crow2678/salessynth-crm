const nodemailer = require("nodemailer");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com"; // Default: Gmail SMTP
const EMAIL_PORT = process.env.EMAIL_PORT || 465; // Default: Secure SMTP port

/**
 * Send an email with sales insights after research completion.
 * @param {string} recipient - Sales rep's email
 * @param {string} subject - Email subject
 * @param {string} textBody - Plain text version of the email
 * @param {string} htmlBody - HTML formatted version of the email
 */
async function sendEmail(recipient, subject, textBody, htmlBody) {
    let transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: true, // Use TLS
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });

    let mailOptions = {
        from: `"SalesSynth Insights" <${EMAIL_USER}>`,
        to: recipient,
        subject: subject,
        text: textBody,
        html: htmlBody,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📩 Email sent to ${recipient}`);
    } catch (error) {
        console.error("❌ Email sending failed:", error);
    }
}

module.exports = { sendEmail };
