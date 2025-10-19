import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, User, Lock, Eye, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"

interface SecurityLog {
  id: number
  eventType: string
  userId?: number
  username?: string
  ipAddress?: string
  userAgent?: string
  details?: any
  createdAt: string
}

interface LogStats {
  totalLogs: number
  failedLogins24h: number
  loginSuccessCount: number
  loginFailedCount: number
  userCreatedCount: number
  roleChangedCount: number
}

export function SecurityLogs() {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get("/api/security-logs/recent")
      setLogs(data)
    } catch (err) {
      console.error("Error fetching security logs:", err)
      setError("Failed to load security logs.")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await axios.get("/api/security-logs/stats")
      setStats(data)
    } catch (err) {
      console.error("Error fetching log stats:", err)
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchStats()
    
    // Yorum: Her 30 saniyede bir logları yenile
    const intervalId = setInterval(() => {
      fetchLogs()
      fetchStats()
    }, 30000)
    
    return () => clearInterval(intervalId)
  }, [])

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "LOGIN_FAILED":
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case "LOGIN_SUCCESS":
        return <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
      case "USER_CREATED":
        return <User className="h-4 w-4 text-green-600 dark:text-green-400" />
      case "ROLE_CHANGED":
        return <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      case "ADMIN_ACTION":
        return <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case "LOGIN_FAILED":
        return <Badge variant="destructive">Failed</Badge>
      case "LOGIN_SUCCESS":
        return <Badge variant="secondary">Success</Badge>
      case "USER_CREATED":
        return <Badge variant="secondary">Registration</Badge>
      case "ROLE_CHANGED":
        return <Badge variant="outline">Role Change</Badge>
      case "ADMIN_ACTION":
        return <Badge variant="default">Admin</Badge>
      default:
        return <Badge variant="outline">{eventType}</Badge>
    }
  }

  const getEventTitle = (eventType: string, details: any) => {
    switch (eventType) {
      case "LOGIN_FAILED":
        return "Failed login attempt"
      case "LOGIN_SUCCESS":
        return "Successful login"
      case "USER_CREATED":
        return "New user registered"
      case "ROLE_CHANGED":
        return "Role change detected"
      case "ADMIN_ACTION":
        return "Admin action performed"
      default:
        return eventType.replace(/_/g, " ").toLowerCase()
    }
  }

  const getEventDescription = (log: SecurityLog) => {
    const { eventType, username, ipAddress, details } = log
    const timeAgo = new Date(log.createdAt).toLocaleString()
    
    switch (eventType) {
      case "LOGIN_FAILED":
        return `IP: ${ipAddress || "unknown"} • User: ${username || "unknown"} • ${timeAgo}`
      case "LOGIN_SUCCESS":
        return `User: ${username} • IP: ${ipAddress || "unknown"} • ${timeAgo}`
      case "USER_CREATED":
        return `Username: ${username} • ${timeAgo}`
      case "ROLE_CHANGED":
        const oldRole = details?.oldRole || "unknown"
        const newRole = details?.newRole || "unknown"
        return `User: ${username} • Role: ${oldRole} → ${newRole} • ${timeAgo}`
      case "ADMIN_ACTION":
        return `Action: ${details?.action || "unknown"} • Admin: ${username} • ${timeAgo}`
      default:
        return `${username ? `User: ${username}` : ""} • ${timeAgo}`
    }
  }

  const getIconBgColor = (eventType: string) => {
    switch (eventType) {
      case "LOGIN_FAILED":
        return "bg-red-100 dark:bg-red-900/20"
      case "LOGIN_SUCCESS":
        return "bg-green-100 dark:bg-green-900/20"
      case "USER_CREATED":
        return "bg-green-100 dark:bg-green-900/20"
      case "ROLE_CHANGED":
        return "bg-orange-100 dark:bg-orange-900/20"
      case "ADMIN_ACTION":
        return "bg-blue-100 dark:bg-blue-900/20"
      default:
        return "bg-gray-100 dark:bg-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Logs</h2>
          <p className="text-muted-foreground">Loading security events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Logs</h2>
          <p className="text-muted-foreground">
            Monitor security events and user activities across the system.
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failedLogins24h || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.roleChangedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Role changes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Registrations</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.userCreatedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total registrations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Lock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLogs || 0}</div>
            <p className="text-xs text-muted-foreground">
              All security events
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Latest security events and user activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No security events found.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${getIconBgColor(log.eventType)} rounded-full flex items-center justify-center`}>
                      {getEventIcon(log.eventType)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getEventTitle(log.eventType, log.details)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getEventDescription(log)}
                    </p>
                  </div>
                  {getEventBadge(log.eventType)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}