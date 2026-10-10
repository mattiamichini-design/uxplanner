"use client";

import messages from "../../messages/en.json";

export function useTranslations(namespace: string) {
  return (key: string) => {
    const value = `${namespace}.${key}`
      .split(".")
      .reduce<unknown>((current, part) =>
        current && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined, messages);

    return typeof value === "string" ? value : key;
  };
}
