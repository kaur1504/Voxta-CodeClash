"use client"

import { Mic, TrendingUp } from "lucide-react"

const HeroSection = () => {
  const startVoiceInterface = () => {
    document.dispatchEvent(new CustomEvent("startVoiceInterface"))
  }

  return (
    <div className="card">
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Voxta</h1>
        <p className="text-xl text-gray-600 mb-8">
          The future of voice-powered auctions. Bid with your voice, win with ease.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button onClick={startVoiceInterface} className="btn-primary flex items-center space-x-2 px-6 py-3">
            <Mic className="h-5 w-5" />
            <span>Start Voice Bidding</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2 px-6 py-3">
            <TrendingUp className="h-5 w-5" />
            <span>View Analytics</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
            <div className="text-gray-600">Active Auctions</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-success-600 mb-2">1,200+</div>
            <div className="text-gray-600">Happy Bidders</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-warning-600 mb-2">$2.5M+</div>
            <div className="text-gray-600">Total Sales</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
