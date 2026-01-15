import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  console.log("[v0] Callback received - code:", code ? "present" : "missing", "error:", error)

  if (error) {
    console.error("[v0] Auth error:", error, errorDescription)
    const errorUrl = new URL("/auth", request.url)
    errorUrl.searchParams.set("error", errorDescription || error)
    return NextResponse.redirect(errorUrl)
  }

  if (!code) {
    console.error("[v0] No code provided in callback")
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  try {
    const supabase = await getSupabaseServer()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("[v0] Code exchange error:", exchangeError.message)
      const errorUrl = new URL("/auth", request.url)
      errorUrl.searchParams.set("error", exchangeError.message)
      return NextResponse.redirect(errorUrl)
    }

    // Ensure user record exists in users table (in case trigger didn't fire)
    if (data.user) {
      const { error: upsertError } = await supabase.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || null,
        },
        { onConflict: "id" }
      )

      if (upsertError) {
        console.error("[v0] Error creating user record:", upsertError.message)
      }
    }

    console.log("[v0] Successfully confirmed email and exchanged code, redirecting to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  } catch (err) {
    console.error("[v0] Callback processing error:", err)
    return NextResponse.redirect(new URL("/auth", request.url))
  }
}
