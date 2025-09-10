import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SystemSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Genel Ayarlar</h3>
        <p className="text-sm text-muted-foreground">
          Sistem genelinde geçerli olan ayarları buradan yönetebilirsiniz.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="site-name">Site Adı</Label>
          <Input id="site-name" defaultValue="Code Inspector" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="language">Varsayılan Dil</Label>
          <Select defaultValue="tr">
            <SelectTrigger id="language">
              <SelectValue placeholder="Dil seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tr">Türkçe</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Bakım Modu</Label>
            <p className="text-sm text-muted-foreground">
              Sistemi bakım moduna alır
            </p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Debug Modu</Label>
            <p className="text-sm text-muted-foreground">
              Geliştirici hata ayıklama modunu aktif eder
            </p>
          </div>
          <Switch />
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Güvenlik Ayarları</h3>
        <p className="text-sm text-muted-foreground">
          Sistem güvenliği ile ilgili ayarları buradan yapılandırabilirsiniz.
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="session-timeout">Oturum Zaman Aşımı (dakika)</Label>
          <Input type="number" id="session-timeout" defaultValue="60" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>İki Faktörlü Doğrulama</Label>
            <p className="text-sm text-muted-foreground">
              Tüm kullanıcılar için zorunlu 2FA
            </p>
          </div>
          <Switch />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline">İptal</Button>
        <Button>Kaydet</Button>
      </div>
    </div>
  );
}



