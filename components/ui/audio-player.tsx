"use client"

import { useState, useRef } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface AudioPlayerProps {
  src: string
  className?: string
  textSize?: string
}

export default function AudioPlayer({ src, className = "", textSize = "normal" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)

  // Apply text size classes based on the current text size
  const getTextSizeClasses = () => {
    switch (textSize) {
      case "large":
        return "text-lg"
      case "x-large":
        return "text-xl"
      default:
        return "text-sm"
    }
  }

  const textClass = getTextSizeClasses()

  // Format time in MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00"

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Play/pause toggle
  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  // Change current time
  const handleTimeChange = (value: number[]) => {
    if (!audioRef.current) return

    const newTime = value[0]
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume
    } else {
      audioRef.current.volume = 0
    }

    setIsMuted(!isMuted)
  }

  // Change volume
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return

    const newVolume = value[0]
    audioRef.current.volume = newVolume
    setVolume(newVolume)

    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  return (
    <div className={`bg-gray-100 rounded-lg p-3 ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={() => {
          if (
            audioRef.current &&
            audioRef.current.duration &&
            !isNaN(audioRef.current.duration) &&
            isFinite(audioRef.current.duration)
          ) {
            setDuration(audioRef.current.duration)
            setIsLoaded(true)
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
          }
        }}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={togglePlayPause}
          className="h-10 w-10 rounded-full flex-shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Slider
              value={[currentTime]}
              max={isLoaded && duration > 0 ? duration : 100}
              step={0.1}
              onValueChange={handleTimeChange}
              className="flex-1"
              aria-label="Audio progress"
            />
          </div>

          <div className="flex justify-between">
            <span className={`${textClass} text-gray-600`}>{formatTime(currentTime)}</span>
            <span className={`${textClass} text-gray-600`}>{isLoaded ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}
