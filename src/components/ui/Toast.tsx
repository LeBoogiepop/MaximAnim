"use client";

import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { localizeOwnedText } from "@/lib/i18n/translate";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

/** One follow-up the toast offers (e.g. "Annuler"), and how long it stays offered. */
export interface ToastAction {
  label: string;
  onSelect: () => void;
  durationMs: number;
}

/** Lazy messages preserve external arguments and react to a language change. */
type ToastMessage = string | (() => string);

interface Toast {
  id: number;
  message: ToastMessage;
  tone: "success" | "error";
  action?: ToastAction;
}

type Show = (message: ToastMessage, tone?: Toast["tone"], action?: ToastAction) => void;

const ToastContext = createContext<Show>(() => {});

const TOAST_MS = 2400;

export function ToastProvider({ children }: { children: ReactNode }) {
  useInterfaceLanguage();
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<Show>((message, tone = "success", action) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone, action });
    timer.current = setTimeout(() => setToast(null), action?.durationMs ?? TOAST_MS);
  }, []);
  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
        style={{ bottom: "calc(var(--nav-height) + var(--safe-bottom) + 0.75rem)" }}
      >
        {toast && (
          <div
            key={toast.id}
            className={`flex animate-fade-in items-center gap-1 rounded-xl text-sm font-medium shadow-[0_6px_24px_rgba(0,0,0,0.45)] ${toast.action ? "pointer-events-auto py-0.5 pr-1 pl-4" : "px-4 py-2.5"} ${toast.tone === "success" ? "bg-paper text-ink" : "bg-coral text-ink"}`}
          >
            {typeof toast.message === "function" ? toast.message() : localizeOwnedText(toast.message)}
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.onSelect();
                  dismiss();
                }}
                className="min-h-11 px-3 font-semibold underline underline-offset-4 active:opacity-60"
              >
                {localizeOwnedText(toast.action.label)}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
