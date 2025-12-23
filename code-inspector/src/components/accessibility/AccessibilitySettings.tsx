import React from 'react';
import { useAccessibility, FontSize, FontFamily, ColorBlindnessTheme } from '@/context/AccessibilityContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Accessibility, Type, Contrast, Eye, Volume2 } from 'lucide-react';

interface AccessibilitySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  open,
  onOpenChange,
}) => {
  const { settings, updateSettings, isLoading } = useAccessibility();

  const handleFontSizeChange = (value: FontSize) => {
    updateSettings({ fontSize: value });
  };

  const handleFontFamilyChange = (value: FontFamily) => {
    updateSettings({ fontFamily: value });
  };

  const handleHighContrastChange = (checked: boolean) => {
    updateSettings({ highContrast: checked });
  };

  const handleColorBlindnessThemeChange = (value: ColorBlindnessTheme) => {
    updateSettings({ colorBlindnessTheme: value });
  };

  const handleVoiceReadingEnabledChange = (checked: boolean) => {
    updateSettings({ voiceReadingEnabled: checked });
  };

  const handleVoiceReadingSpeedChange = (speed: number) => {
    updateSettings({ voiceReadingSpeed: speed });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility Settings
          </DialogTitle>
          <DialogDescription>
            Customize the interface based on your visual and hearing needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Yazı tipine ilişkin ayarlar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Font Settings</h3>
            </div>

            <div className="grid gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Select
                  value={settings.fontSize}
                  onValueChange={handleFontSizeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="font-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xlarge">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-family">Font Family</Label>
                <Select
                  value={settings.fontFamily}
                  onValueChange={handleFontFamilyChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="font-family">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="sans-serif">Sans-serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Görsel ayarlar ve renk seçenekleri */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Visual Settings</h3>
            </div>

            <div className="grid gap-4 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Increases the contrast between text and background
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.highContrast}
                  onCheckedChange={handleHighContrastChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-blindness">Color Blindness Support</Label>
                <Select
                  value={settings.colorBlindnessTheme}
                  onValueChange={handleColorBlindnessThemeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="color-blindness">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="deuteranopia">Deuteranopia (Green-Red)</SelectItem>
                    <SelectItem value="protanopia">Protanopia (Red-Green)</SelectItem>
                    <SelectItem value="tritanopia">Tritanopia (Blue-Yellow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sesli okuma ve rapor okuma ayarları */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Text-to-Speech Settings</h3>
            </div>

            <div className="grid gap-4 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="voice-reading">Text-to-Speech</Label>
                  <p className="text-xs text-muted-foreground">
                    Listen to analysis reports as audio
                  </p>
                </div>
                <Switch
                  id="voice-reading"
                  checked={settings.voiceReadingEnabled}
                  onCheckedChange={handleVoiceReadingEnabledChange}
                  disabled={isLoading}
                />
              </div>

              {settings.voiceReadingEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="voice-speed">
                    Reading Speed: {settings.voiceReadingSpeed.toFixed(1)}x
                  </Label>
                  <input
                    id="voice-speed"
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.voiceReadingSpeed}
                    onChange={(e) =>
                      handleVoiceReadingSpeedChange(parseFloat(e.target.value))
                    }
                    disabled={isLoading}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


