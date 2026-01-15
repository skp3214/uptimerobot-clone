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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { monitorId, name, url, check_interval, is_active } = body

    const supabase = await getSupabaseServer()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get existing monitor to check if URL changed
    const { data: existingMonitor } = await supabase
      .from("monitors")
      .select("*")
      .eq("id", monitorId)
      .eq("user_id", user.id)
      .single()

    if (!existingMonitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const urlChanged = existingMonitor.url !== url
    let newStatus = existingMonitor.status
    let responseTime = 0
    let statusCode = 200

    // If URL changed, re-check the health
    if (urlChanged) {
      const healthCheck = await checkMonitorHealth(url)
      newStatus = healthCheck.status
      responseTime = healthCheck.responseTime
      statusCode = healthCheck.statusCode

      // Log the check
      await supabase.from("monitor_checks").insert({
        monitor_id: monitorId,
        status: newStatus,
        response_time: responseTime,
        status_code: statusCode,
      })
    }

    // Update monitor
    const { data: monitor, error: updateError } = await supabase
      .from("monitors")
      .update({
        name,
        url,
        check_interval,
        is_active,
        status: newStatus,
        last_check: urlChanged ? new Date().toISOString() : existingMonitor.last_check,
      })
      .eq("id", monitorId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // If status changed, create incident (no email on manual edit)
    if (urlChanged && existingMonitor.status !== newStatus) {
      const incidentStatus = newStatus === "down" ? "open" : "resolved"

      await supabase.from("incidents").insert({
        monitor_id: monitorId,
        status: incidentStatus,
        started_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, monitor })
  } catch (error) {
    console.error("Monitor update error:", error)
    return NextResponse.json({ error: "Failed to update monitor" }, { status: 500 })
  }
}
