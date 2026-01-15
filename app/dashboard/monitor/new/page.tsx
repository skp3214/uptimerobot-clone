"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewMonitorPage() {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [monitorInterval, setMonitorInterval] = useState("300")
  const [notificationEmail, setNotificationEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = getSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth")
      return
    }

    try {
      // Call server-side API to create monitor and check its status
      const response = await fetch("/api/monitors/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          url,
          check_interval: Number.parseInt(monitorInterval),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create monitor")
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create monitor")
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold">Create New Monitor</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Monitor Details</CardTitle>
            <CardDescription>Set up a new website monitor to track its uptime and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">Monitor Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., My Website" required />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Website URL</label>
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
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

              <div>
                <label className="text-sm font-medium block mb-2">Notification Email</label>
                <Input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              {error && <div className="text-sm text-destructive">{error}</div>}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Monitor"}
                </Button>
                <Link href="/dashboard">
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
