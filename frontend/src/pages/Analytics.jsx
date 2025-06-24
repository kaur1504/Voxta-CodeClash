import React, { useState, useEffect } from 'react'
import { useAuction } from '../contexts/AuctionContext'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Activity, 
  Target,
  Award,
  Zap,
  Brain,
  Eye,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Analytics = () => {
  const { auctions, stats, loading } = useAuction()
  const [timeRange, setTimeRange] = useState('24h')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [voiceAnalytics, setVoiceAnalytics] = useState(null)

  // Enhanced analytics calculations
  useEffect(() => {
    if (auctions && auctions.length > 0) {
      calculateAnalytics()
    }
  }, [auctions, timeRange, selectedCategory])

  const calculateAnalytics = () => {
    const filteredAuctions = selectedCategory === 'all' 
      ? auctions 
      : auctions.filter(auction => auction.category === selectedCategory)

    const totalRevenue = filteredAuctions.reduce((sum, auction) => sum + auction.currentBid, 0)
    const averageBid = filteredAuctions.length > 0 ? totalRevenue / filteredAuctions.length : 0
    
    // Category distribution
    const categoryStats = auctions.reduce((acc, auction) => {
      const category = auction.category || 'General'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    // Bidding activity over time (simulated)
    const biddingActivity = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      bids: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 10000) + 1000
    }))

    // Top performers
    const topAuctions = [...filteredAuctions]
      .sort((a, b) => b.currentBid - a.currentBid)
      .slice(0, 10)

    // Conversion metrics
    const conversionRate = filteredAuctions.length > 0 
      ? (filteredAuctions.filter(a => a.totalBids > 0).length / filteredAuctions.length) * 100 
      : 0

    setAnalyticsData({
      totalRevenue,
      averageBid,
      categoryStats,
      biddingActivity,
      topAuctions,
      conversionRate,
      totalAuctions: filteredAuctions.length,
      activeAuctions: filteredAuctions.filter(a => a.status === 'active').length,
      endingSoon: filteredAuctions.filter(a => {
        if (!a.endTime) return false
        const timeLeft = new Date(a.endTime) - new Date()
        return timeLeft > 0 && timeLeft < 24 * 60 * 60 * 1000 // 24 hours
      }).length
    })
  }

  // Fetch voice analytics (integration with Python backend)
  useEffect(() => {
    fetchVoiceAnalytics()
  }, [])

  const fetchVoiceAnalytics = async () => {
    try {
      // This would connect to your Python voice processing analytics
      const response = await fetch('/api/voice-analytics')
      if (response.ok) {
        const data = await response.json()
        setVoiceAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch voice analytics:', error)
      // Fallback data for demo
      setVoiceAnalytics({
        totalCommands: 1247,
        successRate: 98.7,
        averageConfidence: 94.2,
        topCommands: [
          { command: 'list auctions', count: 342, success: 99.1 },
          { command: 'place bid', count: 298, success: 97.8 },
          { command: 'current status', count: 187, success: 98.9 },
          { command: 'help', count: 156, success: 100 },
        ],
        languageDistribution: {
          'en-US': 78.5,
          'en-GB': 12.3,
          'es-ES': 5.2,
          'fr-FR': 4.0
        }
      })
    }
  }

  const refreshAnalytics = async () => {
    setIsRefreshing(true)
    await Promise.all([
      calculateAnalytics(),
      fetchVoiceAnalytics()
    ])
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Enhanced metric cards
  const MetricCard = ({ title, value, icon, gradient, trend, description, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-500 hover:scale-105"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gradient-to-r ${gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform text-white`}>
            {icon}
          </div>
          {trend && (
            <span className="text-sm text-green-400 font-bold bg-green-500/20 px-3 py-1 rounded-full">
              {trend}
            </span>
          )}
        </div>
        
        <h3 className="text-sm font-medium text-white/70 mb-2">{title}</h3>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        {description && (
          <p className="text-xs text-white/50">{description}</p>
        )}
      </div>
    </motion.div>
  )

  // Advanced chart component
  const ActivityChart = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Activity className="h-6 w-6 mr-3 text-blue-400" />
          Bidding Activity (24h)
        </h3>
        <div className="flex items-center space-x-2 text-sm text-white/70">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span>Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 h-64">
        {analyticsData?.biddingActivity.map((data, index) => (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            animate={{ height: `${(data.bids / 60) * 100}%` }}
            transition={{ delay: index * 0.05, duration: 0.8 }}
            className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg relative group cursor-pointer"
            style={{ minHeight: '8px' }}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {data.hour}:00 - {data.bids} bids
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-white/50 mt-2">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:59</span>
      </div>
    </motion.div>
  )

  // Voice Analytics Section
  const VoiceAnalyticsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Brain className="h-6 w-6 mr-3 text-purple-400" />
          AI Voice Analytics
        </h3>
        <div className="text-sm text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
          Python Backend
        </div>
      </div>

      {voiceAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-300">{voiceAnalytics.totalCommands.toLocaleString()}</div>
            <div className="text-sm text-white/70">Total Commands</div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
            <div className="text-2xl font-bold text-green-300">{voiceAnalytics.successRate}%</div>
            <div className="text-sm text-white/70">Success Rate</div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-300">{voiceAnalytics.averageConfidence}%</div>
            <div className="text-sm text-white/70">Avg Confidence</div>
          </div>
          <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-300">{voiceAnalytics.topCommands.length}</div>
            <div className="text-sm text-white/70">Command Types</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Commands */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Top Voice Commands</h4>
          <div className="space-y-3">
            {voiceAnalytics?.topCommands.map((cmd, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">"{cmd.command}"</div>
                    <div className="text-white/60 text-sm">{cmd.count} uses</div>
                  </div>
                </div>
                <div className="text-green-400 font-bold">{cmd.success}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Language Distribution */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Language Distribution</h4>
          <div className="space-y-3">
            {voiceAnalytics && Object.entries(voiceAnalytics.languageDistribution).map(([lang, percentage], index) => (
              <div key={lang} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{lang}</span>
                  <span className="text-white/70">{percentage}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.1, duration: 0.8 }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-12 bg-white/5 rounded-xl mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Analytics Dashboard
          </h1>
          <p className="text-white/70 text-xl">
            Real-time insights powered by AI voice processing and advanced analytics
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-6 lg:mt-0">
          <button
            onClick={refreshAnalytics}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="1h" className="bg-gray-800">Last Hour</option>
            <option value="24h" className="bg-gray-800">Last 24 Hours</option>
            <option value="7d" className="bg-gray-800">Last 7 Days</option>
            <option value="30d" className="bg-gray-800">Last 30 Days</option>
          </select>

          <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl hover:from-purple-600 hover:to-cyan-600 transition-all shadow-lg">
            <Download className="h-5 w-5" />
            <span>Export</span>
          </button>
        </div>
      </motion.div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${analyticsData?.totalRevenue.toLocaleString() || 0}`}
          icon={<DollarSign className="h-7 w-7" />}
          gradient="from-green-500 to-emerald-500"
          trend="+12.5%"
          description="Last 24 hours"
          delay={0}
        />
        <MetricCard
          title="Active Auctions"
          value={analyticsData?.activeAuctions || 0}
          icon={<Activity className="h-7 w-7" />}
          gradient="from-blue-500 to-cyan-500"
          trend="+8.2%"
          description="Currently live"
          delay={0.1}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${analyticsData?.conversionRate.toFixed(1) || 0}%`}
          icon={<Target className="h-7 w-7" />}
          gradient="from-purple-500 to-pink-500"
          trend="+15.3%"
          description="Bid success rate"
          delay={0.2}
        />
        <MetricCard
          title="Ending Soon"
          value={analyticsData?.endingSoon || 0}
          icon={<Clock className="h-7 w-7" />}
          gradient="from-orange-500 to-red-500"
          trend="+23.1%"
          description="Next 24 hours"
          delay={0.3}
        />
      </div>

      {/* Voice Analytics Integration */}
      <VoiceAnalyticsSection />

      {/* Activity Chart */}
      <ActivityChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Auctions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Award className="h-6 w-6 mr-3 text-yellow-400" />
              Top Performing Auctions
            </h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="all" className="bg-gray-800">All Categories</option>
              {analyticsData && Object.keys(analyticsData.categoryStats).map(category => (
                <option key={category} value={category} className="bg-gray-800">{category}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
            {analyticsData?.topAuctions.map((auction, index) => (
              <motion.div
                key={auction._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white' :
                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' :
                    'bg-white/20 text-white/70'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white group-hover:text-purple-200 transition-colors">
                      {auction.name.length > 30 ? auction.name.substring(0, 30) + '...' : auction.name}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-white/60">
                      <span>{auction.totalBids} bids</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        auction.status === 'active' ? 'bg-green-500/20 text-green-300' :
                        auction.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {auction.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-400">${auction.currentBid.toLocaleString()}</p>
                  <p className="text-sm text-white/50">Current bid</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <BarChart3 className="h-6 w-6 mr-3 text-purple-400" />
              Category Distribution
            </h3>
            <div className="text-sm text-white/70">
              {auctions?.length || 0} total auctions
            </div>
          </div>

          <div className="space-y-4">
            {analyticsData && Object.entries(analyticsData.categoryStats).map(([category, count], index) => {
              const percentage = (count / auctions.length) * 100
              const colors = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500',
                'from-green-500 to-emerald-500',
                'from-orange-500 to-red-500',
                'from-yellow-500 to-orange-500'
              ]

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{category}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white/70">{count}</span>
                      <span className="text-white/50 text-sm">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                      className={`h-3 bg-gradient-to-r ${colors[index % colors.length]} rounded-full shadow-lg`}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Real-time Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Zap className="h-6 w-6 mr-3 text-orange-400" />
            Real-time Activity Feed
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white/70 text-sm">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
          {auctions?.slice(0, 9).map((auction, index) => (
            <motion.div
              key={auction._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-white/50 text-xs">
                  {Math.floor(Math.random() * 60)} min ago
                </span>
              </div>
              <p className="text-white font-medium text-sm mb-1 line-clamp-2">
                New activity on {auction.name}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-bold text-sm">
                  ${auction.currentBid.toLocaleString()}
                </span>
                <span className="text-white/60 text-xs">
                  {auction.totalBids} bids
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Analytics