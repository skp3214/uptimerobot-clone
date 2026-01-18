"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, LogOut, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import MonitorsList from "@/components/monitors-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Monitor {
  id: string
  name: string
  url: string
  status: string
  user_id: string
}

interface Incident {
  id: string
  status: string
  message: string
  created_at: string
  monitors?: {
    name: string
    url: string
  }
}

interface MonitorCheck {
  id: string
  status: string
  checked_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [analytics, setAnalytics] = useState({
    totalMonitors: 0,
    upMonitors: 0,
    downMonitors: 0,
    averageUptime: 0,
    recentIncidents: 0,
  })
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([])
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseClient()

    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!data.user) {
        router.push("/auth")
      } else {
        setUser(data.user)
        fetchAnalytics(supabase, data.user.id)
      }
      setLoading(false)
    })
  }, [router])

  const fetchAnalytics = async (supabase: any, userId: string) => {
    // Fetch monitors
    const { data: monitorsData } = await supabase.from("monitors").select("*").eq("user_id", userId)

    if (monitorsData) {
      const typedMonitors = monitorsData as Monitor[]
      setMonitors(typedMonitors)

      const upCount = typedMonitors.filter((m) => m.status === "up").length
      const downCount = typedMonitors.filter((m) => m.status === "down").length

      // Calculate average uptime
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: checksData } = await supabase
        .from("monitor_checks")
        .select("*")
        .in(
          "monitor_id",
          typedMonitors.map((m) => m.id),
        )
        .gte("checked_at", thirtyDaysAgo)

      let avgUptime = 0
      if (checksData && checksData.length > 0) {
        const typedChecks = checksData as MonitorCheck[]
        const upCount = typedChecks.filter((c) => c.status === "up").length
        avgUptime = Math.round((upCount / typedChecks.length) * 100)
      }

      // Get recent incidents
      const { data: incidentsData } = await supabase
        .from("incidents")
        .select(`
          *,
          monitors (name, url)
        `)
        .in(
          "monitor_id",
          typedMonitors.map((m) => m.id),
        )
        .order("created_at", { ascending: false })
        .limit(5)

      setAnalytics({
        totalMonitors: monitorsData.length,
        upMonitors: upCount,
        downMonitors: downCount,
        averageUptime: avgUptime,
        recentIncidents: incidentsData?.length || 0,
      })
      setRecentIncidents((incidentsData as unknown as Incident[]) || [])
    }
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push("/auth")
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">UptimeMonitor</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="monitors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monitors">Monitors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
          </TabsList>

          <TabsContent value="monitors" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Your Monitors</h2>
                <p className="text-sm text-muted-foreground">Track and manage your website monitors</p>
              </div>
              <Link href="/dashboard/monitor/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Monitor
                </Button>
              </Link>
            </div>
            <MonitorsList />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <h2 className="text-xl font-semibold">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Monitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.totalMonitors}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active / Down</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Badge variant="default">{analytics.upMonitors} UP</Badge>
                    <Badge variant="destructive">{analytics.downMonitors} DOWN</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">30-Day Avg Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.averageUptime}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Recent Incidents (30d)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <div className="text-3xl font-bold">{analytics.recentIncidents}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recent Incidents</h2>
              <Link href="/dashboard/incidents">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            {recentIncidents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Incidents will appear here when status changes occur</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentIncidents.map((incident) => (
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
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
