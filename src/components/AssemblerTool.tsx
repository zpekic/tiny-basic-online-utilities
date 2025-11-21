import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ArrowLeftRight, Trash2, Code2, Binary } from "lucide-react";
import { toast } from "sonner";
import { assemble, disassemble } from "@/lib/assembler";

export const AssemblerTool = () => {
  const [mode, setMode] = useState<"assemble" | "disassemble">("assemble");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const exampleAssembly = `MOV R0, #5
ADD R1, R0, #3
SUB R2, R1, R0
MUL R3, R1, R2
STR R3, [R4]
LDR R5, [R4]`;

  const exampleMachineCode = `E3A00005
E2811003
E0412000
E0031192
E5843000
E5945000`;

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

  const loadExample = () => {
    setInput(mode === "assemble" ? exampleAssembly : exampleMachineCode);
    setOutput("");
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
                    onClick={loadExample}
                    className="h-8 text-xs"
                  >
                    Load Example
                  </Button>
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter assembly code here...&#10;&#10;Example:&#10;MOV R0, #5&#10;ADD R1, R0, #3"
                  className="min-h-[400px] font-mono text-sm bg-code-bg border-code-border resize-none"
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
                    onClick={loadExample}
                    className="h-8 text-xs"
                  >
                    Load Example
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
                  placeholder="Assembly code will appear here..."
                  className="min-h-[400px] font-mono text-sm bg-code-bg border-code-border resize-none text-accent"
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
