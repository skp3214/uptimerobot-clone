"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"


interface Monitor {
  id: string
  name: string
  url: string
  user_id: string
}

interface Incident {
  id: string
  monitor_id: string
  status: string
  message: string
  created_at: string
  monitors?: {
    name: string
    url: string
  }
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [userMonitors, setUserMonitors] = useState<Monitor[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get user's monitors
        const { data: monitorsData } = await supabase.from("monitors").select("id").eq("user_id", user.id)

        if (monitorsData) {
          setUserMonitors(monitorsData as unknown as Monitor[])
          const monitorIds = monitorsData.map((m: any) => m.id)

          // Get incidents for these monitors
          const { data: incidentsData } = await supabase
            .from("incidents")
            .select(
              `
              *,
              monitors (id, name, url)
            `,
            )
            .in("monitor_id", monitorIds)
            .order("created_at", { ascending: false })

          setIncidents(incidentsData || [])
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [])



  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Incident History</h1>
          <p className="text-sm text-muted-foreground">View all incidents across your monitors</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No incidents recorded</p>
              </CardContent>
            </Card>
          ) : (
            incidents.map((incident) => (
              <Card key={incident.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      {incident.status === "open" ? (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{incident.monitors?.name || "Monitor"}</p>
                        <p className="text-sm text-muted-foreground">{incident.monitors?.url || ""}</p>
                        <p className="text-sm mt-1">{incident.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(incident.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={incident.status === "open" ? "destructive" : "default"}>
                      {incident.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
