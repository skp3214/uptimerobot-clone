"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail } from "lucide-react"

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const callbackError = searchParams.get("error")
    if (callbackError) {
      setError(`Email confirmation failed: ${callbackError}. Please try signing up again.`)
    }
  }, [searchParams])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMessage("")
    setEmailSent(false)

    const supabase = getSupabaseClient()

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/auth/callback`
        console.log("[v0] Signup with email redirect to:", redirectUrl)

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        })
        if (error) throw error

        setEmailSent(true)
        setSuccessMessage(
          "Confirmation email sent! Check your inbox (or spam folder) for the confirmation link. The link expires in 24 hours.",
        )
        setEmail("")
        setPassword("")
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        console.log("[v0] Sign in successful")
        router.push("/dashboard")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      console.error("[v0] Auth error:", errorMessage)

      if (errorMessage.includes("invalid_grant")) {
        setError("Invalid email or password. Please check and try again.")
      } else if (errorMessage.includes("already registered")) {
        setError("This email is already registered. Please sign in instead.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
          <CardDescription>
            {isSignUp ? "Join UptimeRobot to monitor your websites" : "Access your monitoring dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-4 variant='destructive'">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!emailSent ? (
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <Mail className="h-12 w-12 mx-auto text-primary" />
              <div>
                <p className="font-medium">Check your email</p>
                <p className="text-sm text-muted-foreground mt-2">
                  We've sent a confirmation link to <strong>{email}</strong>
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  setEmailSent(false)
                  setEmail("")
                  setPassword("")
                }}
              >
                Send Again
              </Button>
            </div>
          )}

          <div className="mt-4 text-center text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError("")
                setSuccessMessage("")
                setEmailSent(false)
              }}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
