import { useContext } from "react";
import { ToastContext } from "./ToastContext";

export function useToast() {
  const toast = useContext(ToastContext);

  if (toast === null) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return toast;
}

export function useToastHost() {
  return useToast().setHost;
}