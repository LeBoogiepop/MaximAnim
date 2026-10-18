"use client";
import { useSyncExternalStore } from "react";
import { DEFAULT_LANGUAGE, interfaceLanguage, subscribeLanguage } from "./language";

export function useInterfaceLanguage() {
  return useSyncExternalStore(subscribeLanguage, interfaceLanguage, () => DEFAULT_LANGUAGE);
}
