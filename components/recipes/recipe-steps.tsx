"use client"
import Image from "next/image"
import AudioPlayer from "@/components/ui/audio-player"

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

  return (
    <ol className="space-y-10">
      {steps.map((step) => (
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
              <div className="flex flex-col gap-4 mt-4">
                {step.image_url && (
                  <div className={`relative ${imageHeight} w-full overflow-hidden rounded-lg border-2 border-gray-200`}>
                    <Image
                      src={step.image_url || "/placeholder.svg"}
                      alt={`Visual aid for step ${step.step_number}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                {step.audio_url && <AudioPlayer src={step.audio_url} textSize={textSize} />}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
