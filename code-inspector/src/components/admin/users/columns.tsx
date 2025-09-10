import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Shield, User } from "lucide-react"
import { User as UserType } from "@/types/user"
import { userService } from "@/services/userService"

export const columns = [
  {
    accessorKey: "username",
    header: "Kullanıcı Adı",
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
    header: "E-posta",
  },
  {
    accessorKey: "role",
    header: "Rol",
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
    header: "Durum",
    cell: ({ row }) => {
      const enabled = row.getValue("enabled") as boolean
      return (
        <Badge variant={enabled ? "default" : "destructive"}>
          {enabled ? "Aktif" : "Pasif"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => {
      const user = row.original

      const handleDelete = async () => {
        if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
          return
        }

        try {
          await userService.deleteUser(user.id)
          // Sayfayı yenile
          window.location.reload()
        } catch (error) {
          console.error("Error deleting user:", error)
          alert("Kullanıcı silinirken bir hata oluştu.")
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Menüyü aç</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
            <DropdownMenuItem>Profili Görüntüle</DropdownMenuItem>
            <DropdownMenuItem>Rolü Değiştir</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600"
            >
              Hesabı Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]