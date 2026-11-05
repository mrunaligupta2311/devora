import { AppError } from "../utils/AppError.js";

export async function sendBrevoEmail({ to, name, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Devora";

  if (!apiKey || !senderEmail) {
    throw new AppError("Email service is not configured.", 503);
  }

  let response;

  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: to }],
        subject,
        textContent: `Hello ${name || "there"}, please use the verification code in this email to complete your Devora registration.`,
        htmlContent,
      }),
    });
  } catch (error) {
    console.error("Brevo connection error:", error.message);
    throw new AppError("Unable to reach the email service. Please try again.", 503);
  }

  const responseBody = await response.text().catch(() => "");

  if (!response.ok) {
    console.error("Brevo request rejected:", {
      status: response.status,
    });

    throw new AppError("Unable to send verification email. Please try again.", 502);
  }

  let result = {};

  try {
    result = JSON.parse(responseBody);
  } catch {
    // Response body was not valid JSON.
  }

  console.log("Brevo accepted email:", {
    status: response.status,
    messageId: result.messageId || "Not provided",
  });

  return true;
}
