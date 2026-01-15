import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json()

    const result = await sendEmail({
      to,
      subject,
      html,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      { error: "Failed to send test email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
