import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, User, Lock, Eye, RefreshCw, List, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  const [allLogs, setAllLogs] = useState<SecurityLog[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [allLogsLoading, setAllLogsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAllLogs, setShowAllLogs] = useState(false)
  
  // Pagination state'leri
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [pageSize] = useState(20)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get("/api/admin/security-logs/recent")
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
      const { data } = await axios.get("/api/admin/security-logs/stats")
      setStats(data)
    } catch (err) {
      console.error("Error fetching log stats:", err)
    }
  }

  const fetchAllLogs = async (page: number = 0) => {
    try {
      setAllLogsLoading(true)
      const { data } = await axios.get(`/api/admin/security-logs?page=${page}&size=${pageSize}`)
      setAllLogs(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
      setCurrentPage(page)
    } catch (err) {
      console.error("Error fetching all logs:", err)
    } finally {
      setAllLogsLoading(false)
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
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Security Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.failedLogins24h || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.roleChangedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Role changes
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Registrations</CardTitle>
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.userCreatedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total registrations
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalLogs || 0}</div>
            <p className="text-xs text-muted-foreground">
              All security events
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                Recent Security Events
              </CardTitle>
              <CardDescription className="mt-1">
                Latest security events and user activities
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setShowAllLogs(true); fetchAllLogs(0); }} variant="outline" size="sm">
                <List className="h-4 w-4 mr-2" />
                View All Logs
              </Button>
              <Button onClick={fetchLogs} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground">No security events found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors duration-200">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 ${getIconBgColor(log.eventType)} rounded-full flex items-center justify-center shadow-sm`}>
                      {getEventIcon(log.eventType)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {getEventTitle(log.eventType, log.details)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getEventDescription(log)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getEventBadge(log.eventType)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Logs Dialog */}
      <Dialog open={showAllLogs} onOpenChange={setShowAllLogs}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
              All Security Logs
            </DialogTitle>
            {totalElements > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} logs
              </div>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {allLogsLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                </div>
                <p className="text-muted-foreground">Loading all security logs...</p>
              </div>
            ) : allLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No security logs found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allLogs.map((log) => (
                  <div key={log.id} className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors duration-200">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 ${getIconBgColor(log.eventType)} rounded-full flex items-center justify-center shadow-sm`}>
                        {getEventIcon(log.eventType)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {getEventTitle(log.eventType, log.details)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getEventDescription(log)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getEventBadge(log.eventType)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAllLogs(currentPage - 1)}
                  disabled={currentPage === 0 || allLogsLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAllLogs(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1 || allLogsLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}