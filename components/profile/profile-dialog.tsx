"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/context/auth-context"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
})

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "" },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  useEffect(() => {
    if (open && user) {
      profileForm.reset({ name: user.name || "" })
      passwordForm.reset({ password: "", confirmPassword: "" })
      setShowPassword(false)
    }
  }, [open, user, profileForm, passwordForm])

  async function handleProfileUpdate(values: z.infer<typeof profileSchema>) {
    if (!user?.id) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name }),
      })

      if (!response.ok) throw new Error("Failed to update profile")

      toast({ title: "Success", description: "Profile updated successfully" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handlePasswordUpdate(values: z.infer<typeof passwordSchema>) {
    if (!user?.id) return

    setIsUpdatingPassword(true)
    try {
      const response = await fetch(`/api/users/${user.id}/update-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.password }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update password")

      toast({ title: "Success", description: "Password updated successfully" })
      passwordForm.reset()
      setShowPassword(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update password: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
            <FormField
              control={profileForm.control}
              name="email"
              render={() => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input value={user.email} disabled className="bg-gray-100 cursor-not-allowed" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!showPassword && (
              <Button type="button" variant="outline" onClick={() => setShowPassword(true)}>
                Change Password
              </Button>
            )}
            {showPassword && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Change Password</h4>
                <Form {...passwordForm}>
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter new password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input placeholder="Confirm new password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={passwordForm.handleSubmit(handlePasswordUpdate)}
                      disabled={isUpdatingPassword}
                      className="flex-1"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        passwordForm.reset()
                        setShowPassword(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </div>
            )}
            <FormField
              control={profileForm.control}
              name="role"
              render={() => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input value={user.role || "N/A"} disabled className="bg-gray-100 cursor-not-allowed" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="location"
              render={() => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      value={user.location?.name || "Not assigned"} 
                      disabled 
                      className="bg-gray-100 cursor-not-allowed" 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="submit" disabled={isUpdating || showPassword}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}