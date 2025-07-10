"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import type { User, UserRole, UserLocation } from "@/lib/types/user"

// Dynamic form schema for creating users
const createUserFormSchema = (roles: UserRole[]) => {
  return z.object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: z.string().min(6, {
      message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string().min(6, {
      message: "Please confirm your password.",
    }),
    role_id: z.coerce.number({
      required_error: "Please select a role.",
      invalid_type_error: "Role must be a number",
    }),
    location_id: z.coerce.number().nullable().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }).refine((data) => {
    const selectedRole = roles.find(role => role.id === data.role_id)
    if (selectedRole?.name === "Admin") {
      return true // Admin doesn't need location
    }
    return data.location_id !== null // Non-admin roles require location
  }, {
    message: "Location is required for non-admin roles",
    path: ["location_id"],
  })
}

// Form schema for editing users
const editUserFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  role_id: z.coerce.number({
    required_error: "Please select a role.",
    invalid_type_error: "Role must be a number",
  }),
  location_id: z.coerce.number().nullable().optional(),
})

// Password update schema
const passwordUpdateSchema = z.object({
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Please confirm your password.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UserFormValues) => void
  user?: User
  roles: UserRole[]
  locations: UserLocation[]
  isLoading?: boolean
}

export function UserForm({ open, onOpenChange, onSubmit, user, roles, locations, isLoading = false }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(!user)
  const [hasChanges, setHasChanges] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const isEditing = !!user

  // Default form values
  const defaultValues: Partial<UserFormValues> = {
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
    role_id: user?.role_id || undefined,
    location_id: user?.location_id || null,
  }

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditing ? editUserFormSchema : createUserFormSchema(roles)),
    defaultValues,
  })

  const passwordForm = useForm<z.infer<typeof passwordUpdateSchema>>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Reset form when user changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      passwordForm.reset({ password: "", confirmPassword: "" })
      setShowPassword(!isEditing)
      setHasChanges(false)
    }
  }, [form, passwordForm, open, user, isEditing])



  // Watch for form changes
  const watchedValues = form.watch()
  useEffect(() => {
    if (isEditing && open) {
      const currentName = watchedValues.name || ""
      const currentRoleId = watchedValues.role_id
      const currentLocationId = watchedValues.location_id
      
      const nameChanged = currentName !== (user?.name || "")
      const roleChanged = currentRoleId !== user?.role_id
      const locationChanged = currentLocationId !== user?.location_id
      
      setHasChanges(nameChanged || roleChanged || locationChanged)
    }
  }, [watchedValues, user, isEditing, open])

  // Get selected role name for admin check
  const selectedRole = roles.find(role => role.id === watchedValues.role_id)
  const isAdminRole = selectedRole?.name === "Admin"

  // Auto-set location to null for Admin role
  useEffect(() => {
    if (isAdminRole && watchedValues.location_id !== null) {
      form.setValue("location_id", null)
    }
  }, [isAdminRole, form, watchedValues.location_id])

  async function handlePasswordUpdate(values: z.infer<typeof passwordUpdateSchema>) {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID not found",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const response = await fetch(`/api/users/${user.id}/update-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password")
      }

      toast({
        title: "Success",
        description: "Password updated successfully",
      })
      
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

  function handleSubmit(values: UserFormValues) {
    console.log('Form submitted with values:', values)
    
    // Manual validation for password when editing and password field is hidden
    if (isEditing && !showPassword) {
      // Skip password validation entirely when password field is not shown
      const { email, password, ...rest } = values
      console.log('Sending update data (no password):', rest)
      onSubmit(rest)
      return
    }
    
    // If editing, exclude email and empty password from the values
    if (isEditing) {
      const { email, password, ...rest } = values
      // Only include password if it's provided and not empty
      const updateData = password && password.trim() ? { ...rest, password } : rest
      console.log('Sending update data:', updateData)
      onSubmit(updateData)
    } else {
      onSubmit(values)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the user's information. Leave the password field empty to keep the current password."
              : "Fill in the details to create a new user."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => {
            e.preventDefault()
            // If editing and password field is hidden, bypass form validation for password
            if (isEditing && !showPassword) {
              const values = form.getValues()
              handleSubmit(values)
            } else {
              form.handleSubmit(handleSubmit, (errors) => {
                console.log('Form validation errors:', errors)
              })(e)
            }
          }} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter email address" 
                      type="email" 
                      {...field} 
                      disabled={isEditing}
                      className={isEditing ? "bg-gray-100 cursor-not-allowed" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter password"
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
                          placeholder="Confirm password"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {isEditing && !showPassword && (
              <Button type="button" variant="outline" onClick={() => setShowPassword(true)}>
                Change Password
              </Button>
            )}
            {isEditing && showPassword && (
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
                    control={passwordForm.control}
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
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                    disabled={roles.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          Loading roles...
                        </SelectItem>
                      ) : (
                        roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location {isAdminRole ? "(Not applicable)" : "(Required)"}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                    value={field.value?.toString() || "none"}
                    disabled={isAdminRole}
                  >
                    <FormControl>
                      <SelectTrigger className={isAdminRole ? "bg-gray-100 cursor-not-allowed" : ""}>
                        <SelectValue placeholder={isAdminRole ? "Admin users cannot have location" : "Select a location"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || (isEditing && !hasChanges && !showPassword)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update User"
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
