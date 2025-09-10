import { useEffect, useState } from "react"
import { columns } from "./columns"
import { userService } from "@/services/userService"
import { User } from "@/types/user"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await userService.getAllUsers()
      console.log('Fetched users:', data)
      setUsers(data)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Kullanıcılar yüklenirken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center h-48">Yükleniyor...</div>
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-500 p-4">{error}</div>
        <Button onClick={fetchUsers}>Tekrar Dene</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Kullanıcılar</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kullanıcı
        </Button>
      </div>
      <DataTable columns={columns} data={users} />
    </div>
  )
}