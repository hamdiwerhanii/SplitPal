import { describe, expect, it } from "vitest";
import ar from "@/i18n/locales/ar.json";
import en from "@/i18n/locales/en.json";
import fr from "@/i18n/locales/fr.json";

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

const keysOf = (value: object, prefix = ""): string[] =>
  Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === "object"
      ? keysOf(child, `${prefix}${key}.`)
      : [`${prefix}${key.replace(PLURAL_SUFFIX, "")}`],
  );

const unique = (keys: string[]) => [...new Set(keys)].sort();

describe("translations", () => {
  const english = unique(keysOf(en));

  it.each([
    ["fr", fr],
    ["ar", ar],
  ])("%s has exactly the same keys as en", (_name, locale) => {
    expect(unique(keysOf(locale))).toEqual(english);
  });

  it("has no dotted leaf keys, which i18next would read as nesting", () => {
    for (const locale of [en, fr, ar]) {
      for (const section of Object.values(locale)) {
        expect(Object.keys(section).every((key) => !key.includes("."))).toBe(true);
      }
    }
  });
});
