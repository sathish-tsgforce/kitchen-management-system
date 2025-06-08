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
import type { User, UserRole, UserLocation } from "@/lib/types/user"

// Form schema
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z
    .string()
    .min(6, {
      message: "Password must be at least 6 characters.",
    })
    .optional(),
  role_id: z.coerce.number({
    required_error: "Please select a role.",
    invalid_type_error: "Role must be a number",
  }),
  location_id: z.coerce.number().nullable().optional(),
})

type UserFormValues = z.infer<typeof userFormSchema>

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
  const isEditing = !!user

  // Default form values
  const defaultValues: Partial<UserFormValues> = {
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role_id: user?.role_id || undefined,
    location_id: user?.location_id || null,
  }

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditing ? userFormSchema.partial({ password: true }) : userFormSchema),
    defaultValues,
  })

  // Reset form when user changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      setShowPassword(!isEditing)
    }
  }, [form, open, user, isEditing])

  function handleSubmit(values: UserFormValues) {
    // If editing and password is empty, remove it from the values
    if (isEditing && !values.password) {
      const { password, ...rest } = values
      onSubmit(rest)
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email address" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(showPassword || !isEditing) && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditing ? "New Password" : "Password"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isEditing ? "Enter new password (optional)" : "Enter password"}
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {isEditing && !showPassword && (
              <Button type="button" variant="outline" onClick={() => setShowPassword(true)}>
                Change Password
              </Button>
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
                  <FormLabel>Location (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
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
              <Button type="submit" disabled={isLoading}>
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
