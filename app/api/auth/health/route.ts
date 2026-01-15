import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getEmailTransporter } from "@/lib/email"

export async function GET() {
  const checks = {
    supabase: false,
    smtp: false,
    appUrl: false,
    errors: [] as string[],
  }

  // Check Supabase connection
  try {
    const supabase = await getSupabaseServer()
    const { data } = await supabase.auth.getUser()
    checks.supabase = true
  } catch (err) {
    checks.errors.push(`Supabase error: ${err instanceof Error ? err.message : "Unknown error"}`)
  }

  // Check SMTP configuration
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      checks.errors.push("SMTP configuration incomplete: SMTP_HOST, SMTP_USER, or SMTP_PASSWORD missing")
    } else {
      const transporter = getEmailTransporter()
      await transporter.verify()
      checks.smtp = true
    }
  } catch (err) {
    checks.errors.push(`SMTP error: ${err instanceof Error ? err.message : "Unknown error"}`)
  }

  // Check App URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    checks.appUrl = true
  } else {
    checks.errors.push("NEXT_PUBLIC_APP_URL environment variable is not set")
  }

  return NextResponse.json(checks)
}
