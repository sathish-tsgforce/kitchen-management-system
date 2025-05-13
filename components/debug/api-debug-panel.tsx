"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"

interface ApiDebugPanelProps {
  error: string | null
  debugInfo: any
  onRetry?: () => void
  title?: string
}

export function ApiDebugPanel({ error, debugInfo, onRetry, title = "API Error" }: ApiDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!error && !debugInfo) return null

  return (
    <Card className="mb-6 border-red-200 bg-red-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-red-700">
          <AlertCircle className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-red-600">
          {error || "An error occurred while communicating with the API"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="flex w-full justify-between">
              <span>Technical Details</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Alert variant="destructive" className="bg-white">
              <AlertTitle>Debug Information</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 max-h-[300px] overflow-auto rounded bg-slate-950 p-4 text-xs text-white">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button variant="outline" size="sm" onClick={onRetry} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
