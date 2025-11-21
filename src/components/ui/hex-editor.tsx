import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface HexEditorProps {
  data: Uint8Array;
  onChange?: (data: Uint8Array) => void;
  className?: string;
  readOnly?: boolean;
}

const HexEditor = React.forwardRef<HTMLDivElement, HexEditorProps>(
  ({ data, onChange, className, readOnly = false }, ref) => {
    const [selectedByte, setSelectedByte] = React.useState<number | null>(null);
    const bytesPerRow = 16;
    const rows = Math.ceil(data.length / bytesPerRow);

    const handleByteClick = (index: number) => {
      if (!readOnly) {
        setSelectedByte(index);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      if (readOnly) return;

      const hexChar = e.key.toUpperCase();
      if (!/^[0-9A-F]$/.test(hexChar)) return;

      e.preventDefault();
      const newData = new Uint8Array(data);
      const currentValue = data[index];
      const hexString = currentValue.toString(16).padStart(2, "0");
      
      // Replace the second hex digit, then shift
      const newHexString = hexString[1] + hexChar;
      newData[index] = parseInt(newHexString, 16);
      
      onChange?.(newData);
      
      // Move to next byte
      if (index < data.length - 1) {
        setSelectedByte(index + 1);
      }
    };

    const toAscii = (byte: number): string => {
      return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
    };

    return (
      <div ref={ref} className={cn("hex-editor", className)}>
        <ScrollArea className="h-[400px] w-full border border-input rounded-md bg-code-bg">
          <div className="font-mono text-xs">
            {/* Header */}
            <div className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border px-2 py-1 flex gap-2">
              <div className="w-20 text-muted-foreground">Offset</div>
              <div className="flex gap-2 flex-1">
                {Array.from({ length: bytesPerRow }).map((_, i) => (
                  <span key={i} className="w-6 text-center text-muted-foreground">
                    {i.toString(16).toUpperCase()}
                  </span>
                ))}
              </div>
              <div className="w-40 text-muted-foreground pl-2">ASCII</div>
            </div>

            {/* Data rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => {
              const offset = rowIndex * bytesPerRow;
              const rowBytes = data.slice(offset, offset + bytesPerRow);

              return (
                <div key={rowIndex} className="flex gap-2 px-2 py-0.5 hover:bg-muted/50">
                  {/* Offset */}
                  <div className="w-20 text-muted-foreground">
                    {offset.toString(16).padStart(8, "0").toUpperCase()}
                  </div>

                  {/* Hex bytes */}
                  <div className="flex gap-2 flex-1">
                    {Array.from({ length: bytesPerRow }).map((_, colIndex) => {
                      const byteIndex = offset + colIndex;
                      const byte = rowBytes[colIndex];
                      const isSelected = selectedByte === byteIndex;

                      if (byteIndex >= data.length) {
                        return <span key={colIndex} className="w-6" />;
                      }

                      return (
                        <span
                          key={colIndex}
                          className={cn(
                            "w-6 text-center cursor-pointer transition-colors",
                            isSelected && "bg-primary text-primary-foreground rounded",
                            !readOnly && "hover:bg-accent hover:text-accent-foreground",
                            readOnly && "cursor-default"
                          )}
                          onClick={() => handleByteClick(byteIndex)}
                          onKeyDown={(e) => handleKeyDown(e, byteIndex)}
                          tabIndex={readOnly ? -1 : 0}
                        >
                          {byte !== undefined ? byte.toString(16).padStart(2, "0").toUpperCase() : ""}
                        </span>
                      );
                    })}
                  </div>

                  {/* ASCII */}
                  <div className="w-40 text-muted-foreground pl-2">
                    {Array.from(rowBytes).map((byte, i) => toAscii(byte)).join("")}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

HexEditor.displayName = "HexEditor";

export { HexEditor };
