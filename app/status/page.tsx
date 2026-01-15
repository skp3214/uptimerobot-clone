"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function StatusPage() {
  const [publicStatus, setPublicStatus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPublicStatus = async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("status_pages")
        .select(`
          *,
          monitors (
            id,
            name,
            url,
            status,
            last_check_time,
            response_time
          )
        `)
        .eq("is_public", true)

      if (!error) {
        setPublicStatus(data || [])
      }
      setLoading(false)
    }

    fetchPublicStatus()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading status pages...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-muted-foreground mt-2">Real-time status of all monitored services</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {publicStatus.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No public status pages available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {publicStatus.map((page: any) => (
              <Card key={page.id}>
                <CardHeader>
                  <CardTitle>{page.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {page.monitors?.map((monitor: any) => (
                      <div
                        key={monitor.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{monitor.name}</p>
                          <p className="text-sm text-muted-foreground">{monitor.url}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={monitor.status === "up" ? "default" : "destructive"}>{monitor.status}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{monitor.response_time}ms</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
