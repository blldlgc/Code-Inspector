import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
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

// Basit yerel ayar kalıcı hale getirme anahtarları (localStorage kullanır)
const STORAGE_KEYS = {
  language: "app.language",
  telemetry: "app.telemetryEnabled",
  theme: "vite-ui-theme", // mevcut ThemeProvider anahtarı
} as const;

type LanguageOption = "en" | "tr";
type ThemeOption = "dark" | "light" | "system";

export function SystemSettings() {
  // Tema ThemeProvider üzerinden yönetiliyor
  const { theme, setTheme } = useTheme();

  const [language, setLanguage] = useState<LanguageOption>("en");
  const [telemetryEnabled, setTelemetryEnabled] = useState<boolean>(false);

  // Kaydedilmiş varsayılanları yükle
  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEYS.language) as LanguageOption | null;
    const savedTelemetry = localStorage.getItem(STORAGE_KEYS.telemetry);

    if (savedLanguage === "en" || savedLanguage === "tr") setLanguage(savedLanguage);
    if (savedTelemetry != null) setTelemetryEnabled(savedTelemetry === "true");
  }, []);

  // İptal için mevcut kalıcı değerleri okuyan memo
  const persistedValues = useMemo(() => {
    return {
      language: (localStorage.getItem(STORAGE_KEYS.language) as LanguageOption) ?? "en",
      telemetryEnabled: (localStorage.getItem(STORAGE_KEYS.telemetry) ?? "false") === "true",
      theme,
    } as const;
  }, [theme]);

  const handleSave = () => {
    // Türkçe: Ayarları localStorage'a yazar ve temayı uygular
    localStorage.setItem(STORAGE_KEYS.language, language);
    localStorage.setItem(STORAGE_KEYS.telemetry, telemetryEnabled ? "true" : "false");
    // Tema setTheme ile zaten ThemeProvider tarafından kalıcı hale getiriliyor
  };

  const handleCancel = () => {
    // Türkçe: Değişiklikleri geri al ve kalıcı değerleri geri yükle
    setLanguage(persistedValues.language);
    setTelemetryEnabled(persistedValues.telemetryEnabled);
    setTheme(persistedValues.theme);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage application preferences saved on this device.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="language">Language</Label>
          <Select value={language} onValueChange={(v: LanguageOption) => setLanguage(v)}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tr">Türkçe</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="theme">Theme</Label>
          <Select value={theme} onValueChange={(v: ThemeOption) => setTheme(v as unknown as ThemeOption)}>
            <SelectTrigger id="theme">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Anonymous Telemetry</Label>
            <p className="text-sm text-muted-foreground">
              Share anonymous usage data to improve the product
            </p>
          </div>
          <Switch checked={telemetryEnabled} onCheckedChange={setTelemetryEnabled} />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}



