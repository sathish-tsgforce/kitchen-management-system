"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import AudioPlayer from "@/components/ui/audio-player"
import { ensureValidUrl } from "@/lib/utils/storage"

interface Step {
  id: number
  step_number: number
  instruction: string
  image_url?: string
  audio_url?: string
}

interface RecipeStepsProps {
  steps: Step[]
  textSize?: string
}

export default function RecipeSteps({ steps, textSize = "normal" }: RecipeStepsProps) {
  const [processedSteps, setProcessedSteps] = useState<Step[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Process steps to ensure valid URLs
  useEffect(() => {
    const processAudioUrls = async () => {
      if (!steps || steps.length === 0) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      console.log("Processing steps:", steps)

      try {
        const updatedSteps = await Promise.all(
          steps.map(async (step) => {
            if (step.audio_url) {
              try {
                console.log(`Processing audio URL for step ${step.step_number}:`, step.audio_url)

                // Ensure the URL is valid
                const validUrl = await ensureValidUrl(step.audio_url)
                console.log(`Valid URL for step ${step.step_number}:`, validUrl)

                return {
                  ...step,
                  audio_url: validUrl,
                }
              } catch (error) {
                console.error(`Error processing audio URL for step ${step.step_number}:`, error)
                return step
              }
            }
            return step
          }),
        )

        console.log("Processed steps:", updatedSteps)
        setProcessedSteps(updatedSteps)
      } catch (error) {
        console.error("Error processing steps:", error)
      } finally {
        setIsLoading(false)
      }
    }

    processAudioUrls()
  }, [steps])

  // Apply text size classes based on the current text size
  const getTextSizeClasses = () => {
    switch (textSize) {
      case "large":
        return {
          stepNumber: "w-10 h-10 text-xl",
          instruction: "text-xl",
          audioText: "text-lg",
        }
      case "x-large":
        return {
          stepNumber: "w-12 h-12 text-2xl",
          instruction: "text-2xl",
          audioText: "text-xl",
        }
      default:
        return {
          stepNumber: "w-8 h-8 text-lg",
          instruction: "text-lg",
          audioText: "text-sm",
        }
    }
  }

  // Get image size based on text size
  const getImageHeight = () => {
    switch (textSize) {
      case "large":
        return "h-64"
      case "x-large":
        return "h-80"
      default:
        return "h-48"
    }
  }

  const textClasses = getTextSizeClasses()
  const imageHeight = getImageHeight()

  if (!steps || steps.length === 0) {
    return <p className="text-gray-500 italic">No steps available for this recipe.</p>
  }

  // Helper function to validate audio URL
  const isValidAudioUrl = (url?: string): boolean => {
    if (!url) return false

    // Check if URL is not empty and has a valid format
    return url.trim() !== "" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"))
  }

  const stepsToRender = processedSteps.length > 0 ? processedSteps : steps

  return (
    <ol className="space-y-10">
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700"></div>
          <span className="ml-2 text-sm text-green-700">Loading audio files...</span>
        </div>
      )}

      {stepsToRender.map((step) => (
        <li key={step.id} className="relative border-b border-gray-200 pb-8 last:border-0 last:pb-0">
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 ${textClasses.stepNumber} bg-green-700 text-white rounded-full flex items-center justify-center font-bold`}
            >
              {step.step_number}
            </div>
            <div className="flex-1 space-y-4">
              <p className={`${textClasses.instruction} text-gray-800`}>{step.instruction}</p>

              {/* Media section */}
              <div className="flex flex-col gap-4 mt-4 w-full">
                {step.image_url && (
                  <div className={`relative ${imageHeight} w-full overflow-hidden rounded-lg border-2 border-gray-200`}>
                    <Image
                      src={step.image_url || "/placeholder.svg"}
                      alt={`Visual aid for step ${step.step_number}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 80vw, 60vw"
                    />
                  </div>
                )}

                {isValidAudioUrl(step.audio_url) && (
                  <div className="w-full">
                    <p className={`${textClasses.audioText} text-gray-600 mb-1`}>Audio instructions available:</p>
                    <AudioPlayer src={step.audio_url!} textSize={textSize} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
