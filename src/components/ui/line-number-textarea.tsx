import * as React from "react";
import { cn } from "@/lib/utils";

export interface LineNumberTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  errorLines?: number[];
  highlightedLine?: number | null;
}

const LineNumberTextarea = React.forwardRef<
  HTMLTextAreaElement,
  LineNumberTextareaProps
>(({ className, value, onChange, errorLines = [], highlightedLine, ...props }, ref) => {
  const [lineCount, setLineCount] = React.useState(1);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => textareaRef.current!);

  React.useEffect(() => {
    const text = String(value || "");
    const lines = text.split("\n").length;
    setLineCount(lines || 1);
  }, [value]);

  // Scroll to highlighted line when it changes
  React.useEffect(() => {
    if (highlightedLine && textareaRef.current && lineNumbersRef.current) {
      const lineHeight = 24; // 1.5 line-height * 16px (text-sm)
      const scrollTop = (highlightedLine - 1) * lineHeight - 100; // Center the line
      textareaRef.current.scrollTop = Math.max(0, scrollTop);
      lineNumbersRef.current.scrollTop = Math.max(0, scrollTop);
    }
  }, [highlightedLine]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="relative flex w-full">
      <div
        ref={lineNumbersRef}
        className="select-none overflow-hidden text-right pr-3 py-2 text-sm font-mono text-muted-foreground/50 bg-code-bg border-r border-code-border"
        style={{
          minHeight: "400px",
          maxHeight: "400px",
          overflowY: "hidden",
          lineHeight: "1.5",
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div 
            key={i + 1} 
            className={cn(
              "leading-[1.5] px-2",
              errorLines.includes(i + 1) && "bg-destructive/20 text-destructive font-semibold",
              highlightedLine === i + 1 && "bg-primary/30 text-primary font-semibold"
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className={cn(
          "flex flex-1 min-h-[400px] rounded-md rounded-l-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-auto whitespace-pre",
          className
        )}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        style={{ lineHeight: "1.5" }}
        {...props}
      />
    </div>
  );
});

LineNumberTextarea.displayName = "LineNumberTextarea";

export { LineNumberTextarea };
