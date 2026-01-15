import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServer()

    // Get public status page
    const { data: statusPage } = await supabase
      .from("status_pages")
      .select(
        `
        *,
        monitors (
          id,
          name,
          url,
          status,
          response_time,
          last_check_time
        )
      `,
      )
      .eq("id", params.id)
      .eq("is_public", true)
      .single()

    if (!statusPage) {
      return NextResponse.json({ error: "Status page not found" }, { status: 404 })
    }

    return NextResponse.json(statusPage)
  } catch (error) {
    console.error("Status page error:", error)
    return NextResponse.json({ error: "Failed to fetch status page" }, { status: 500 })
  }
}
