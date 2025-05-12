"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Trash2, Mic, Square, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadFile } from "@/lib/utils/storage"
import { useToast } from "@/components/ui/use-toast"

interface StepFieldProps {
  index: number
  step: {
    id: number
    step_number: number
    instruction: string
    image_url?: string
    audio_url?: string
  }
  onUpdate: (index: number, field: string, value: any) => void
  onRemove: (index: number) => void
}

export default function StepField({ index, step, onUpdate, onRemove }: StepFieldProps) {
  const { toast } = useToast()
  const [imageUploading, setImageUploading] = useState(false)
  const [audioUploading, setAudioUploading] = useState(false)

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element for playback
  useEffect(() => {
    if (step.audio_url) {
      audioRef.current = new Audio(step.audio_url)
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false)
      })
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener("ended", () => {
          setIsPlaying(false)
        })
      }
    }
  }, [step.audio_url])

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setImageUploading(true)
      toast({
        title: "Uploading image",
        description: "Please wait while we upload your image...",
      })

      // Upload to Supabase storage in recipes/images folder
      const imageUrl = await uploadFile(file, "recipes/images")

      if (imageUrl) {
        onUpdate(index, "image_url", imageUrl)
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully.",
        })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setImageUploading(false)
    }
  }

  // Handle audio file upload
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setAudioUploading(true)
      toast({
        title: "Uploading audio",
        description: "Please wait while we upload your audio file...",
      })

      // Upload to Supabase storage in recipes/audio folder
      const audioUrl = await uploadFile(file, "recipes/audio")

      if (audioUrl) {
        onUpdate(index, "audio_url", audioUrl)
        toast({
          title: "Audio uploaded",
          description: "Your audio file has been uploaded successfully.",
        })
      }
    } catch (error) {
      console.error("Error uploading audio:", error)
      toast({
        title: "Upload failed",
        description: `Failed to upload audio: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setAudioUploading(false)
    }
  }

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setAudioBlob(audioBlob)

        // Create a temporary URL for preview
        const audioUrl = URL.createObjectURL(audioBlob)
        if (audioRef.current) {
          audioRef.current.src = audioUrl
        } else {
          audioRef.current = new Audio(audioUrl)
          audioRef.current.addEventListener("ended", () => {
            setIsPlaying(false)
          })
        }

        // Upload the recorded audio
        try {
          setAudioUploading(true)
          toast({
            title: "Uploading recording",
            description: "Please wait while we upload your recording...",
          })

          // Convert Blob to File
          const file = new File([audioBlob], `recording-${Date.now()}.webm`, {
            type: "audio/webm",
          })

          const uploadedUrl = await uploadFile(file, "recipes/audio")
          if (uploadedUrl) {
            onUpdate(index, "audio_url", uploadedUrl)
            toast({
              title: "Recording uploaded",
              description: "Your recording has been uploaded successfully.",
            })
          }
        } catch (error) {
          console.error("Error uploading recorded audio:", error)
          toast({
            title: "Upload failed",
            description: `Failed to upload recording: ${error instanceof Error ? error.message : "Unknown error"}`,
            variant: "destructive",
          })
        } finally {
          setAudioUploading(false)
        }
      }

      // Start recording
      mediaRecorderRef.current.start()
      setIsRecording(true)

      // Start timer
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop all tracks in the stream
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Toggle audio playback
  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="p-4 border-2 border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Step #{step.step_number}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-red-600 hover:text-red-800 hover:bg-red-50"
        >
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">Remove step</span>
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor={`instruction-${index}`} className="text-sm font-medium mb-1 block">
            Instructions
          </Label>
          <Textarea
            id={`instruction-${index}`}
            value={step.instruction}
            onChange={(e) => onUpdate(index, "instruction", e.target.value)}
            placeholder="Enter step instructions"
            className="w-full min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Upload Section */}
          <div>
            <Label htmlFor={`image-${index}`} className="text-sm font-medium mb-1 block">
              Step Image (optional)
            </Label>

            {step.image_url ? (
              <div className="relative mt-2">
                <div className="relative h-40 w-full overflow-hidden rounded-md border border-gray-200">
                  <Image
                    src={step.image_url || "/placeholder.svg"}
                    alt={`Step ${step.step_number} image`}
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => onUpdate(index, "image_url", "")}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="mt-1">
                <Input
                  id={`image-file-${index}`}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="w-full"
                />
                {imageUploading && <p className="text-sm text-gray-500 mt-1">Uploading image...</p>}
              </div>
            )}
          </div>

          {/* Audio Section */}
          <div>
            <Label htmlFor={`audio-${index}`} className="text-sm font-medium mb-1 block">
              Audio Instructions (optional)
            </Label>

            {step.audio_url ? (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                  <Button type="button" variant="outline" size="sm" onClick={togglePlayback} className="h-8 w-8 p-0">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <div className="text-sm">Audio recording</div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onUpdate(index, "audio_url", "")}
                    className="ml-auto"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mt-1">
                {isRecording ? (
                  <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <div className="animate-pulse h-3 w-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-600 font-medium">Recording: {formatTime(recordingTime)}</span>
                    <Button type="button" variant="destructive" size="sm" onClick={stopRecording} className="ml-auto">
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={startRecording} className="flex-1">
                        <Mic className="h-4 w-4 mr-1" />
                        Record Audio
                      </Button>

                      <span className="text-sm text-gray-500 flex items-center">or</span>

                      <div className="flex-1">
                        <Input
                          id={`audio-file-${index}`}
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioUpload}
                          disabled={audioUploading}
                          className="w-full"
                        />
                      </div>
                    </div>
                    {audioUploading && <p className="text-sm text-gray-500">Uploading audio...</p>}
                    {audioBlob && !step.audio_url && (
                      <p className="text-sm text-amber-600">Recording complete. Uploading...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
