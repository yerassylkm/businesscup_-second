"use client";

import { useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Copies plain text to the clipboard with a visible, announced confirmation.
 * If the browser blocks clipboard access, the text is shown for manual copying.
 */
export function CopyShareTextButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div>
      <Button variant="outline" size="sm" onClick={copy}>
        {status === "copied" ? <Check className="size-3.5 text-mint" aria-hidden /> : <ClipboardCopy className="size-3.5" aria-hidden />}
        {status === "copied" ? "Copied" : "Copy share text"}
      </Button>
      <p role="status" aria-live="polite" className="mt-1.5 min-h-[1rem] text-xs text-mint">
        {status === "copied" ? "Copied to your clipboard." : ""}
      </p>
      {status === "failed" && (
        <div className="mt-2">
          <label htmlFor="share-text-fallback" className="text-xs text-amber">
            Your browser blocked copying. Select and copy the text below:
          </label>
          <textarea id="share-text-fallback" readOnly className="input mt-1 text-xs" rows={5} value={text} onFocus={(e) => e.currentTarget.select()} />
        </div>
      )}
    </div>
  );
}
