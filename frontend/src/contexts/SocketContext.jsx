import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  useEffect(() => {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"
    
    const newSocket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    })

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id)
      setIsConnected(true)
      setConnectionError(null)
    })

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason)
      setIsConnected(false)
    })

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error)
      setConnectionError(error.message)
      setIsConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const value = {
    socket,
    isConnected,
    connectionError,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
