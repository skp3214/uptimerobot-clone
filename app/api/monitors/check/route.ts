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

    console.log("[Monitor Check] Found monitors:", monitors?.length || 0, "Error:", fetchError)

    if (fetchError) throw fetchError

    for (const monitor of monitors || []) {
      const { status, responseTime, statusCode } = await checkMonitorHealth(monitor.url)
      const previousStatus = monitor.status

      // Update monitor with latest check
      await supabase
        .from("monitors")
        .update({
          status,
          last_check: new Date().toISOString(),
        })
        .eq("id", monitor.id)

      // Log the check in monitor_checks table
      await supabase.from("monitor_checks").insert({
        monitor_id: monitor.id,
        status,
        response_time: responseTime,
        status_code: statusCode,
      })

      // If status changed, create incident and send email
      if (previousStatus !== status) {
        const incidentStatus = status === "down" ? "open" : "resolved"

        // Create incident record
        const { data: incident } = await supabase.from("incidents").insert({
          monitor_id: monitor.id,
          status: incidentStatus,
          started_at: new Date().toISOString(),
        }).select().single()

        // Get user email for notification
        const { data: user } = await supabase
          .from("users")
          .select("email")
          .eq("id", monitor.user_id)
          .single()

        if (user?.email && incident) {
          const subject = `ALERT: ${monitor.name} is ${status.toUpperCase()}`
          const html = `
            <h2>${monitor.name} is ${status.toUpperCase()}</h2>
            <p>Website: ${monitor.url}</p>
            <p>Status: ${status}</p>
            <p>Response Time: ${responseTime}ms</p>
            <p>Time: ${new Date().toISOString()}</p>
          `

          try {
            await sendEmail({
              to: user.email,
              subject,
              html,
            })

            // Log notification
            await supabase.from("notifications").insert({
              user_id: monitor.user_id,
              monitor_id: monitor.id,
              incident_id: incident.id,
              email_sent: true,
              sent_at: new Date().toISOString(),
            })
          } catch (emailError) {
            console.error("Failed to send email:", emailError)
            // Log failed notification
            await supabase.from("notifications").insert({
              user_id: monitor.user_id,
              monitor_id: monitor.id,
              incident_id: incident.id,
              email_sent: false,
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true, checked: monitors?.length || 0 })
  } catch (error) {
    console.error("Monitor check error:", error)
    return NextResponse.json({ error: "Failed to check monitors" }, { status: 500 })
  }
}
