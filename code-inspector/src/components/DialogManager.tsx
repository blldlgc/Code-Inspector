import React from 'react';
import { create } from 'zustand';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DialogStore {
  isOpen: boolean;
  title: string;
  description: string;
  content: React.ReactNode;
  onOpenChange: (open: boolean) => void;
}

const useDialogStore = create<DialogStore>((set) => ({
  isOpen: false,
  title: '',
  description: '',
  content: null,
  onOpenChange: (open) => set({ isOpen: open }),
}));

export class DialogManager {
  static show(title: string, description: string, content: React.ReactNode) {
    useDialogStore.setState({ isOpen: true, title, description, content });
  }

  static hide() {
    useDialogStore.setState({ isOpen: false });
  }
}

export const DialogComponent: React.FC = () => {
  const { isOpen, title, description, content, onOpenChange } = useDialogStore();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-base  text-gray-600">{description}</DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={() => DialogManager.hide()}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogComponent;