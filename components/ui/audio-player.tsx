"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface AudioPlayerProps {
  src: string
  className?: string
  textSize?: string
}

// Helper functions for duration caching
const DURATION_CACHE_PREFIX = "audio_duration_"
const DURATION_CACHE_VERSION = "v1" // Increment this when changing cache structure

// Save duration to localStorage
const saveDurationToCache = (src: string, duration: number): void => {
  if (!src || isNaN(duration) || !isFinite(duration) || duration <= 0) return

  try {
    // Create a hash of the URL to use as a key
    const key = `${DURATION_CACHE_PREFIX}${DURATION_CACHE_VERSION}_${btoa(src).replace(/[^a-zA-Z0-9]/g, "")}`

    // Save the duration and timestamp
    const cacheData = {
      duration,
      timestamp: Date.now(),
      src, // Store the original src for verification
    }

    localStorage.setItem(key, JSON.stringify(cacheData))
  } catch (error) {
    // Silent error - not critical
  }
}

// Get duration from localStorage
const getDurationFromCache = (src: string): number | null => {
  try {
    // Create a hash of the URL to use as a key
    const key = `${DURATION_CACHE_PREFIX}${DURATION_CACHE_VERSION}_${btoa(src).replace(/[^a-zA-Z0-9]/g, "")}`

    const cachedData = localStorage.getItem(key)
    if (!cachedData) return null

    const data = JSON.parse(cachedData)

    // Verify the src matches and the cache isn't too old (7 days)
    const isValid = data.src === src && data.timestamp && Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000

    if (!isValid) {
      localStorage.removeItem(key)
      return null
    }

    return data.duration
  } catch (error) {
    // Silent error - not critical
    return null
  }
}

