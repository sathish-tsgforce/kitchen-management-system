"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    const checkToken = async () => {
      // Get tokens from URL hash or search params
      const urlHash = window.location.hash
      const urlParams = new URLSearchParams(urlHash.substring(1))
      
      let accessToken = urlParams.get("access_token") || searchParams.get("access_token")
      let refreshToken = urlParams.get("refresh_token") || searchParams.get("refresh_token")
      
      console.log('URL Hash:', urlHash)
      console.log('Access Token:', accessToken)
      console.log('Refresh Token:', refreshToken)
      
      if (!accessToken || !refreshToken) {
        setIsValidToken(false)
        setIsCheckingToken(false)
        return
      }

      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        console.log('Session data:', data)
        console.log('Session error:', error)

        if (error || !data.session) {
          setIsValidToken(false)
          toast({
            title: "Invalid Reset Link",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          })
        } else {
          setIsValidToken(true)
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setIsValidToken(false)
        toast({
          title: "Error",
          description: "Failed to validate reset link.",
          variant: "destructive",
        })
      } finally {
        setIsCheckingToken(false)
      }
    }

    checkToken()
  }, [searchParams])

  async function onSubmit(values: ResetPasswordValues) {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Your password has been updated successfully.",
      })

      await supabase.auth.signOut()
      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Validating reset link...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter new password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Confirm new password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}