"use client"

const StatsCard = ({ title, value, icon, color = "primary", trend, description }) => {
  const getColorClasses = (color) => {
    const colors = {
      primary: "text-primary-600 bg-primary-50 border-primary-200",
      success: "text-success-600 bg-success-50 border-success-200",
      warning: "text-warning-600 bg-warning-50 border-warning-200",
      error: "text-error-600 bg-error-50 border-error-200",
    }
    return colors[color] || colors.primary
  }

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
          </div>
          <div className={`p-3 rounded-lg border ${getColorClasses(color)}`}>{icon}</div>
        </div>
        {trend && (
          <div className="mt-4">
            <span className="text-sm font-medium text-success-600">{trend}</span>
            <span className="text-sm text-gray-500 ml-1">from last month</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsCard
