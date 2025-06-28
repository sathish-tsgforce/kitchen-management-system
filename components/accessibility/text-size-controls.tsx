"use client"

import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTextSize } from "@/lib/context/text-size-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function TextSizeControls() {
  const { increaseTextSize, decreaseTextSize, resetTextSize } = useTextSize()

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="default"
              onClick={decreaseTextSize}
              aria-label="Decrease text size"
              className="h-10 w-10 p-0 flex items-center justify-center"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Decrease text size</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="default"
              onClick={increaseTextSize}
              aria-label="Increase text size"
              className="h-10 w-10 p-0 flex items-center justify-center"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Increase text size</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="default"
              onClick={resetTextSize}
              aria-label="Reset text size"
              className="h-10 w-10 p-0 flex items-center justify-center"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset text size</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
