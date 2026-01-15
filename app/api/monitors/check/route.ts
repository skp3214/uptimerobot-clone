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
    const supabase = await getSupabaseServer()

    // Get all monitors that need to be checked
    const { data: monitors, error: fetchError } = await supabase.from("monitors").select("*").eq("is_active", true)

    if (fetchError) throw fetchError

    for (const monitor of monitors || []) {
      const { status, responseTime, statusCode } = await checkMonitorHealth(monitor.url)
      const previousStatus = monitor.status

      // Update monitor with latest check
      await supabase
        .from("monitors")
        .update({
          status,
          response_time: responseTime,
          last_check_time: new Date().toISOString(),
          last_status_code: statusCode,
        })
        .eq("id", monitor.id)

      // If status changed, create incident and send email
      if (previousStatus !== status && previousStatus !== "pending") {
        const incidentType = status === "down" ? "down" : "up"

        // Create incident record
        await supabase.from("incidents").insert({
          monitor_id: monitor.id,
          status: incidentType,
          message: `Website is ${status}`,
          created_at: new Date().toISOString(),
        })

        // Send notification email
        if (monitor.notification_email) {
          const subject = `ALERT: ${monitor.name} is ${status.toUpperCase()}`
          const html = `
            <h2>${monitor.name} is ${status.toUpperCase()}</h2>
            <p>Website: ${monitor.url}</p>
            <p>Status: ${status}</p>
            <p>Response Time: ${responseTime}ms</p>
            <p>Time: ${new Date().toISOString()}</p>
          `

          await sendEmail({
            to: monitor.notification_email,
            subject,
            html,
          })
        }
      }
    }

    return NextResponse.json({ success: true, checked: monitors?.length || 0 })
  } catch (error) {
    console.error("Monitor check error:", error)
    return NextResponse.json({ error: "Failed to check monitors" }, { status: 500 })
  }
}
