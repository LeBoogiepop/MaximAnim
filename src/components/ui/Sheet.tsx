"use client";

import { ui, localizeOwnedText } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { Button, IconButton } from "./Button";
import { attachSheetDrag, SHEET_GRIP_ATTR, type SheetDragFrom } from "./sheet-drag";

/**
 * Bottom sheet built on the native <dialog>: focus trapping, Escape and
 * top-layer rendering come from the platform instead of a library.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  height,
  maxHeight = "88dvh",
  dragFrom = "handle+content",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * A fixed share of the screen (a CSS length such as `78dvh`) instead of content height, for long lists. Never
   * taller than the screen below the notch, so the rounded top corners stay visible.
   */
  height?: string;
  /** A content-height sheet stops here (default 88dvh). */
  maxHeight?: string;
  /** `handle`: a swipe-to-dismiss starts from the grabber / title bar only — for a body made of sliders and switches. */
  dragFrom?: SheetDragFrom;
}) {
  useInterfaceLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // The native "close" event also fires when *we* close the dialog because `open`
  // went false — e.g. one sheet handing over to the next. Only a close the parent
  // did not ask for (Escape, form method=dialog…) is reported back.
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const tall = height != null;
  // Sized against the dynamic viewport, capped below the notch: the list uses the height the phone really has.
  const fixedHeight = tall ? `min(${height}, calc(100dvh - var(--safe-top) - 0.75rem))` : undefined;

  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    // A reopened sheet starts clean, whatever a previous swipe left on it.
    dialog.style.transform = "";
    dialog.style.transition = "";
    return attachSheetDrag(dialog, () => onCloseRef.current(), dragFrom);
  }, [open, dragFrom]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => openRef.current && onClose()}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the dialog box itself (not its content) is a backdrop tap.
        if (e.target === e.currentTarget) onClose();
      }}
      style={fixedHeight ? { height: fixedHeight } : { maxHeight }}
      className={`m-0 mt-auto w-full max-w-none overflow-hidden rounded-t-[22px] border border-b-0 border-line bg-raised p-0 text-paper backdrop:bg-black/60 open:animate-sheet-in sm:mx-auto sm:mb-6 sm:max-w-md sm:rounded-[20px] sm:border-b`}
    >
      {open && (
        <div className="flex flex-col" style={{ paddingBottom: "max(1rem, var(--safe-bottom))", ...(tall ? { height: "100%" } : { maxHeight }) }}>
          <div {...{ [SHEET_GRIP_ATTR]: "" }} className="flex justify-center py-3.5" aria-hidden="true">
            <div className="h-1.5 w-10 rounded-full bg-line" />
          </div>
          <header {...{ [SHEET_GRIP_ATTR]: "" }} className={`flex items-center justify-between gap-3 px-5 pb-3`}>
            <h2 id={titleId} className="text-[17px] font-semibold">
              {title}
            </h2>
            <IconButton label={ui("Fermer")} variant="ghost" onClick={onClose} className="-mr-2">
              <X size={22} aria-hidden="true" />
            </IconButton>
          </header>
          {/* Initial focus lands on the body, not on the close button (no stray ring on open). */}
          <div tabIndex={-1} autoFocus className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 outline-none">
            {children}
          </div>
          {footer && <div className="px-5 pt-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  danger = false,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
}) {
  useInterfaceLanguage();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" block onClick={onClose}>
            {ui("Annuler la confirmation")}</Button>
          <Button variant={danger ? "danger" : "primary"} block onClick={onConfirm} disabled={busy}>
            {localizeOwnedText(confirmLabel)}
          </Button>
        </div>
      }
    >
      <div className="text-[15px] text-soft">{typeof message === "string" ? localizeOwnedText(message) : message}</div>
    </Sheet>
  );
}
