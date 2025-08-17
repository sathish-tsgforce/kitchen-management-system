"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/context/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Sign in with password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data?.session && data?.user) {
        // Get user role and location from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role_id, role:roles(name), location_id, location:locations(id, name)')
          .eq('id', data.user.id)
          .single()
          
        if (userError) {
          console.error("Error fetching user data:", userError)
        }
        
        // Extract user data and token
        const userInfo = {
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.name || data.user.email,
          role_id: userData?.role_id,
          role: userData?.role?.name,
          location_id: userData?.location_id,
          location: userData?.location
        }
        
        const token = data.session.access_token
        
        // Store in auth context and cookies
        signIn(userInfo, token)
      
        // Navigate to protected dashboard
        router.push("/")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setFormError(err.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setResetEmailSent(true)
    } catch (err: any) {
      console.error("Password reset error:", err)
      setFormError(err.message || "Error sending password reset email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {showForgotPassword ? "Reset Password" : "Sign in"}
          </CardTitle>
          <CardDescription>
            {showForgotPassword 
              ? "Enter your email to receive a password reset link"
              : "Enter your email and password to access your account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetEmailSent ? (
            <div className="text-center space-y-4">
              <Alert>
                <AlertDescription>
                  Password reset link has been sent to your email. Please check your inbox.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => {
                  setShowForgotPassword(false)
                  setResetEmailSent(false)
                  setEmail("")
                }} 
                variant="outline" 
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {!showForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading 
                  ? (showForgotPassword ? "Sending..." : "Signing in...") 
                  : (showForgotPassword ? "Send Reset Link" : "Sign in")
                }
              </Button>
              {showForgotPassword && (
                <Button 
                  type="button" 
                  onClick={() => setShowForgotPassword(false)} 
                  variant="outline" 
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              )}
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {!showForgotPassword && !resetEmailSent && (
            <button 
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Forgot Password?
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}