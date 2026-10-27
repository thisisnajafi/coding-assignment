import { cn } from "@/lib/utils";

/**
 * Renders untrusted ticket text strictly as text (React escapes it).
 * Never use dangerouslySetInnerHTML for ticket content.
 * unicode-bidi: plaintext picks the direction per line, so pasted English errors read correctly.
 */
export function PlainText({ text, className }: { text: string | null | undefined; className?: string }) {
  return (
    <p dir="auto" className={cn("whitespace-pre-wrap break-words [unicode-bidi:plaintext]", className)}>
      {text ?? ""}
    </p>
  );
}
