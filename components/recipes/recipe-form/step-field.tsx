"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Trash2, Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadFile } from "@/lib/utils/storage"
import AudioPlayer from "@/components/ui/audio-player"
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
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Format recording time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Start audio recording
  const startRecording = async () => {
    try {
      setUploadError(null)

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus", // More compatible format
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Create blob from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

        // Upload the recorded audio
        await uploadAudio(audioBlob)

        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      let seconds = 0
      timerRef.current = setInterval(() => {
        seconds++
        setRecordingTime(seconds)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      setUploadError("Could not access microphone. Please check your browser permissions.")
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check your browser permissions.",
        variant: "destructive",
      })
    }
  }

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setRecordingTime(0)
    }
  }

  // Upload audio file (either recorded or selected)
  const uploadAudio = async (audioBlob: Blob | File) => {
    try {
      setIsUploading(true)
      setUploadError(null)

      let file: File

      if (audioBlob instanceof Blob && !(audioBlob instanceof File)) {
        // Create a File object from the Blob
        file = new File([audioBlob], `step-${index + 1}-audio-${Date.now()}.webm`, {
          type: audioBlob.type,
          lastModified: Date.now(),
        })
      } else {
        file = audioBlob as File
      }

      toast({
        title: "Uploading audio",
        description: "Please wait while we upload your audio...",
      })

      // Upload the file using the server-side API route
      const audioUrl = await uploadFile(file, "recipes/audio")

      if (!audioUrl) {
        throw new Error("Failed to upload audio file")
      }

      // Update the step with the new audio URL
      onUpdate(index, "audio_url", audioUrl)
      console.log("Audio uploaded successfully:", audioUrl)

      toast({
        title: "Audio uploaded",
        description: "Your audio has been uploaded successfully.",
      })
    } catch (error) {
      console.error("Error uploading audio:", error)
      setUploadError("Failed to upload audio. Please try again.")
      toast({
        title: "Upload failed",
        description: `Failed to upload audio: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    // Validate file type
    const validAudioTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/webm", "audio/ogg"]
    if (!validAudioTypes.includes(file.type)) {
      setUploadError("Invalid file type. Please upload an MP3, WAV, or WebM audio file.")
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, or WebM audio file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setUploadError("File is too large. Maximum size is 10MB.")
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      })
      return
    }

    // Upload the file
    await uploadAudio(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Remove audio
  const removeAudio = async () => {
    try {
      setUploadError(null)
      onUpdate(index, "audio_url", null)
      toast({
        title: "Audio removed",
        description: "Audio has been removed successfully.",
      })
    } catch (error) {
      console.error("Error removing audio:", error)
      setUploadError("Failed to remove audio. Please try again.")
      toast({
        title: "Remove failed",
        description: "Failed to remove audio. Please try again.",
        variant: "destructive",
      })
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
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        onUpdate(index, "image_url", reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  disabled={isUploading}
                  className="w-full"
                />
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
                <AudioPlayer src={step.audio_url} />
                <Button type="button" variant="destructive" size="sm" onClick={removeAudio} className="mt-2">
                  Remove Audio
                </Button>
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
                          accept="audio/mp3,audio/wav,audio/webm,audio/ogg,audio/aac,audio/m4a"
                          onChange={handleFileChange}
                          disabled={isUploading}
                          className="w-full"
                          ref={fileInputRef}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Supported formats: MP3, WAV, WebM, OGG, AAC, M4A</p>
                    {isUploading && <p className="text-sm text-gray-500">Uploading audio...</p>}
                    {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
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
