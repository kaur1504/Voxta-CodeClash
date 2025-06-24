"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { useSocket } from "./SocketContext"
import { useAuction } from "./AuctionContext"
import toast from "react-hot-toast"

const AIContext = createContext()

export const useAI = () => {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error("useAI must be used within an AIProvider")
  }
  return context
}

export const AIProvider = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const [confidence, setConfidence] = useState(0)
  const [lastCommand, setLastCommand] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [aiPersonality, setAiPersonality] = useState("professional")

  const { socket } = useSocket()
  const { auctions, placeBid, stats } = useAuction()
  const processingRef = useRef(false)

  // Enhanced command patterns with higher accuracy
  const commandPatterns = {
    bidding: [
      // Direct bidding patterns
      /(?:bid|place\s+(?:a\s+)?bid(?:\s+of)?)\s+(\d+(?:\.\d{2})?)/i,
      /(?:offer|put\s+(?:in|up))\s+(\d+(?:\.\d{2})?)/i,
      /(\d+(?:\.\d{2})?)\s+(?:dollars?|bucks?|usd)/i,
      /go\s+(\d+(?:\.\d{2})?)/i,
      /raise\s+(?:to\s+)?(\d+(?:\.\d{2})?)/i,
      /increase\s+(?:to\s+)?(\d+(?:\.\d{2})?)/i,
      // Natural language bidding
      /i\s+(?:want\s+to\s+|will\s+)?bid\s+(\d+(?:\.\d{2})?)/i,
      /let\s+me\s+bid\s+(\d+(?:\.\d{2})?)/i,
      /my\s+bid\s+is\s+(\d+(?:\.\d{2})?)/i,
      // Just numbers with context
      /^(\d+(?:\.\d{2})?)$/,
    ],
    listing: [
      /(?:list|show|display)\s+(?:all\s+)?(?:active\s+)?auctions?/i,
      /what\s+auctions?\s+(?:are\s+)?(?:available|active)/i,
      /show\s+me\s+(?:the\s+)?auctions?/i,
      /available\s+auctions?/i,
      /current\s+auctions?/i,
      /auctions?\s+(?:list|available)/i,
      /^auctions?$/i,
    ],
    status: [
      /(?:current|highest|latest)\s+bid/i,
      /what\s+(?:is\s+)?(?:the\s+)?(?:current|highest)\s+bid/i,
      /bid\s+status/i,
      /how\s+much\s+(?:is\s+)?(?:the\s+)?(?:current\s+)?bid/i,
      /price\s+(?:now|current)/i,
      /status/i,
    ],
    help: [/help/i, /what\s+can\s+(?:you\s+)?do/i, /commands?/i, /how\s+(?:do\s+i|to)/i, /instructions?/i],
    greeting: [/^(?:hello|hi|hey|start)$/i, /good\s+(?:morning|afternoon|evening)/i],
    insights: [
      /(?:analyze|analysis)\s+(?:market\s+)?trends?/i,
      /market\s+insights?/i,
      /recommend(?:ations?)?/i,
      /suggest(?:ions?)?/i,
      /insights?/i,
    ],
  }

  // Advanced NLP processing with context awareness
  const processCommand = useCallback(
    (input) => {
      const normalizedInput = input.toLowerCase().trim()

      // Context-aware processing
      const context = {
        hasActiveAuctions: auctions.some((a) => a.status === "active"),
        userHasBids: conversationHistory.some((h) => h.intent === "bidding"),
        recentCommands: conversationHistory.slice(-3).map((h) => h.intent),
      }

      // Enhanced bidding detection with context
      for (const pattern of commandPatterns.bidding) {
        const match = normalizedInput.match(pattern)
        if (match) {
          const bidAmount = Number.parseFloat(match[1])
          if (bidAmount && bidAmount > 0) {
            // Validate bid amount against context
            const activeAuctions = auctions.filter((a) => a.status === "active")
            if (activeAuctions.length > 0) {
              const highestCurrentBid = Math.max(...activeAuctions.map((a) => a.currentBid))
              const confidence = bidAmount > highestCurrentBid ? 0.95 : 0.85

              return {
                intent: "bidding",
                confidence,
                data: { bidAmount },
                context: { validBid: bidAmount > highestCurrentBid },
              }
            }
            return {
              intent: "bidding",
              confidence: 0.9,
              data: { bidAmount },
            }
          }
        }
      }

      // Process other intents with enhanced accuracy
      for (const [intent, patterns] of Object.entries(commandPatterns)) {
        if (intent === "bidding") continue

        for (const pattern of patterns) {
          if (pattern.test(normalizedInput)) {
            // Calculate confidence based on pattern specificity and context
            let confidence = 0.9

            // Boost confidence for specific patterns
            if (intent === "listing" && normalizedInput.includes("active")) confidence = 0.95
            if (intent === "status" && normalizedInput.includes("current")) confidence = 0.95
            if (intent === "help" && normalizedInput === "help") confidence = 0.98

            return {
              intent,
              confidence,
              data: {},
              context,
            }
          }
        }
      }

      // Fuzzy matching for partial commands
      const fuzzyMatches = {
        bid: "bidding",
        list: "listing",
        show: "listing",
        status: "status",
        help: "help",
        price: "status",
      }

      for (const [keyword, intent] of Object.entries(fuzzyMatches)) {
        if (normalizedInput.includes(keyword)) {
          return {
            intent,
            confidence: 0.7,
            data: {},
            fuzzy: true,
          }
        }
      }

      return {
        intent: "unknown",
        confidence: 0.1,
        data: {},
      }
    },
    [auctions, conversationHistory],
  )

  // Enhanced AI processing with better responses
  const processVoiceCommand = useCallback(
    async (voiceInput, inputConfidence = 0.8) => {
      if (processingRef.current) return null

      processingRef.current = true
      setIsProcessing(true)
      setIsActive(true)

      try {
        const timestamp = new Date().toISOString()

        // Add user message to history
        setConversationHistory((prev) => [
          ...prev,
          {
            type: "user",
            content: voiceInput,
            timestamp,
            confidence: inputConfidence,
          },
        ])

        // Process with enhanced AI
        const analysis = processCommand(voiceInput)
        setConfidence(analysis.confidence)
        setLastCommand(voiceInput)

        let response = ""
        let actionResult = null

        // Handle intents with personality-aware responses
        const personalityResponses = {
          professional: {
            greeting: "Good day! I'm your professional auction assistant. How may I help you today?",
            bidSuccess: "Your bid has been successfully placed. I'll monitor the auction for you.",
            bidFailed: "I apologize, but your bid could not be processed at this time.",
          },
          friendly: {
            greeting: "Hey there! I'm excited to help you with your auction adventure! What can I do for you?",
            bidSuccess: "Awesome! Your bid is in! Fingers crossed for you! 🤞",
            bidFailed: "Oops! Something went wrong with your bid. Let's try again!",
          },
          expert: {
            greeting:
              "Welcome! As your auction expert, I'm here to provide strategic guidance and execute your commands.",
            bidSuccess: "Bid executed successfully. Based on market analysis, this appears to be a strategic move.",
            bidFailed: "Bid execution failed. I recommend reviewing the auction parameters and trying again.",
          },
        }

        const responses = personalityResponses[aiPersonality] || personalityResponses.professional

        switch (analysis.intent) {
          case "greeting":
            response = responses.greeting
            break

          case "bidding":
            if (analysis.data.bidAmount) {
              const activeAuctions = auctions.filter((a) => a.status === "active")

              if (activeAuctions.length > 0) {
                const targetAuction = activeAuctions[0]

                if (analysis.data.bidAmount > targetAuction.currentBid) {
                  try {
                    actionResult = await placeBid(targetAuction._id, analysis.data.bidAmount, "Voice User")

                    if (actionResult.success) {
                      response = `${responses.bidSuccess} Your bid of $${analysis.data.bidAmount} on "${targetAuction.name}" is now active.`
                      toast.success(`🎯 Bid placed: $${analysis.data.bidAmount}`)
                    } else {
                      response = `${responses.bidFailed} ${actionResult.message || "Please try again."}`
                      toast.error("Bid failed")
                    }
                  } catch (error) {
                    response = "I encountered an error while placing your bid. Please try again."
                    toast.error("Bid error")
                  }
                } else {
                  response = `Your bid of $${analysis.data.bidAmount} is below the current bid of $${targetAuction.currentBid}. Please bid at least $${targetAuction.currentBid + 1}.`
                  toast.warning("Bid too low")
                }
              } else {
                response = "There are no active auctions available for bidding at the moment."
              }
            } else {
              response = "I didn't catch the bid amount. Please specify an amount like 'bid 100 dollars'."
            }
            break

          case "listing":
            const activeAuctions = auctions.filter((a) => a.status === "active")
            if (activeAuctions.length > 0) {
              response = `I found ${activeAuctions.length} active auctions: `
              activeAuctions.slice(0, 3).forEach((auction, index) => {
                response += `${index + 1}. "${auction.name}" - current bid $${auction.currentBid} with ${auction.totalBids} bids. `
              })
              if (activeAuctions.length > 3) {
                response += `And ${activeAuctions.length - 3} more auctions available.`
              }
            } else {
              response = "There are no active auctions at the moment. Please check back later."
            }
            break

          case "status":
            const firstAuction = auctions.find((a) => a.status === "active")
            if (firstAuction) {
              response = `The current highest bid is $${firstAuction.currentBid} for "${firstAuction.name}" with ${firstAuction.totalBids} total bids.`
            } else {
              response = "No active auctions to check status for."
            }
            break

          case "insights":
            const totalValue = auctions.reduce((sum, a) => sum + a.currentBid, 0)
            const avgBid = totalValue / auctions.length || 0
            response = `Market Analysis: ${stats.activeAuctions} active auctions with average bid of $${avgBid.toFixed(2)}. Total market value: $${totalValue.toLocaleString()}. Recommendation: Focus on auctions ending within 24 hours for best opportunities.`
            break

          case "help":
            response = `I can help you with: 
            • "List auctions" - Show available items
            • "Current bid" - Check highest bids  
            • "Bid [amount] dollars" - Place bids
            • "Market insights" - Get analysis
            • "Status" - Check auction status
            What would you like to do?`
            break

          default:
            response = analysis.fuzzy
              ? `I think you want to ${analysis.intent}. Could you be more specific?`
              : "I didn't understand that command. Say 'help' to see what I can do, or try 'list auctions' or 'bid 100 dollars'."
        }

        // Add AI response to history
        setConversationHistory((prev) => [
          ...prev,
          {
            type: "assistant",
            content: response,
            timestamp: new Date().toISOString(),
            confidence: analysis.confidence,
            intent: analysis.intent,
            actionResult,
          },
        ])

        // Emit to socket
        if (socket) {
          socket.emit("aiInteraction", {
            input: voiceInput,
            response,
            intent: analysis.intent,
            confidence: analysis.confidence,
            timestamp,
          })
        }

        return {
          response,
          intent: analysis.intent,
          confidence: analysis.confidence,
          actionResult,
        }
      } catch (error) {
        console.error("AI Processing Error:", error)
        const errorResponse = "I encountered an error processing your request. Please try again."

        setConversationHistory((prev) => [
          ...prev,
          {
            type: "assistant",
            content: errorResponse,
            timestamp: new Date().toISOString(),
            confidence: 0,
            error: true,
          },
        ])

        return {
          response: errorResponse,
          intent: "error",
          confidence: 0,
          error: true,
        }
      } finally {
        setIsProcessing(false)
        processingRef.current = false
        setTimeout(() => setIsActive(false), 3000)
      }
    },
    [auctions, placeBid, socket, aiPersonality],
  )

  // Listen for voice commands
  useEffect(() => {
    const handleVoiceCommand = (event) => {
      const { command, confidence } = event.detail
      processVoiceCommand(command, confidence)
    }

    document.addEventListener("voiceCommand", handleVoiceCommand)
    return () => document.removeEventListener("voiceCommand", handleVoiceCommand)
  }, [processVoiceCommand])

  // Clear conversation history
  const clearHistory = useCallback(() => {
    setConversationHistory([])
    toast.success("Conversation cleared")
  }, [])

  const value = {
    isProcessing,
    conversationHistory,
    confidence,
    lastCommand,
    isActive,
    aiPersonality,
    setAiPersonality,
    processVoiceCommand,
    clearHistory,
  }

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}
