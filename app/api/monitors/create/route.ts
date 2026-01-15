import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"

async function checkMonitorHealth(url: string): Promise<{
  status: "up" | "down"
  responseTime: number
  statusCode: number
}> {
  const startTime = Date.now()
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow" })
    const responseTime = Date.now() - startTime

    return {
      status: response.ok ? "up" : "down",
      responseTime,
      statusCode: response.status,
    }
  } catch (error) {
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      statusCode: 0,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, check_interval } = body

    const supabase = await getSupabaseServer()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the URL is actually up or down
    const { status: initialStatus, responseTime, statusCode } = await checkMonitorHealth(url)

    // Insert monitor with actual status
    const { data: monitor, error: insertError } = await supabase
      .from("monitors")
      .insert({
        user_id: user.id,
        name,
        url,
        check_interval,
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
