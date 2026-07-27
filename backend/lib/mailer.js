import nodemailer from "nodemailer";
console.log("Nodemailer imported. process.env.EMAIL_USER:", process.env.EMAIL_USER ? "DEFINED" : "UNDEFINED");

console.log("Creating transporter...");
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
console.log("Transporter created");

export const sendNotificationMail = async (to, subject, text) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Email credentials not configured.");
      return false;
    }

    const mailOptions = {
      from: `"ConvoTalk" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
};
