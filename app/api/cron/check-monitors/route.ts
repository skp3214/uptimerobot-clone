import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import { checkMonitorHealth } from "@/lib/monitor"

export async function GET(request: NextRequest) {
  // This endpoint should be called by a cron service (e.g., Vercel Cron)
  // to trigger monitor checks every 5 minutes

  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // Allow both Bearer token (GitHub Actions) and Vercel Cron internal calls
  if (authHeader !== `Bearer ${cronSecret}` && authHeader !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseServiceRole()

    // Get all monitors that need to be checked
    const { data: monitors, error: fetchError } = await supabase.from("monitors").select("*").eq("is_active", true)

    console.log("[Cron] Found monitors:", monitors?.length || 0)

    if (fetchError) {
      console.error("[Cron] Fetch error:", fetchError)
      throw fetchError
    }

    for (const monitor of monitors || []) {
      const { status, responseTime, statusCode } = await checkMonitorHealth(monitor)
      const previousStatus = monitor.status

      // Update monitor with latest check
      // We also update type/keyword/port in case this was a first-run correction or similar, but mainly status/last_check
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
        console.log(`[Cron] Status changed for ${monitor.name}: ${previousStatus} -> ${status}`)
        const incidentStatus = status === "down" ? "open" : "resolved"

        // Create incident record
        const { data: incident, error: incidentError } = await supabase
          .from("incidents")
          .insert({
            monitor_id: monitor.id,
            status: incidentStatus,
            started_at: new Date().toISOString(),
            // Store details about why it failed if possible? Schema doesn't support it yet likely.
          })
          .select()
          .single()

        console.log(`[Cron] Incident created:`, incident, incidentError)

        // Get user email for notification
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("email")
          .eq("id", monitor.user_id)
          .single()

        console.log(`[Cron] User lookup:`, user, userError)

        if (user?.email && incident) {
          const subject = `ALERT: ${monitor.name} is ${status.toUpperCase()}`
          let details = `<p>Type: ${monitor.type || 'http'}</p>`
          if (monitor.type === 'keyword') details += `<p>Keyword: ${monitor.keyword}</p>`
          if (monitor.type === 'port') details += `<p>Port: ${monitor.port}</p>`

          const html = `
            <h2>${monitor.name} is ${status.toUpperCase()}</h2>
            <p>Target: ${monitor.url}</p>
            ${details}
            <p>Status: ${status}</p>
            <p>Status Code: ${statusCode}</p>
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

            console.log(`[Cron] Email sent to ${user.email} for ${monitor.name}`)
          } catch (emailError) {
            console.error("[Cron] Failed to send email:", emailError)
            // Log failed notification
            await supabase.from("notifications").insert({
              user_id: monitor.user_id,
              monitor_id: monitor.id,
              incident_id: incident.id,
              email_sent: false,
            })
          }
        } else {
          console.error(`[Cron] Cannot send email - user: ${user?.email}, incident: ${incident?.id}`)
        }
      }
    }

    return NextResponse.json({ success: true, checked: monitors?.length || 0 })
  } catch (error) {
    console.error("[Cron] Error:", error)
    return NextResponse.json(
      { error: "Cron failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
