import { createStore } from "@tanstack/react-store";

type SpeechDialogStoreState = {
 open: boolean;
};

export const speechSettingsDialogStore = createStore<
 SpeechDialogStoreState,
 {
  openDialog: () => void;
  closeDialog: () => void;
  setOpen: (open: boolean) => void;
 }
>({ open: false }, ({ setState }) => ({
 openDialog: () => setState(() => ({ open: true })),
 closeDialog: () => setState(() => ({ open: false })),
 setOpen: (open) => setState(() => ({ open })),
}));
