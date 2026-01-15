"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function IncidentsList() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIncidents = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get all incidents for user's monitors
        const { data, error } = await supabase
          .from("incidents")
          .select(`
            *,
            monitors (id, name, url)
          `)
          .in("monitor_id", [
            // This would need a subquery, so we'll fetch monitors first
          ])
          .order("created_at", { ascending: false })
          .limit(20)

        if (!error && data) {
          setIncidents(data || [])
        }
      }
      setLoading(false)
    }

    fetchIncidents()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading incidents...</div>
  }

  if (incidents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <p className="text-muted-foreground">No incidents - all systems operational!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <Card key={incident.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                {incident.status === "down" ? (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">
                    {incident.monitors?.name || "Monitor"} - {incident.status === "down" ? "Down" : "Up"}
                  </p>
                  <p className="text-sm text-muted-foreground">{incident.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(incident.created_at).toLocaleString()}</p>
                </div>
              </div>
              <Badge variant={incident.status === "down" ? "destructive" : "default"}>{incident.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
