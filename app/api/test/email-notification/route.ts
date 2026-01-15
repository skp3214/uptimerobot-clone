import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  const logs: string[] = []
  
  try {
    logs.push("Starting email notification test...")
    
    const supabase = await getSupabaseServer()
    
    // Get first monitor
    const { data: monitor, error: monitorError } = await supabase
      .from("monitors")
      .select("*")
      .limit(1)
      .single()
    
    if (monitorError) {
      logs.push(`Monitor fetch error: ${JSON.stringify(monitorError)}`)
      return NextResponse.json({ success: false, logs, error: monitorError })
    }
    
    logs.push(`Monitor found: ${monitor.name}`)
    
    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", monitor.user_id)
      .single()
    
    if (userError) {
      logs.push(`User fetch error: ${JSON.stringify(userError)}`)
      return NextResponse.json({ success: false, logs, error: userError })
    }
    
    logs.push(`User found: ${user.email}`)
    
    // Create test incident
    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .insert({
        monitor_id: monitor.id,
        status: "open",
        started_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (incidentError) {
      logs.push(`Incident creation error: ${JSON.stringify(incidentError)}`)
      return NextResponse.json({ success: false, logs, error: incidentError })
    }
    
    logs.push(`Incident created: ${incident.id}`)
    
    // Send test email
    const subject = `TEST ALERT: ${monitor.name} is DOWN`
    const html = `
      <h2>This is a test email notification</h2>
      <p>Monitor: ${monitor.name}</p>
      <p>URL: ${monitor.url}</p>
      <p>Time: ${new Date().toISOString()}</p>
    `
    
    logs.push(`Attempting to send email to: ${user.email}`)
    
    try {
      const emailResult = await sendEmail({
        to: user.email,
        subject,
        html,
      })
      
      logs.push(`Email sent successfully: ${JSON.stringify(emailResult)}`)
      
      // Log notification
      await supabase.from("notifications").insert({
        user_id: monitor.user_id,
        monitor_id: monitor.id,
        incident_id: incident.id,
        email_sent: true,
        sent_at: new Date().toISOString(),
      })
      
      logs.push("Notification logged in database")
      
      return NextResponse.json({ success: true, logs, emailResult })
    } catch (emailError: any) {
      logs.push(`Email send error: ${emailError.message || JSON.stringify(emailError)}`)
      logs.push(`Error stack: ${emailError.stack}`)
      
      // Log failed notification
      await supabase.from("notifications").insert({
        user_id: monitor.user_id,
        monitor_id: monitor.id,
        incident_id: incident.id,
        email_sent: false,
      })
      
      return NextResponse.json({ success: false, logs, error: emailError.message })
    }
  } catch (error: any) {
    logs.push(`General error: ${error.message || JSON.stringify(error)}`)
    return NextResponse.json({ success: false, logs, error: error.message })
  }
}
