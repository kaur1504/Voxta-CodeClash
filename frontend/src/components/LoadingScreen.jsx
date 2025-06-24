import { motion } from "framer-motion"
import { Gavel, Loader2 } from 'lucide-react'

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative mx-auto mb-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <Gavel className="h-10 w-10 text-white" />
          </div>
          <div className="absolute -inset-2 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-full blur opacity-25"></div>
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-4"
        >
          Loading Voxta
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center space-x-2 text-white/70"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Preparing your auction experience...</span>
        </motion.div>
      </div>
    </div>
  )
}

export default LoadingScreen
