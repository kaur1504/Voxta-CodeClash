import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Bell, DollarSign, Clock, Trophy } from 'lucide-react'
import { useSocket } from "../contexts/SocketContext"

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([])
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    const handleNotification = (data) => {
      const notification = {
        id: Date.now(),
        ...data,
        timestamp: new Date(),
      }
      setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Keep only 5 notifications
    }

    socket.on("bidUpdate", (data) => {
      handleNotification({
        type: "bid",
        title: "New Bid Placed",
        message: `$${data.newBid} on ${data.productName}`,
        icon: DollarSign,
        color: "from-green-500 to-emerald-500"
      })
    })

    socket.on("auctionEndingSoon", (data) => {
      handleNotification({
        type: "warning",
        title: "Auction Ending Soon",
        message: `${data.productName} ends in ${Math.floor(data.timeLeft / 60)} minutes`,
        icon: Clock,
        color: "from-orange-500 to-red-500"
      })
    })

    socket.on("auctionEnded", (data) => {
      handleNotification({
        type: "info",
        title: "Auction Ended",
        message: `${data.productName} has ended`,
        icon: Trophy,
        color: "from-blue-500 to-purple-500"
      })
    })

    return () => {
      socket.off("bidUpdate")
      socket.off("auctionEndingSoon")
      socket.off("auctionEnded")
    }
  }, [socket])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = notification.icon || Bell
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              className={`bg-gradient-to-r ${notification.color} p-4 rounded-xl shadow-lg backdrop-blur-sm border border-white/20 max-w-sm`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm">{notification.title}</h4>
                  <p className="text-white/90 text-sm">{notification.message}</p>
                  <p className="text-white/70 text-xs mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default NotificationSystem
