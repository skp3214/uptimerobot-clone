import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // This endpoint should be called by a cron service (e.g., Vercel Cron)
  // to trigger monitor checks every 5 minutes

  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/monitors/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error("Cron error:", error)
    return NextResponse.json({ error: "Cron failed" }, { status: 500 })
  }
}
