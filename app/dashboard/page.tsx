"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, LogOut, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import MonitorsList from "@/components/monitors-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [monitors, setMonitors] = useState<any[]>([])
  const [analytics, setAnalytics] = useState({
    totalMonitors: 0,
    upMonitors: 0,
    downMonitors: 0,
    averageUptime: 0,
    recentIncidents: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseClient()

    supabase.auth.getUser().then(({ data }) => {
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
      setMonitors(monitorsData)

      const upCount = monitorsData.filter((m: any) => m.status === "up").length
      const downCount = monitorsData.filter((m: any) => m.status === "down").length

      // Calculate average uptime
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: checksData } = await supabase
        .from("monitor_checks")
        .select("*")
        .in(
          "monitor_id",
          monitorsData.map((m: any) => m.id),
        )
        .gte("checked_at", thirtyDaysAgo)

      let avgUptime = 0
      if (checksData && checksData.length > 0) {
        const upCount = checksData.filter((c: any) => c.status === "up").length
        avgUptime = Math.round((upCount / checksData.length) * 100)
      }

      // Get recent incidents
      const { data: incidentsData } = await supabase
        .from("incidents")
        .select("*")
        .in(
          "monitor_id",
          monitorsData.map((m: any) => m.id),
        )
        .gte("created_at", thirtyDaysAgo)

      setAnalytics({
        totalMonitors: monitorsData.length,
        upMonitors: upCount,
        downMonitors: downCount,
        averageUptime: avgUptime,
        recentIncidents: incidentsData?.length || 0,
      })
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
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Incidents will appear here when status changes occur</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
