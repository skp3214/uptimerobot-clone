import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import { checkMonitorHealth } from "@/lib/monitor"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, check_interval, type = "http", keyword, port } = body

    const supabase = await getSupabaseServer()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the URL is actually up or down
    // We pass a mock monitor object
    const { status: initialStatus, responseTime, statusCode } = await checkMonitorHealth({
      url, type, keyword, port
    })

    // Insert monitor with actual status
    const { data: monitor, error: insertError } = await supabase
      .from("monitors")
      .insert({
        user_id: user.id,
        name,
        url,
        check_interval,
        type,
        keyword,
        port,
        status: initialStatus,
        last_check: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // Log the initial check
    await supabase.from("monitor_checks").insert({
      monitor_id: monitor.id,
      status: initialStatus,
      response_time: responseTime,
      status_code: statusCode,
    })

    // If the monitor is down on creation, create an incident
    if (initialStatus === "down") {
      await supabase.from("incidents").insert({
        monitor_id: monitor.id,
        status: "open",
        started_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, monitor })
  } catch (error) {
    console.error("Monitor creation error:", error)
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 })
  }
}
