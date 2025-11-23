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
                <h1 className="text-xl font-bold text-foreground">Tiny Basic Online Utilities</h1>
                <p className="text-xs text-muted-foreground">
                  Companion to{' '}
                  <a 
                    href="https://hackaday.io/project/204482-celebrating-50-years-of-tiny-basic" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    'Celebrating 50 years of Tiny Basic'
                  </a>
                </p>
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
                  Any valid Tiny Basic intermediate language instruction, see{" "}
                  <a 
                    href="http://www.ittybittycomputers.com/IttyBitty/TinyBasic/TBEK.txt" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    here
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Tool */}
          <AssemblerTool />

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Educational assembler/disassembler tool • Tiny Basic intermediate language instructions
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
