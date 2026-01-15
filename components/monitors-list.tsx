"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import Link from "next/link"

export default function MonitorsList() {
  const [monitors, setMonitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const fetchMonitors = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase
          .from("monitors")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (!error) {
          setMonitors(data || [])
        }
      }
      setLoading(false)
    }

    fetchMonitors()
  }, [])

  const handleDelete = async (monitorId: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) {
      return
    }

    setDeleting(monitorId)

    try {
      const response = await fetch("/api/monitors/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ monitorId }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete monitor")
      }

      // Remove from local state
      setMonitors((prev) => prev.filter((m) => m.id !== monitorId))
    } catch (error) {
      alert("Failed to delete monitor")
      console.error(error)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading monitors...</div>
  }

  if (monitors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No monitors yet. Create one to get started.</p>
          <Link href="/dashboard/monitor/new">
            <Button>Create First Monitor</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {monitors.map((monitor) => (
        <Card key={monitor.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="flex-1">
              <CardTitle className="text-base">{monitor.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{monitor.url}</p>
            </div>
            <Badge variant={monitor.status === "up" ? "up" : "down"}>
              {monitor.status.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-muted-foreground">
                Uptime: <span className="font-semibold text-foreground">99.9%</span>
              </p>
              <p className="text-muted-foreground">
                Response Time: <span className="font-semibold text-foreground">145ms</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/monitor/${monitor.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(monitor.id)}
                disabled={deleting === monitor.id}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
