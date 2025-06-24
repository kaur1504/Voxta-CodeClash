"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic,
  MicOff,
  VolumeX,
  Settings,
  Brain,
  Activity,
  MessageCircle,
  Zap,
  Sparkles,
  Command,
  Target,
  Award,
} from "lucide-react"
import { useVoice } from "../contexts/VoiceContext"
import { useAI } from "../contexts/AIContext"
import { useAuction } from "../contexts/AuctionContext"

const VoiceControl = () => {
  const [activeTab, setActiveTab] = useState("control")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [voiceWaveform, setVoiceWaveform] = useState([])
  const canvasRef = useRef(null)

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
    autoListen,
    setAutoListen,
    toggleListening,
    speak,
    getAvailableLanguages,
    confidence: voiceConfidence,
  } = useVoice()

  const {
    isProcessing,
    conversationHistory,
    confidence: aiConfidence,
    lastCommand,
    clearHistory,
    processVoiceCommand,
  } = useAI()

  const { auctions, stats } = useAuction()

  // Advanced voice visualizer with waveform
  useEffect(() => {
    if (canvasRef.current && isListening) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      const width = canvas.width
      const height = canvas.height

      const drawWaveform = () => {
        ctx.clearRect(0, 0, width, height)

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, "#3B82F6")
        gradient.addColorStop(0.5, "#8B5CF6")
        gradient.addColorStop(1, "#06B6D4")

        ctx.strokeStyle = gradient
        ctx.lineWidth = 3
        ctx.lineCap = "round"

        ctx.beginPath()

        const amplitude = voiceLevel * height * 0.4
        const frequency = 0.02
        const time = Date.now() * 0.005

        for (let x = 0; x < width; x++) {
          const y =
            height / 2 +
            Math.sin(x * frequency + time) * amplitude +
            Math.sin(x * frequency * 2 + time * 1.5) * amplitude * 0.5

          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()

        if (isListening) {
          requestAnimationFrame(drawWaveform)
        }
      }

      drawWaveform()
    }
  }, [isListening, voiceLevel])

  // Enhanced voice visualizer
  const AdvancedVoiceVisualizer = () => (
    <div className="relative">
      <canvas ref={canvasRef} width={400} height={100} className="w-full h-24 rounded-lg" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            animate={{
              x: [0, 400],
              y: [Math.random() * 100, Math.random() * 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  )

  // AI Status with enhanced metrics
  const EnhancedAIStatus = () => (
    <motion.div className="glass-card p-6" whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg flex items-center">
          <Brain className="h-6 w-6 mr-2 text-purple-400" />
          AI Neural Engine
        </h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isProcessing
                ? "bg-yellow-500 animate-pulse"
                : aiConfidence > 0.8
                  ? "bg-green-500"
                  : aiConfidence > 0.6
                    ? "bg-yellow-500"
                    : "bg-red-500"
            }`}
          />
          <span className="text-xs text-white/70">{isProcessing ? "Processing" : "Ready"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">{(aiConfidence * 100).toFixed(1)}%</div>
          <div className="text-xs text-white/70">AI Confidence</div>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-400">{(voiceConfidence * 100).toFixed(1)}%</div>
          <div className="text-xs text-white/70">Voice Accuracy</div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/70">Commands Processed:</span>
          <span className="text-white font-medium">{conversationHistory.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Success Rate:</span>
          <span className="text-green-400 font-medium">98.7%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Response Time:</span>
          <span className="text-blue-400 font-medium">0.3s</span>
        </div>
      </div>

      {lastCommand && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <div className="text-xs text-white/70 mb-1">Last Command:</div>
          <div className="text-white text-sm">{lastCommand}</div>
        </div>
      )}
    </motion.div>
  )

  // Enhanced quick commands with categories
  const SmartCommands = () => {
    const commandCategories = [
      {
        title: "Auction Control",
        icon: <Target className="h-4 w-4" />,
        commands: [
          { text: "Show me all active auctions", action: "list" },
          { text: "What's the highest bid right now?", action: "status" },
          { text: "Find auctions ending soon", action: "urgent" },
          { text: "Show auction statistics", action: "stats" },
        ],
      },
      {
        title: "Bidding Actions",
        icon: <Zap className="h-4 w-4" />,
        commands: [
          { text: "Place a bid of 500 dollars", action: "bid" },
          { text: "Increase my last bid by 50", action: "increase" },
          { text: "Set auto-bid limit to 1000", action: "auto" },
          { text: "Cancel my current bids", action: "cancel" },
        ],
      },
      {
        title: "Smart Insights",
        icon: <Brain className="h-4 w-4" />,
        commands: [
          { text: "Analyze market trends", action: "analyze" },
          { text: "Recommend auctions for me", action: "recommend" },
          { text: "Show my bidding history", action: "history" },
          { text: "Calculate my win probability", action: "probability" },
        ],
      },
    ]

    return (
      <div className="space-y-6">
        {commandCategories.map((category, categoryIndex) => (
          <motion.div
            key={categoryIndex}
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
          >
            <h3 className="text-white font-bold text-lg mb-4 flex items-center">
              <div className="text-purple-400 mr-2">{category.icon}</div>
              {category.title}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {category.commands.map((command, index) => (
                <motion.button
                  key={index}
                  onClick={() => processVoiceCommand(command.text, 1.0)}
                  className="glass-button p-4 text-left hover:bg-white/20 transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium">{command.text}</span>
                    <Command className="h-4 w-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  // Real-time conversation with enhanced UI
  const ConversationHistory = () => (
    <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg flex items-center">
          <MessageCircle className="h-6 w-6 mr-2 text-blue-400" />
          Live Conversation
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearHistory}
            className="text-white/70 hover:text-white text-sm transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
          >
            Clear All
          </button>
          <div className="text-xs text-white/70">{conversationHistory.length} messages</div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/20">
        <AnimatePresence>
          {conversationHistory.length === 0 ? (
            <motion.div className="text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-3 opacity-50" />
              <p className="text-white/50">Start a conversation with your AI assistant</p>
            </motion.div>
          ) : (
            conversationHistory.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: message.type === "user" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`p-4 rounded-xl ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 ml-8"
                    : "bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 mr-8"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {message.type === "user" ? (
                      <Mic className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Brain className="h-4 w-4 text-green-400" />
                    )}
                    <span className="font-medium text-white">{message.type === "user" ? "You" : "AI Assistant"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {message.confidence && (
                      <div className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded-full">
                        {(message.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                    <span className="text-xs text-white/70">{new Date(message.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <p className="text-white leading-relaxed">{message.content}</p>
                {message.intent && <div className="mt-2 text-xs text-white/50">Intent: {message.intent}</div>}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )

  // Advanced settings with more options
  const AdvancedSettings = () => (
    <div className="space-y-6">
      <motion.div className="glass-card p-6" whileHover={{ scale: 1.01 }}>
        <h3 className="text-white font-bold text-lg mb-4 flex items-center">
          <Settings className="h-6 w-6 mr-2 text-purple-400" />
          Voice Configuration
        </h3>

        <div className="space-y-6">
          {/* Master Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <span className="text-white font-medium">Voice Recognition</span>
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

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <span className="text-white font-medium">Auto Listen</span>
                <p className="text-xs text-white/70">Continuous listening</p>
              </div>
              <motion.button
                onClick={() => setAutoListen(!autoListen)}
                className={`w-14 h-8 rounded-full transition-colors ${autoListen ? "bg-blue-500" : "bg-gray-600"}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-6 h-6 bg-white rounded-full shadow-lg"
                  animate={{ x: autoListen ? 24 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          </div>

          {/* Language and Voice Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {getAvailableLanguages().map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-gray-800">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">AI Personality</label>
              <select className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="professional" className="bg-gray-800">
                  Professional Assistant
                </option>
                <option value="friendly" className="bg-gray-800">
                  Friendly Guide
                </option>
                <option value="expert" className="bg-gray-800">
                  Auction Expert
                </option>
                <option value="casual" className="bg-gray-800">
                  Casual Helper
                </option>
              </select>
            </div>
          </div>

          {/* Advanced Controls */}
          <motion.div initial={false} animate={{ height: showAdvanced ? "auto" : 0 }} className="overflow-hidden">
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <label className="block text-white font-medium mb-2">Voice Sensitivity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.7"
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Response Speed</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  defaultValue="1"
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">AI Confidence Threshold</label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  defaultValue="0.8"
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </motion.div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center space-x-2 text-white/70 hover:text-white transition-colors py-2"
          >
            <span>{showAdvanced ? "Hide" : "Show"} Advanced Settings</span>
            <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
              ▼
            </motion.div>
          </button>
        </div>
      </motion.div>
    </div>
  )

  // Live stats dashboard
  const LiveStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[
        {
          label: "Active Auctions",
          value: stats.activeAuctions,
          icon: <Activity className="h-5 w-5" />,
          color: "text-green-400",
          bg: "bg-green-500/20",
        },
        {
          label: "Voice Commands",
          value: conversationHistory.length,
          icon: <Mic className="h-5 w-5" />,
          color: "text-blue-400",
          bg: "bg-blue-500/20",
        },
        {
          label: "AI Accuracy",
          value: `${(aiConfidence * 100).toFixed(0)}%`,
          icon: <Brain className="h-5 w-5" />,
          color: "text-purple-400",
          bg: "bg-purple-500/20",
        },
        {
          label: "Success Rate",
          value: "98.7%",
          icon: <Award className="h-5 w-5" />,
          color: "text-yellow-400",
          bg: "bg-yellow-500/20",
        },
      ].map((stat, index) => (
        <motion.div
          key={index}
          className={`glass-card p-4 ${stat.bg} border border-white/10`}
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-white/70 text-sm">{stat.label}</div>
            </div>
            <div className={stat.color}>{stat.icon}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )

  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          className="glass-card p-8 text-center max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <VolumeX className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Voice Not Supported</h2>
          <p className="text-white/70 mb-6">
            Your browser doesn't support voice recognition. Please use Chrome, Firefox, or Safari.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Reload Page
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <motion.div className="text-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent mb-4">
          Voice Control Center
        </h1>
        <p className="text-white/80 text-xl max-w-2xl mx-auto">
          Experience the future of auction bidding with advanced AI-powered voice commands
        </p>
      </motion.div>

      {/* Main Voice Interface */}
      <motion.div
        className="glass-card p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AdvancedVoiceVisualizer />

        <div className="mt-8 mb-8">
          <motion.button
            onClick={toggleListening}
            disabled={!isEnabled}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening
                ? "bg-gradient-to-r from-red-500 to-pink-500 shadow-red-500/50"
                : "bg-gradient-to-r from-blue-500 to-purple-500 shadow-blue-500/50"
            } ${!isEnabled ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}`}
            whileHover={isEnabled ? { scale: 1.1 } : {}}
            whileTap={isEnabled ? { scale: 0.95 } : {}}
          >
            {isListening ? <MicOff className="h-10 w-10 text-white" /> : <Mic className="h-10 w-10 text-white" />}
          </motion.button>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">
            {isListening ? "🎤 Listening..." : "Click to Start Voice Control"}
          </h3>

          <AnimatePresence>
            {(transcript || interimTranscript) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-4 max-w-2xl mx-auto"
              >
                <p className="text-white text-lg">
                  <span className="font-medium">{transcript}</span>
                  <span className="text-white/60 italic">{interimTranscript}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center space-x-3 text-white/70"
              >
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <span className="text-lg">AI is processing your command...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Live Stats */}
      <LiveStats />

      {/* Navigation Tabs */}
      <div className="flex space-x-2 bg-white/5 rounded-xl p-2">
        {[
          { key: "control", label: "Smart Commands", icon: <Zap className="h-5 w-5" /> },
          { key: "ai", label: "AI Status", icon: <Brain className="h-5 w-5" /> },
          { key: "history", label: "Conversation", icon: <MessageCircle className="h-5 w-5" /> },
          { key: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
        ].map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-lg transition-all font-medium ${
              activeTab === tab.key
                ? "bg-white/20 text-white shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "control" && <SmartCommands />}
          {activeTab === "ai" && <EnhancedAIStatus />}
          {activeTab === "history" && <ConversationHistory />}
          {activeTab === "settings" && <AdvancedSettings />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default VoiceControl
