const brevo = require("@getbrevo/brevo");

const sendEmail = async (options) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("BREVO_API_KEY is missing!");

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.authentications['apiKey'].apiKey = apiKey;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: process.env.FROM_NAME || "PharmaCare",
      email: process.env.FROM_EMAIL,
    };
    sendSmtpEmail.to = [{ email: options.email }];
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.textContent = options.message;
    if (options.html) sendSmtpEmail.htmlContent = options.html;

    console.log(`[Brevo] Attempting to send email to ${options.email}...`);

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("✅ [Brevo] Success! Response:", data);
    return data;

  } catch (error) {
    // Better error logging
    if (error.response && error.response.body) {
      console.error("❌ [Brevo] API Error:", error.response.body);
    } else if (error.body) {
      console.error("❌ [Brevo] API Error (body):", error.body);
    } else {
      console.error("❌ [Brevo] General Error:", error.message);
    }
    throw error;
  }
};

module.exports = sendEmail;
