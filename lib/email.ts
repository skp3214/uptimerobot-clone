import nodemailer from "nodemailer"

let transporter: nodemailer.Transporter | null = null

export function getEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }
  return transporter
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const transporter = getEmailTransporter()

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to,
      subject,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error }
  }
}
