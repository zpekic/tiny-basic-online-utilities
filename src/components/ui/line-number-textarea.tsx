import * as React from "react";
import { cn } from "@/lib/utils";

export interface LineNumberTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const LineNumberTextarea = React.forwardRef<
  HTMLTextAreaElement,
  LineNumberTextareaProps
>(({ className, value, onChange, ...props }, ref) => {
  const [lineCount, setLineCount] = React.useState(1);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useImperativeHandle(ref, () => textareaRef.current!);

  React.useEffect(() => {
    const text = String(value || "");
    const lines = text.split("\n").length;
    setLineCount(lines || 1);
  }, [value]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbers = document.getElementById("line-numbers");
    if (lineNumbers) {
      lineNumbers.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="relative flex w-full">
      <div
        id="line-numbers"
        className="select-none overflow-hidden text-right pr-3 py-2 text-sm font-mono text-muted-foreground/50 bg-code-bg border-r border-code-border"
        style={{
          minHeight: "400px",
          maxHeight: "400px",
          overflowY: "hidden",
          lineHeight: "1.5",
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1} className="leading-[1.5]">
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
