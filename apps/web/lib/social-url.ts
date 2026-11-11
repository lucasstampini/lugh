import { z } from "zod";

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function hostMatches(url: string, host: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "") === host;
  } catch {
    return false;
  }
}

export function optionalSocialUrl(host: string, hostMessage: string) {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value, ctx) => {
      if (!value) {
        return null;
      }
      const url = normalizeUrl(value);
      if (!hostMatches(url, host)) {
        ctx.addIssue({ code: "custom", message: hostMessage });
        return z.NEVER;
      }
      return url;
    });
}
