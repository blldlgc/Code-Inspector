import { useEffect, useState } from "react"
import { columns } from "./columns"
import { userService } from "@/services/userService"
import { User, UserRole } from "@/types/user"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: UserRole.USER as UserRole,
    enabled: true,
  })

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kullanıcı
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">Kullanıcı Adı</Label>
                <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">E-posta</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Parola</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Rol</Label>
                <select 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={UserRole.USER}>USER</option>
                  <option value={UserRole.ADMIN}>ADMIN</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Aktif</Label>
                <div className="col-span-3">
                  <input 
                    type="checkbox" 
                    checked={form.enabled} 
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={saving || !form.username || !form.email || form.password.length < 6}
                onClick={async () => {
                  try {
                    setSaving(true)
                    await userService.createUser(form)
                    setOpen(false)
                    setForm({ username: "", email: "", password: "", role: UserRole.USER, enabled: true })
                    fetchUsers()
                  } catch (e) {
                    alert("Kullanıcı oluşturulamadı. Lütfen bilgileri kontrol edin.")
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable columns={columns} data={users} />
    </div>
  )
}