import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LineNumberTextarea } from "@/components/ui/line-number-textarea";
import { HexEditor } from "@/components/ui/hex-editor";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ArrowLeftRight, Trash2, Code2, Binary, Upload } from "lucide-react";
import { toast } from "sonner";
import { assemble, disassemble } from "@/lib/assembler";
import { useBinaryData } from "@/contexts/BinaryDataContext";

export const AssemblerTool = () => {
  const [mode, setMode] = useState<"assemble" | "disassemble">("assemble");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { binaryData, setBinaryData, assemblyCode, setAssemblyCode } = useBinaryData();

  // Sync binary data with output when in assemble mode
  useEffect(() => {
    if (mode === "assemble" && output) {
      const newData = new Uint8Array(65536);
      const lines = output.split("\n").filter(line => line.trim());
      lines.forEach((line, index) => {
        const hexValue = parseInt(line.trim(), 16);
        if (!isNaN(hexValue) && index * 4 < 65536) {
          // Store as 4 bytes (32-bit instruction)
          newData[index * 4] = (hexValue >> 24) & 0xFF;
          newData[index * 4 + 1] = (hexValue >> 16) & 0xFF;
          newData[index * 4 + 2] = (hexValue >> 8) & 0xFF;
          newData[index * 4 + 3] = hexValue & 0xFF;
        }
      });
      setBinaryData(newData);
    }
  }, [output, mode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 64 * 1024; // 64KB
    if (file.size > maxSize) {
      toast.error("File size exceeds 64KB limit");
      e.target.value = ""; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAssemblyCode(content);
      setOutput("");
      toast.success(`Loaded ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
    
    // Reset input to allow re-uploading the same file
    e.target.value = "";
  };

  const handleBinaryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 64 * 1024; // 64KB
    if (file.size > maxSize) {
      toast.error("File size exceeds 64KB limit");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    
    if (file.name.endsWith('.bin')) {
      // Read as binary
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const fileData = new Uint8Array(arrayBuffer);
        const newData = new Uint8Array(65536);
        newData.set(fileData.slice(0, Math.min(fileData.length, 65536)));
        setBinaryData(newData);
        toast.success(`Loaded ${file.name} (${fileData.length} bytes)`);
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.hex')) {
      // Read as Intel HEX format
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newData = new Uint8Array(65536);
        
        try {
          const lines = content.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith(':')) continue;
            
            const byteCount = parseInt(trimmed.substring(1, 3), 16);
            const address = parseInt(trimmed.substring(3, 7), 16);
            const recordType = parseInt(trimmed.substring(7, 9), 16);
            
            if (recordType === 0) { // Data record
              for (let i = 0; i < byteCount; i++) {
                const byteValue = parseInt(trimmed.substring(9 + i * 2, 11 + i * 2), 16);
                if (address + i < 65536) {
                  newData[address + i] = byteValue;
                }
              }
            }
          }
          setBinaryData(newData);
          toast.success(`Loaded ${file.name}`);
        } catch (error) {
          toast.error("Failed to parse Intel HEX file");
        }
      };
      reader.readAsText(file);
    }
    
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    
    e.target.value = "";
  };

  const handleConvert = () => {
    try {
      if (mode === "assemble") {
        const result = assemble(input);
        setOutput(result);
        toast.success("Assembly code converted to machine code!");
      } else {
        const result = disassemble(input);
        setOutput(result);
        toast.success("Machine code disassembled successfully!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Conversion failed");
      setOutput("");
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    toast("Cleared");
  };

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="assemble" className="gap-2">
            <Code2 className="w-4 h-4" />
            Assemble
          </TabsTrigger>
          <TabsTrigger value="disassemble" className="gap-2">
            <Binary className="w-4 h-4" />
            Disassemble
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assemble" className="space-y-4 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-card border-code-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-primary">Assembly Code</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 text-xs gap-2"
                  >
                    <label htmlFor="file-upload-assemble" className="cursor-pointer">
                      <Upload className="w-3 h-3" />
                      Upload Source File
                      <input
                        id="file-upload-assemble"
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
                <LineNumberTextarea
                  value={assemblyCode}
                  onChange={(e) => setAssemblyCode(e.target.value)}
                  placeholder="Enter assembly code here...&#10;&#10;Example:&#10;MOV R0, #5&#10;ADD R1, R0, #3"
                  className="font-mono text-sm bg-code-bg border-code-border"
                />
              </div>
            </Card>

            <Card className="p-6 bg-card border-code-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-accent">Machine Code</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 text-xs gap-2"
                  >
                    <label htmlFor="file-upload-binary" className="cursor-pointer">
                      <Upload className="w-3 h-3" />
                      Upload Binary or Hex File
                      <input
                        id="file-upload-binary"
                        type="file"
                        accept=".bin,.hex"
                        onChange={handleBinaryFileUpload}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
                <HexEditor
                  data={binaryData}
                  onChange={setBinaryData}
                  readOnly
                  className="w-full"
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="disassemble" className="space-y-4 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-card border-code-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-accent">Machine Code</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 text-xs gap-2"
                  >
                    <label htmlFor="file-upload-hex" className="cursor-pointer">
                      <Upload className="w-3 h-3" />
                      Upload Source File
                      <input
                        id="file-upload-hex"
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter machine code here...&#10;&#10;Example:&#10;E3A00005&#10;E2811003"
                  className="min-h-[400px] font-mono text-sm bg-code-bg border-code-border resize-none"
                />
              </div>
            </Card>

            <Card className="p-6 bg-card border-code-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-primary">Assembly Code</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 text-xs gap-2"
                    >
                      <label htmlFor="file-upload-disassemble" className="cursor-pointer">
                        <Upload className="w-3 h-3" />
                        Upload
                        <input
                          id="file-upload-disassemble"
                          type="file"
                          accept=".hex,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      disabled={!output}
                      className="h-8 gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                  </div>
                </div>
                <LineNumberTextarea
                  value={assemblyCode}
                  readOnly
                  placeholder="Assembly code will appear here..."
                  className="font-mono text-sm bg-code-bg border-code-border text-accent"
                />
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};