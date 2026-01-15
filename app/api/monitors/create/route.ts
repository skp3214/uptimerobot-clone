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
      const { data: incident } = await supabase
        .from("incidents")
        .insert({
          monitor_id: monitor.id,
          status: "open",
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      // Get user email for notification
      const { data: userData } = await supabase.from("users").select("email").eq("id", user.id).single()

      if (userData?.email && incident) {
        const subject = `ALERT: ${name} is DOWN`
        const html = `
          <h2>${name} is DOWN</h2>
          <p>Your newly created monitor detected that the website is down.</p>
          <p><strong>Website:</strong> ${url}</p>
          <p><strong>Status Code:</strong> ${statusCode || "No response"}</p>
          <p><strong>Response Time:</strong> ${responseTime}ms</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated alert from UptimeMonitor</p>
        `

        try {
          await sendEmail({
            to: userData.email,
            subject,
            html,
          })

          // Log notification
          await supabase.from("notifications").insert({
            user_id: user.id,
            monitor_id: monitor.id,
            incident_id: incident.id,
            email_sent: true,
            sent_at: new Date().toISOString(),
          })

          console.log(`[Monitor Create] Email sent to ${userData.email} for down monitor`)
        } catch (emailError) {
          console.error("Failed to send email:", emailError)
          // Log failed notification
          await supabase.from("notifications").insert({
            user_id: user.id,
            monitor_id: monitor.id,
            incident_id: incident.id,
            email_sent: false,
          })
        }
      }
    }

    return NextResponse.json({ success: true, monitor })
  } catch (error) {
    console.error("Monitor creation error:", error)
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 })
  }
}
