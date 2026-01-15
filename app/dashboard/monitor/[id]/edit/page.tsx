"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditMonitorPage() {
  const params = useParams()
  const router = useRouter()
  const [monitor, setMonitor] = useState<any>(null)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [monitorInterval, setMonitorInterval] = useState("300")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchMonitor = async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("monitors").select("*").eq("id", params.id).single()

      if (!error && data) {
        setMonitor(data)
        setName(data.name)
        setUrl(data.url)
        setMonitorInterval(data.check_interval?.toString() || "300")
        setIsActive(data.is_active ?? true)
      }
      setLoading(false)
    }

    fetchMonitor()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/monitors/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monitorId: params.id,
          name,
          url,
          check_interval: Number.parseInt(monitorInterval),
          is_active: isActive,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update monitor")
      }

      router.push(`/dashboard/monitor/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update monitor")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/dashboard/monitor/${params.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Monitor
          </Link>
          <h1 className="text-2xl font-bold">Edit Monitor</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Monitor Details</CardTitle>
            <CardDescription>Update your monitor configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">Monitor Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Website URL</label>
                <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Check Interval</label>
                <select
                  value={monitorInterval}
                  onChange={(e) => setMonitorInterval(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="300">Every 5 minutes</option>
                  <option value="600">Every 10 minutes</option>
                  <option value="1800">Every 30 minutes</option>
                  <option value="3600">Every 1 hour</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Monitor is active
                </label>
              </div>

              {error && <div className="text-sm text-destructive">{error}</div>}

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Link href={`/dashboard/monitor/${params.id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
