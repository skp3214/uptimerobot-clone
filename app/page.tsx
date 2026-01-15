import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Bell, Shield } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">UptimeMonitor</h1>
          <div className="flex gap-3">
            <Link href="/auth?mode=signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Monitor Your Websites with Confidence</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get instant alerts when your websites go down. Track uptime, response times, and performance metrics in
            real-time.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg">
                Start Monitoring
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/status">
              <Button size="lg" variant="outline">
                View Status Pages
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="p-6 rounded-lg border border-border bg-card">
            <Shield className="w-10 h-10 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Always Monitoring</h3>
            <p className="text-sm text-muted-foreground">
              Check your websites every 5 minutes for uptime and performance
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <Bell className="w-10 h-10 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Instant Alerts</h3>
            <p className="text-sm text-muted-foreground">Get email notifications the moment your site goes down</p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <BarChart3 className="w-10 h-10 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-sm text-muted-foreground">Track uptime history and performance metrics over time</p>
          </div>
        </div>
      </main>
    </div>
  )
}
