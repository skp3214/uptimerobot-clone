"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trash2, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function MonitorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [monitor, setMonitor] = useState<any>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uptime30d, setUptime30d] = useState(0)
  const [uptime7d, setUptime7d] = useState(0)
  const [uptime24h, setUptime24h] = useState(0)

  useEffect(() => {
    const fetchMonitorData = async () => {
      const supabase = getSupabaseClient()

      // Fetch monitor
      const { data: monitorData, error: monitorError } = await supabase
        .from("monitors")
        .select("*")
        .eq("id", params.id)
        .single()

      if (!monitorError && monitorData) {
        setMonitor(monitorData)

        // Fetch incidents (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { data: incidentsData } = await supabase
          .from("incidents")
          .select("*")
          .eq("monitor_id", params.id)
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: false })

        setIncidents(incidentsData || [])

        // Calculate uptime from check history
        const { data: checksData } = await supabase
          .from("monitor_checks")
          .select("*")
          .eq("monitor_id", params.id)
          .gte("checked_at", thirtyDaysAgo)
          .order("checked_at", { ascending: true })

        if (checksData && checksData.length > 0) {
          const now = Date.now()
          const oneDayAgo = now - 24 * 60 * 60 * 1000
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

          // Helper to calc uptime
          const calcUptime = (checks: any[]) => {
            if (checks.length === 0) return 0
            const up = checks.filter((c: any) => c.status === "up").length
            return Math.round((up / checks.length) * 100)
          }

          setUptime30d(calcUptime(checksData))

          const checks7d = checksData.filter((c: any) => new Date(c.checked_at).getTime() > sevenDaysAgo)
          setUptime7d(calcUptime(checks7d))

          const checks24h = checksData.filter((c: any) => new Date(c.checked_at).getTime() > oneDayAgo)
          setUptime24h(calcUptime(checks24h))

          // Prepare chart data (Last 24 hours, all points)
          const chartChecks = checks24h.length > 0 ? checks24h : checksData.slice(-50) // Fallback if no 24h data

          const formattedChartData = chartChecks
            .map((check: any) => ({
              time: new Date(check.checked_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              responseTime: check.response_time,
              status: check.status === "up" ? 1 : 0,
            }))

          setChartData(formattedChartData)
        }
      }

      setLoading(false)
    }

    fetchMonitorData()
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this monitor?")) return

    const supabase = getSupabaseClient()
    await supabase.from("monitors").delete().eq("id", params.id)
    router.push("/dashboard")
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!monitor) {
    return <div className="flex items-center justify-center h-screen">Monitor not found</div>
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
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{monitor.name}</h1>
                <Badge variant="outline">{monitor.type?.toUpperCase() || 'HTTP'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {monitor.type === 'port' ? `${monitor.url}:${monitor.port}` : monitor.url}
                {monitor.type === 'keyword' && ` (Keyword: ${monitor.keyword})`}
              </p>
            </div>
            <Badge variant={monitor.status === "up" ? "default" : "destructive"}>{monitor.status}</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {monitor.status === "up" ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-lg font-bold capitalize">{monitor.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Last checked: {new Date(monitor.last_check_time || monitor.updated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">24-Hour Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uptime24h}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">7-Day Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uptime7d}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">30-Day Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uptime30d}%</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Response Time (Last 24 hours)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="responseTime" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No incidents in the last 30 days</p>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div key={incident.id} className="flex items-start justify-between p-3 border border-border rounded">
                    <div>
                      <p className="font-medium capitalize">{incident.status}</p>
                      <p className="text-sm text-muted-foreground">{incident.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(incident.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={incident.status === "down" ? "destructive" : "default"}>{incident.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 flex gap-3">
          <Link href={`/dashboard/monitor/${monitor.id}/edit`}>
            <Button>Edit Monitor</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Monitor
          </Button>
        </div>
      </main>
    </div>
  )
}
