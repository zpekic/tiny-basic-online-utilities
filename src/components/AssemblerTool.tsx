import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LineNumberTextarea } from "@/components/ui/line-number-textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ArrowLeftRight, Trash2, Code2, Binary, Upload } from "lucide-react";
import { toast } from "sonner";
import { assemble, disassemble } from "@/lib/assembler";

export const AssemblerTool = () => {
  const [mode, setMode] = useState<"assemble" | "disassemble">("assemble");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

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
      setInput(content);
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
                      Upload File
                      <input
                        id="file-upload-assemble"
                        type="file"
                        accept=".asm,.s,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
                <LineNumberTextarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter assembly code here...&#10;&#10;Example:&#10;MOV R0, #5&#10;ADD R1, R0, #3"
                  className="font-mono text-sm bg-code-bg border-code-border"
                />
              </div>
            </Card>

            <Card className="p-6 bg-card border-code-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-accent">Machine Code (Hex)</h3>
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
                <Textarea
                  value={output}
                  readOnly
                  placeholder="Machine code will appear here..."
                  className="min-h-[400px] font-mono text-sm bg-code-bg border-code-border resize-none text-accent"
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
                  <h3 className="text-sm font-semibold text-primary">Machine Code (Hex)</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 text-xs gap-2"
                  >
                    <label htmlFor="file-upload-hex" className="cursor-pointer">
                      <Upload className="w-3 h-3" />
                      Upload File
                      <input
                        id="file-upload-hex"
                        type="file"
                        accept=".hex,.txt"
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
                  <h3 className="text-sm font-semibold text-accent">Assembly Code</h3>
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
                  value={output}
                  readOnly
                  placeholder="Assembly code will appear here..."
                  className="font-mono text-sm bg-code-bg border-code-border text-accent"
                />
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center gap-3">
        <Button
          onClick={handleConvert}
          disabled={!input}
          size="lg"
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Convert
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
      </div>
    </div>
  );
};