export default function AudioPlayer({ src, className, textSize = "normal" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [usingDirectUrl, setUsingDirectUrl] = useState(false)
  const [durationDetected, setDurationDetected] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wasPlayingRef = useRef(false) // Track if audio was playing before duration update

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

  // Format time in MM:SS format with proper handling for invalid values
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
      return "--:--"
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Clean up URL if needed
  const cleanUrl = (url: string): string => {
    // Remove any query parameters that might cause issues
    return url.split("?")[0]
  }

  // Try to get cached duration on initial render
  useEffect(() => {
    const cachedDuration = getDurationFromCache(src)
    if (cachedDuration !== null) {
      setDuration(cachedDuration)
      setDurationDetected(true)
    }
  }, [src])

  // Create a blob URL from the audio source
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError(null)
    setUsingDirectUrl(false)

    // Only reset duration detection if we don't have a cached duration
    const cachedDuration = getDurationFromCache(src)
    if (cachedDuration === null) {
      setDurationDetected(false)
    } else {
      setDuration(cachedDuration)
      setDurationDetected(true)
    }

    // Clear previous blob URL
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl)
      setBlobUrl(null)
    }

    // Try direct URL approach first
    const tryDirectUrl = () => {
      setUsingDirectUrl(true)

      // Create a new audio element to test the URL
      const testAudio = new Audio(src)

      testAudio.addEventListener("loadedmetadata", () => {
        if (!isMounted) return
        setIsLoading(false)
        setError(null)
      })

      testAudio.addEventListener("error", () => {
        if (!isMounted) return
        // Don't set error here, just silently fail and let the component handle it
        setIsLoading(false)
      })

      // Load the audio
      testAudio.load()
    }

    // Fetch the audio file and create a blob URL
    const fetchAudio = async () => {
      try {
        // Clean the URL
        const cleanedUrl = cleanUrl(src)

        // Add cache-busting parameter to avoid caching issues
        const fetchUrl = `${cleanedUrl}${cleanedUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`

        const response = await fetch(fetchUrl, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        if (!response.ok) {
          // Don't log the error, just throw to trigger the fallback
          throw new Error(`Failed to fetch audio: ${response.status}`)
        }

        const contentType = response.headers.get("content-type")

        if (!contentType || !contentType.includes("audio/")) {
          // Just a warning, not a critical error
        }

        const blob = await response.blob()

        if (!isMounted) return

        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
        setError(null)
      } catch (err) {
        // Don't log the error or set error state, just fall back to direct URL
        if (!isMounted) return
        tryDirectUrl()
      }
    }

    fetchAudio()

    return () => {
      isMounted = false
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [src])

  // Set up audio element and event listeners
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        // Only update duration if it's valid and different from current
        if (duration !== audio.duration) {
          setDuration(audio.duration)
          setDurationDetected(true)
          // Cache the duration
          saveDurationToCache(src, audio.duration)
        }
      }

      setIsLoading(false)

      // Resume playback if it was playing before
      if (wasPlayingRef.current) {
        audio.play().catch(() => {
          // Silent error - not critical
        })
      }
    }

    const handleDurationChange = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        // Only update duration if it's valid and different from current
        if (duration !== audio.duration) {
          setDuration(audio.duration)
          setDurationDetected(true)
          // Cache the duration
          saveDurationToCache(src, audio.duration)
        }
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)

      // For recorded audio, sometimes duration is only available after playback starts
      if (!durationDetected && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        // Only update duration if it's valid and different from current
        if (duration !== audio.duration) {
          setDuration(audio.duration)
          setDurationDetected(true)
          // Cache the duration
          saveDurationToCache(src, audio.duration)
        }
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
      wasPlayingRef.current = true
    }

    const handlePause = () => {
      setIsPlaying(false)
      // Only update wasPlayingRef if this wasn't an automatic pause for duration detection
      if (durationDetected) {
        wasPlayingRef.current = false
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      wasPlayingRef.current = false
      setCurrentTime(0)
      audio.currentTime = 0
    }

    const handleError = () => {
      // Don't log detailed error info, just set a generic error message
      setError("Could not play audio. Please try again later.")
      setIsLoading(false)
      wasPlayingRef.current = false

      // If we're not already using direct URL, try it as a fallback
      if (!usingDirectUrl && blobUrl) {
        setUsingDirectUrl(true)
        setBlobUrl(null)

        // Force a re-render with the direct URL
        audio.src = src
        audio.load()
      }
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    // Try to load the audio
    audio.load()

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [blobUrl, src, usingDirectUrl, durationDetected, duration])

  // Handle play/pause
  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      wasPlayingRef.current = false
    } else {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silent error - not critical
          wasPlayingRef.current = false
        })
      }
      wasPlayingRef.current = true
    }
  }

  // Handle seeking
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = value[0]
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  // Handle mute toggle
  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume || 1
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  // Handle reset
  const handleReset = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = 0
    setCurrentTime(0)
    if (!isPlaying) {
      togglePlayPause()
    }
  }

  // Handle retry
  const handleRetry = () => {
    setError(null)
    setIsLoading(true)

    // Only reset duration detection if we don't have a cached duration
    if (!getDurationFromCache(src)) {
      setDurationDetected(false)
    }

    // Clear blob URL if it exists
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl)
      setBlobUrl(null)
    }

    // Toggle between direct URL and blob approach
    setUsingDirectUrl(!usingDirectUrl)

    // Force reload the audio element
    if (audioRef.current) {
      audioRef.current.load()
    }
  }

  return (
    <div className={cn("rounded-md border border-gray-200 p-4", className)}>
      {/* Hidden audio element */}
      <audio ref={audioRef} src={usingDirectUrl ? src : blobUrl || src} preload="metadata" />

      {isLoading ? (
        <div className="flex justify-center items-center h-16">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className={`ml-2 ${textClass}`}>Loading audio...</span>
        </div>
      ) : error ? (
        <div className={`text-red-500 ${textClass} p-2 bg-red-50 rounded-md`}>
          {error}
          <Button variant="link" size="sm" className="ml-2 text-red-600" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={togglePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={durationDetected && duration > 0 ? duration : 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  aria-label="Seek"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <div className="w-20 hidden sm:block">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  aria-label="Volume"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleReset}
                aria-label="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Time display */}
            <div className="flex justify-between items-center px-2">
              <span className={`${textClass} text-gray-600`}>{formatTime(currentTime)}</span>
              <span className={`${textClass} text-gray-600`}>{durationDetected ? formatTime(duration) : "--:--"}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
