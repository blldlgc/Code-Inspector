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
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage system-wide settings from here.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="site-name">Site Name</Label>
          <Input id="site-name" defaultValue="Code Inspector" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="language">Default Language</Label>
          <Select defaultValue="en">
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tr">Türkçe</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">
              Put the system into maintenance mode
            </p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Debug Mode</Label>
            <p className="text-sm text-muted-foreground">
              Enable developer debugging mode
            </p>
          </div>
          <Switch />
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure security-related settings from here.
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
          <Input type="number" id="session-timeout" defaultValue="60" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">
              Mandatory 2FA for all users
            </p>
          </div>
          <Switch />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </div>
    </div>
  );
}



