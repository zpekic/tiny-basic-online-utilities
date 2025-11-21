import { AssemblerTool } from "@/components/AssemblerTool";
import { Cpu, Github, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TBOU</h1>
                <p className="text-xs text-muted-foreground">Tiny Basic Online Utilities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => window.open("https://hackaday.io/project/204482-celebrating-50-years-of-tiny-basic", "_blank")}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Docs</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => window.open("https://github.com/zpekic/Sys_MicroBasic", "_blank")}
              >
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Info Banner */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cpu className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-sm">Supported Instructions</h3>
                <p className="text-sm text-muted-foreground">
                  MOV, ADD, SUB, MUL, LDR, STR • Registers: R0-R15 • Immediate values: #0-255
                </p>
              </div>
            </div>
          </div>

          {/* Tool */}
          <AssemblerTool />

          {/* Info Section */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 text-primary">Assembly Format</h4>
              <p className="text-xs text-muted-foreground">
                Write one instruction per line. Use standard ARM-like syntax with registers (R0-R15) and immediate values (#0-255).
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 text-accent">Machine Code Format</h4>
              <p className="text-xs text-muted-foreground">
                Enter hexadecimal machine code (8 characters per line). Each line represents a 32-bit encoded instruction.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 text-success">Quick Tips</h4>
              <p className="text-xs text-muted-foreground">
                Use Load Example to see sample code. Comments starting with ; are ignored in assembly mode.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Educational assembler/disassembler tool • Simplified ARM-like instruction set
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
