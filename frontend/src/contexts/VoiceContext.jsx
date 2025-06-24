"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import toast from "react-hot-toast"

const VoiceContext = createContext()

export const useVoice = () => {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider")
  }
  return context
}

export const VoiceProvider = ({ children }) => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [voiceLevel, setVoiceLevel] = useState(0)
  const [isEnabled, setIsEnabled] = useState(true)
  const [language, setLanguage] = useState("en-US")
  const [autoListen, setAutoListen] = useState(false)
  const [confidence, setConfidence] = useState(0)

  const recognitionRef = useRef(null)
  const synthRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const microphoneRef = useRef(null)
  const animationRef = useRef(null)

  // Enhanced speech recognition initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const SpeechSynthesis = window.speechSynthesis

    if (SpeechRecognition && SpeechSynthesis) {
      setIsSupported(true)

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language
      recognition.maxAlternatives = 5

      recognition.onstart = () => {
        setIsListening(true)
        toast.success("🎤 Voice recognition started", { duration: 2000 })
      }

      recognition.onend = () => {
        setIsListening(false)
        if (autoListen && isEnabled) {
          setTimeout(() => startListening(), 1000)
        }
      }

      recognition.onresult = (event) => {
        let finalTranscript = ""
        let interimTranscript = ""
        let bestConfidence = 0

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript
          const confidence = result[0].confidence || 0.8

          if (result.isFinal) {
            finalTranscript += transcript
            bestConfidence = Math.max(bestConfidence, confidence)
          } else {
            interimTranscript += transcript
          }
        }

        setInterimTranscript(interimTranscript)

        if (finalTranscript) {
          setTranscript(finalTranscript)
          setConfidence(bestConfidence)

          // Enhanced command processing
          const cleanedCommand = finalTranscript.trim().toLowerCase()
          if (cleanedCommand.length > 0) {
            const alternatives = Array.from(event.results[event.results.length - 1]).map((alt) => ({
              transcript: alt.transcript,
              confidence: alt.confidence,
            }))
            const voiceCommandEvent = new CustomEvent("voiceCommand", {
              detail: {
                command: finalTranscript,
                confidence: bestConfidence,
                alternatives: alternatives,
              },
            })
            document.dispatchEvent(voiceCommandEvent)
          }
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)

        const errorMessages = {
          "not-allowed": "Microphone access denied. Please enable microphone permissions.",
          "no-speech": "No speech detected. Please try again.",
          "audio-capture": "No microphone found. Please check your audio settings.",
          network: "Network error. Please check your internet connection.",
          aborted: "Speech recognition was aborted.",
          "bad-grammar": "Grammar error in speech recognition.",
        }

        const message = errorMessages[event.error] || `Voice recognition error: ${event.error}`
        toast.error(message)
      }

      recognitionRef.current = recognition
      synthRef.current = SpeechSynthesis

      // Initialize audio context with user gesture
      const initAudioContext = () => {
        if (!audioContextRef.current) {
          initializeAudioContext()
        }
      }

      // Add click listener to initialize audio context
      document.addEventListener('click', initAudioContext, { once: true })
      document.addEventListener('touchstart', initAudioContext, { once: true })

    } else {
      setIsSupported(false)
      toast.error("Speech recognition not supported in this browser")
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [language, autoListen, isEnabled])

  // Enhanced audio context for better voice visualization
  const initializeAudioContext = async () => {
    try {
      if (audioContextRef.current) return

      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      analyser.minDecibels = -90
      analyser.maxDecibels = -10

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      })

      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)
      microphoneRef.current = microphone

      monitorVoiceLevel()
    } catch (error) {
      console.error("Audio context initialization failed:", error)
      // Don't show error toast for audio context - it's optional
    }
  }

  // Enhanced voice level monitoring
  const monitorVoiceLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const updateLevel = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)

      // Calculate RMS (Root Mean Square) for better accuracy
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      const rms = Math.sqrt(sum / dataArray.length)
      const normalizedLevel = Math.min(rms / 128, 1)

      setVoiceLevel(normalizedLevel)

      if (isListening) {
        animationRef.current = requestAnimationFrame(updateLevel)
      }
    }

    updateLevel()
  }

  // Enhanced text-to-speech
  const speak = useCallback(
    (text, options = {}) => {
      if (!synthRef.current || !isEnabled) return

      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = options.rate || 0.9
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume || 0.8
      utterance.lang = language

      // Enhanced voice selection
      const voices = synthRef.current.getVoices()
      const preferredVoice = voices.find(
        (voice) =>
          voice.lang.startsWith(language.split("-")[0]) &&
          (voice.name.includes("Google") || voice.name.includes("Microsoft") || voice.name.includes("Apple")),
      )

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => {
        toast("🔊 Speaking...", { duration: 1000 })
      }

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error)
        toast.error("Speech synthesis error")
      }

      synthRef.current.speak(utterance)
    },
    [language, isEnabled],
  )

  // Enhanced listening controls
  const startListening = useCallback(() => {
    if (!isSupported || !isEnabled || isListening) return

    try {
      recognitionRef.current.start()
      monitorVoiceLevel()
    } catch (error) {
      console.error("Failed to start listening:", error)
      toast.error("Failed to start voice recognition")
    }
  }, [isSupported, isEnabled, isListening])

  const stopListening = useCallback(() => {
    if (!isListening) return

    try {
      recognitionRef.current.stop()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    } catch (error) {
      console.error("Failed to stop listening:", error)
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Enhanced language options
  const getAvailableLanguages = useCallback(() => {
    return [
      { code: "en-US", name: "English (US)" },
      { code: "en-GB", name: "English (UK)" },
      { code: "en-AU", name: "English (Australia)" },
      { code: "es-ES", name: "Spanish (Spain)" },
      { code: "es-MX", name: "Spanish (Mexico)" },
      { code: "fr-FR", name: "French (France)" },
      { code: "fr-CA", name: "French (Canada)" },
      { code: "de-DE", name: "German" },
      { code: "it-IT", name: "Italian" },
      { code: "pt-BR", name: "Portuguese (Brazil)" },
      { code: "pt-PT", name: "Portuguese (Portugal)" },
      { code: "ru-RU", name: "Russian" },
      { code: "ja-JP", name: "Japanese" },
      { code: "ko-KR", name: "Korean" },
      { code: "zh-CN", name: "Chinese (Simplified)" },
      { code: "zh-TW", name: "Chinese (Traditional)" },
      { code: "ar-SA", name: "Arabic" },
      { code: "hi-IN", name: "Hindi" },
    ]
  }, [])

  const value = {
    isListening,
    isSupported,
    isEnabled,
    setIsEnabled,
    transcript,
    interimTranscript,
    voiceLevel,
    language,
    setLanguage,
    autoListen,
    setAutoListen,
    confidence,
    startListening,
    stopListening,
    toggleListening,
    speak,
    getAvailableLanguages,
  }

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
}
