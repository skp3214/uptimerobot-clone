import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { monitorId } = await request.json()

    // Verify user owns this monitor
    const { data: monitor } = await supabase.from("monitors").select("user_id").eq("id", monitorId).single()

    if (!monitor || monitor.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete monitor
    const { error } = await supabase.from("monitors").delete().eq("id", monitorId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Failed to delete monitor" }, { status: 500 })
  }
}
