import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MoreHorizontal, Shield, User, Eye, Edit } from "lucide-react"
import { User as UserType } from "@/types/user"
import { userService } from "@/services/userService"

// Yorum: User Profile Modal bileşeni
function UserProfileModal({ user, children }: { user: UserType; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">Username</Label>
            <div className="col-span-3 font-medium">{user.username}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <div className="col-span-3 font-medium">{user.email}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            <div className="col-span-3">
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                {user.role}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <div className="col-span-3">
              <Badge variant={user.enabled ? "default" : "destructive"}>
                {user.enabled ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="id" className="text-right">User ID</Label>
            <div className="col-span-3 font-mono text-sm">{user.id}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Yorum: Change Role Modal bileşeni
function ChangeRoleModal({ user, onRoleChanged, children }: { 
  user: UserType; 
  onRoleChanged: () => void;
  children: React.ReactNode;
}) {
  const [newRole, setNewRole] = useState(user.role)
  const [newStatus, setNewStatus] = useState(user.enabled)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      await userService.updateUser(user.id, {
        username: user.username,
        email: user.email,
        role: newRole,
        enabled: newStatus,
      })
      setOpen(false) // Modal'ı kapat
      onRoleChanged() // Tabloyu yenile
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change User Role & Status</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">Username</Label>
            <div className="col-span-3 font-medium">{user.username}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            {user.role === "ADMIN" ? (
              <div className="col-span-3">
                <Badge variant="default" className="mr-2">ADMIN</Badge>
                <span className="text-sm text-muted-foreground">(Protected)</span>
              </div>
            ) : (
              <Select value={newRole} onValueChange={(value: string) => setNewRole(value as any)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch 
                checked={newStatus} 
                onCheckedChange={(checked: boolean) => setNewStatus(checked)}
              />
              <span className="text-sm text-muted-foreground">
                {newStatus ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setNewRole(user.role)
              setNewStatus(user.enabled)
            }}
          >
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || user.role === "ADMIN" || (newRole === user.role && newStatus === user.enabled)}
          >
            {saving ? "Saving..." : user.role === "ADMIN" ? "Admin Protected" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const columns = [
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          {row.original.role === "ADMIN" ? (
            <Shield className="mr-2 h-4 w-4 text-blue-500" />
          ) : (
            <User className="mr-2 h-4 w-4 text-gray-500" />
          )}
          <span>{row.getValue("username")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
          {role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "enabled",
    header: "Status",
    cell: ({ row }) => {
      const enabled = row.getValue("enabled") as boolean
      return (
        <Badge variant={enabled ? "default" : "destructive"}>
          {enabled ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const user = row.original
      const refreshData = () => {
        // Yorum: Tabloyu yenilemek için parent component'ten gelen refresh fonksiyonunu çağır
        if (table?.options?.meta?.refreshData) {
          table.options.meta.refreshData()
        } else {
          // Fallback: sayfayı yenile
          window.location.reload()
        }
      }

      const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this user?")) {
          return
        }

        try {
          await userService.deleteUser(user.id)
          refreshData()
        } catch (error) {
          console.error("Error deleting user:", error)
          alert("An error occurred while deleting the user.")
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <UserProfileModal user={user}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
            </UserProfileModal>
            {user.role !== "ADMIN" ? (
              <ChangeRoleModal user={user} onRoleChanged={refreshData}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit className="mr-2 h-4 w-4" />
                  Change Role
                </DropdownMenuItem>
              </ChangeRoleModal>
            ) : (
              <DropdownMenuItem disabled>
                <Edit className="mr-2 h-4 w-4" />
                Change Role (Admin Protected)
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600"
            >
              Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]