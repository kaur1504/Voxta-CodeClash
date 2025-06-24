"use client"

import { Mic, Eye, Plus, BarChart3 } from "lucide-react"
import { Link } from "react-router-dom"

const QuickActions = () => {
  const startVoiceInterface = () => {
    document.dispatchEvent(new CustomEvent("startVoiceInterface"))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <button
        onClick={startVoiceInterface}
        className="card card-hover p-6 text-left transition-all hover:bg-primary-50"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Mic className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Voice Bidding</h3>
            <p className="text-sm text-gray-600">Start voice commands</p>
          </div>
        </div>
      </button>

      <Link to="/auctions" className="card card-hover p-6 text-left transition-all hover:bg-success-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-success-100 rounded-lg">
            <Eye className="h-6 w-6 text-success-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Browse Auctions</h3>
            <p className="text-sm text-gray-600">View all active items</p>
          </div>
        </div>
      </Link>

      <Link to="/create" className="card card-hover p-6 text-left transition-all hover:bg-warning-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-warning-100 rounded-lg">
            <Plus className="h-6 w-6 text-warning-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Create Auction</h3>
            <p className="text-sm text-gray-600">List your items</p>
          </div>
        </div>
      </Link>

      <Link to="/analytics" className="card card-hover p-6 text-left transition-all hover:bg-error-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-error-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-error-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600">View performance</p>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default QuickActions
