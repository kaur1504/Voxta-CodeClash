"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic,
  MicOff,
  X,
  MessageCircle,
  Bot,
  Volume2,
  VolumeX,
  Trash2,
  Settings,
  Sparkles,
  Zap,
  Brain,
} from "lucide-react"
import { useVoice } from "../contexts/VoiceContext"
import { useAI } from "../contexts/AIContext"

const VoiceInterface = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const historyRef = useRef(null)

  const {
    isListening,
    isSupported,
    isEnabled,
    setIsEnabled,
    transcript,
    interimTranscript,
    voiceLevel,
    language,
    setLanguage,
    toggleListening,
    getAvailableLanguages,
    confidence: voiceConfidence,
  } = useVoice()

  const { isProcessing, conversationHistory, confidence: aiConfidence, isActive, clearHistory } = useAI()

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [conversationHistory])

  // Enhanced Voice Visualizer
  const EnhancedVoiceVisualizer = () => (
    <div className="relative">
      <div className="flex items-center justify-center space-x-2 h-16">
        {[...Array(9)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 bg-gradient-to-t from-purple-400 via-blue-400 to-cyan-400 rounded-full"
            animate={{
              height: isListening ? `${Math.max(12, voiceLevel * 60 + Math.random() * 12)}px` : "12px",
              opacity: isListening ? 0.8 + voiceLevel * 0.2 : 0.4,
            }}
            transition={{
              duration: 0.1,
              ease: "easeOut",
              delay: i * 0.05,
            }}
          />
        ))}
      </div>

      {/* Confidence indicator */}
      <div className="mt-4 text-center">
        <div className="text-sm text-white/80 font-medium">
          Voice: {(voiceConfidence * 100).toFixed(0)}% | AI: {(aiConfidence * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  )

  // Settings Panel
  const SettingsPanel = () => (
    <div className="p-6 border-t border-white/10">
      <h3 className="font-bold text-white mb-4 flex items-center text-lg">
        <Settings className="h-5 w-5 mr-2" />
        Voice Settings
      </h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-purple-500"
          >
            {getAvailableLanguages().map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-gray-800">
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-white">Voice Recognition</span>
            <p className="text-xs text-white/70">Enable voice commands</p>
          </div>
          <motion.button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`w-14 h-8 rounded-full transition-colors ${isEnabled ? "bg-green-500" : "bg-gray-600"}`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="w-6 h-6 bg-white rounded-full shadow-lg"
              animate={{ x: isEnabled ? 24 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>
      </div>
    </div>
  )

  // Conversation History
  const ConversationHistory = () => (
    <div className="p-6 border-t border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center text-lg">
          <MessageCircle className="h-5 w-5 mr-2" />
          Conversation
        </h3>
        <button
          onClick={clearHistory}
          className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Clear history"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div ref={historyRef} className="max-h-80 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/20">
        {conversationHistory.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-3 opacity-50" />
            <p className="text-white/50 text-sm">No conversation yet</p>
          </div>
        ) : (
          conversationHistory.slice(-10).map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl text-sm ${
                message.type === "user"
                  ? "bg-blue-500/20 text-blue-100 border border-blue-500/30"
                  : "bg-green-500/20 text-green-100 border border-green-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center">
                  {message.type === "user" ? (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      You
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Assistant
                    </>
                  )}
                </span>
                <div className="flex items-center space-x-2">
                  {message.confidence && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {(message.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="text-xs opacity-70">{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
              <p className="leading-relaxed">{message.content}</p>
              {message.intent && <div className="mt-2 text-xs opacity-60">Intent: {message.intent}</div>}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )

  if (!isSupported) {
    return null
  }

  return (
    <>
      {/* Floating Voice Button */}
      <motion.div className="fixed bottom-8 right-8 z-50">
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative p-5 rounded-full shadow-2xl transition-all ${
            isListening
              ? "bg-gradient-to-r from-red-500 to-pink-500 shadow-red-500/50"
              : isActive
                ? "bg-gradient-to-r from-green-500 to-teal-500 shadow-green-500/50"
                : "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 shadow-purple-500/50"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? (
            <MessageCircle className="h-7 w-7 text-white" />
          ) : isListening ? (
            <MicOff className="h-7 w-7 text-white" />
          ) : (
            <Mic className="h-7 w-7 text-white" />
          )}

          {/* Status indicators */}
          <div className="absolute -top-2 -right-2 flex space-x-1">
            <div
              className={`w-4 h-4 rounded-full ${
                isProcessing
                  ? "bg-yellow-400 animate-pulse"
                  : isListening
                    ? "bg-red-400 animate-pulse"
                    : isActive
                      ? "bg-green-400"
                      : isEnabled
                        ? "bg-blue-400"
                        : "bg-gray-400"
              }`}
            />
          </div>
        </motion.button>
      </motion.div>

      {/* Expanded Interface */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 right-8 w-[420px] bg-black/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">AI Voice Assistant</h3>
                  <p className="text-sm text-white/70">
                    {isProcessing ? "Processing..." : isActive ? "Active" : "Ready"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="h-6 w-6 text-white/70" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Voice Visualizer */}
              <div className="text-center mb-6">
                <EnhancedVoiceVisualizer />
                <p className="text-sm text-white/70 mt-4">
                  {isListening ? "🎤 Listening..." : isProcessing ? "🧠 Processing..." : "Click to start"}
                </p>
              </div>

              {/* Current Transcript */}
              <AnimatePresence>
                {(transcript || interimTranscript) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/10 p-4 rounded-xl mb-6 border border-white/20"
                  >
                    <p className="text-sm text-white">
                      <span className="font-medium">{transcript}</span>
                      <span className="text-white/60 italic">{interimTranscript}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Commands */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() =>
                    document.dispatchEvent(
                      new CustomEvent("voiceCommand", {
                        detail: { command: "list auctions", confidence: 1.0 },
                      }),
                    )
                  }
                  className="bg-white/10 border border-white/20 text-white text-sm py-3 px-4 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center space-x-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>List Auctions</span>
                </button>
                <button
                  onClick={() =>
                    document.dispatchEvent(
                      new CustomEvent("voiceCommand", {
                        detail: { command: "current bid", confidence: 1.0 },
                      }),
                    )
                  }
                  className="bg-white/10 border border-white/20 text-white text-sm py-3 px-4 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center space-x-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>Current Bid</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 mb-6">
                <button
                  onClick={() => {
                    setShowHistory(false)
                    setShowSettings(false)
                  }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    !showHistory && !showSettings
                      ? "text-purple-400 border-b-2 border-purple-400"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Control
                </button>
                <button
                  onClick={() => {
                    setShowHistory(true)
                    setShowSettings(false)
                  }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    showHistory ? "text-purple-400 border-b-2 border-purple-400" : "text-white/70 hover:text-white"
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => {
                    setShowSettings(true)
                    setShowHistory(false)
                  }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    showSettings ? "text-purple-400 border-b-2 border-purple-400" : "text-white/70 hover:text-white"
                  }`}
                >
                  Settings
                </button>
              </div>

              {/* Instructions */}
              {!showHistory && !showSettings && (
                <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                  <h4 className="font-medium text-purple-300 mb-3">Voice Commands:</h4>
                  <ul className="text-sm text-purple-200 space-y-2">
                    <li>• "List auctions" - Show available items</li>
                    <li>• "Current bid" - Check highest bid</li>
                    <li>• "Bid 100 dollars" - Place a bid</li>
                    <li>• "Help" - Get assistance</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Tab Content */}
            {showHistory && <ConversationHistory />}
            {showSettings && <SettingsPanel />}

            {/* Controls */}
            <div className="p-6 border-t border-white/10 bg-black/40">
              <div className="flex items-center justify-between">
                <motion.button
                  onClick={toggleListening}
                  disabled={!isEnabled}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all ${
                    isListening
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                      : "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg"
                  } ${!isEnabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
                  whileHover={isEnabled ? { scale: 1.05 } : {}}
                  whileTap={isEnabled ? { scale: 0.95 } : {}}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-5 w-5" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5" />
                      <span>Listen</span>
                    </>
                  )}
                </motion.button>

                <div className="flex items-center space-x-3 text-sm text-white/70">
                  {isEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4" />
                      <span>Enabled</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4" />
                      <span>Disabled</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default VoiceInterface
