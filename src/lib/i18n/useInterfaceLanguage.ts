"use client";
import { useSyncExternalStore } from "react";
import { interfaceLanguage, subscribeLanguage } from "./language";

export function useInterfaceLanguage() {
  return useSyncExternalStore(subscribeLanguage, interfaceLanguage, () => "fr" as const);
}
