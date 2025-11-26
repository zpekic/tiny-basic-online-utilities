import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LineNumberTextarea } from "@/components/ui/line-number-textarea";
import { HexEditor } from "@/components/ui/hex-editor";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Code2, Binary, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { type Pass1Result } from "@/lib/assembler";
import { useBinaryData } from "@/contexts/BinaryDataContext";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { AssemblePass1 } from "./AssemblePass1";
import { AssemblePass2 } from "./AssemblePass2";

export const AssemblerTool = () => {
  const [mode, setMode] = useState<"assemble" | "disassemble">("assemble");
  const [downloadFormat, setDownloadFormat] = useState<"hex" | "bin" | "vhdl">("hex");
  const [eventLog, setEventLog] = useState<string>("");
  const [pass1Result, setPass1Result] = useState<Pass1Result | null>(null);
  const [errorLines, setErrorLines] = useState<number[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [pass1Run, setPass1Run] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const { binaryData, setBinaryData, assemblyCode, setAssemblyCode, setOrgValue } = useBinaryData();

  const addLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEventLog(prev => `${prev}[${timestamp}] ${message}\n`);
  };

  const handleClearLog = () => {
    setEventLog('');
    setErrorLines([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 64 * 1024; // 64KB
    if (file.size > maxSize) {
      addLogEntry(`Error: File ${file.name} exceeds 64KB limit (${file.size} bytes)`);
      toast.error("File size exceeds 64KB limit");
      e.target.value = ""; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Store the uploaded file name (without extension)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setUploadedFileName(nameWithoutExt);
      
      if (assemblyCode.trim()) {
        // Insert at cursor position if there's existing content
        const before = assemblyCode.substring(0, cursorPosition);
        const after = assemblyCode.substring(cursorPosition);
        setAssemblyCode(before + content + after);
        addLogEntry(`Inserted file: ${file.name} (${file.size} bytes) at cursor position`);
      } else {
        // Replace all if empty
        setAssemblyCode(content);
        setOrgValue(0);
        addLogEntry(`Uploaded assembly file: ${file.name} (${file.size} bytes)`);
      }
      
      toast.success(`Loaded ${file.name}`);
    };
    reader.onerror = () => {
      addLogEntry(`Error: Failed to read file ${file.name}`);
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
      addLogEntry(`Error: File ${file.name} exceeds 64KB limit (${file.size} bytes)`);
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
        addLogEntry(`Uploaded binary file: ${file.name} (${file.size} bytes)`);
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
          addLogEntry(`Uploaded Intel HEX file: ${file.name} (${file.size} bytes)`);
          toast.success(`Loaded ${file.name}`);
        } catch (error) {
          addLogEntry(`Error: Failed to parse Intel HEX file ${file.name}`);
          toast.error("Failed to parse Intel HEX file");
        }
      };
      reader.readAsText(file);
    }
    
    reader.onerror = () => {
      addLogEntry(`Error: Failed to read file ${file.name}`);
      toast.error("Failed to read file");
    };
    
    e.target.value = "";
  };

  const handleCopy = async () => {
    if (!assemblyCode) return;
    await navigator.clipboard.writeText(assemblyCode);
    toast.success("Copied to clipboard!");
  };

  const handleDisassemblyCopy = async () => {
    let content = '';
    
    // Calculate smallest power of 2 greater than final org_value
    const finalOrg = pass1Result?.finalOrgValue ?? 0;
    let downloadSize = 1;
    while (downloadSize <= finalOrg && downloadSize < 65536) {
      downloadSize *= 2;
    }
    downloadSize = Math.min(downloadSize, 65536);
    
    if (downloadFormat === 'hex') {
      // Generate Intel HEX format
      const hexLines: string[] = [];
      const bytesPerLine = 16;
      
      for (let i = 0; i < downloadSize; i += bytesPerLine) {
        const lineData = binaryData.slice(i, i + bytesPerLine);
        const hasData = lineData.some(byte => byte !== 0);
        
        if (hasData) {
          const byteCount = Math.min(bytesPerLine, downloadSize - i);
          const address = i;
          const recordType = 0x00;
          const dataBytes = Array.from(binaryData.slice(i, i + byteCount));
          
          let checksum = byteCount + (address >> 8) + (address & 0xFF) + recordType;
          dataBytes.forEach(byte => checksum += byte);
          checksum = (0x100 - (checksum & 0xFF)) & 0xFF;
          
          const line = ':' +
            byteCount.toString(16).toUpperCase().padStart(2, '0') +
            address.toString(16).toUpperCase().padStart(4, '0') +
            recordType.toString(16).toUpperCase().padStart(2, '0') +
            dataBytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('') +
            checksum.toString(16).toUpperCase().padStart(2, '0');
          
          hexLines.push(line);
        }
      }
      hexLines.push(':00000001FF');
      content = hexLines.join('\n');
    } else if (downloadFormat === 'vhdl') {
      // Generate VHDL format using template
      const fileName = uploadedFileName || 'il';
      
      // Generate ROM data - 16 values per line
      const romLines: string[] = [];
      for (let i = 0; i < downloadSize; i++) {
        romLines.push('X"' + binaryData[i].toString(16).toUpperCase().padStart(2, '0') + '"');
      }
      
      // Format with 16 values per line
      const hexBytesLines: string[] = [];
      for (let i = 0; i < romLines.length; i += 16) {
        const chunk = romLines.slice(i, i + 16);
        const line = '\t' + chunk.join(', ') + (i + 16 < romLines.length ? ',' : '');
        hexBytesLines.push(line);
      }
      
      // Use template and replace placeholders
      const template = `----------------------------------------------------------------------------------
-- Company: https://hackaday.io/projects/hacker/233652
-- Engineer: zpekic@hotmail.com
--
-- Create Date: ${new Date().toLocaleString()}
-- Design Name:
-- Module Name: MicroBasic - Behavioral
-- Project Name:
-- Target Devices:
-- Tool versions: ISE 14.7, mcc - microcode compiler
-- Description: https://hackaday.io/project/204482-celebrating-50-years-of-tiny-basic
--
----------------------------------------------------------------------------------

library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

-- Uncomment the following library declaration if using
-- arithmetic functions with Signed or Unsigned values
use IEEE.NUMERIC_STD.ALL;

-- Uncomment the following library declaration if instantiating
-- any Xilinx primitives in this code.
--library UNISIM;
--use UNISIM.VComponents.all;

entity FILENAME_rom is
    Generic (
        ADDR_DEPTH : positive);
    Port (
        a : in  STD_LOGIC_VECTOR (10 downto 0);
        d : out  STD_LOGIC_VECTOR (7 downto 0));
end FILENAME_rom;

architecture Behavioral of FILENAME_rom is

type rom_type is array (0 to (2**ADDR_DEPTH - 1)) of std_logic_vector(7 downto 0);

-- Original from: http://www.ittybittycomputers.com/IttyBitty/TinyBasic/TinyBasic.asm
-- Create your own at: https://tiny-basic-online-utilities.lovable.app/
constant FILENAME_rom: rom_type := (
HEXBYTES
);

begin

	d <= FILENAME_rom(to_integer(unsigned(a((ADDR_DEPTH - 1) downto 0))));

end Behavioral;`;

      content = template
        .replace(/FILENAME/g, fileName)
        .replace('HEXBYTES', hexBytesLines.join('\n'));
    }
    
    if (content) {
      await navigator.clipboard.writeText(content);
      toast.success(`Copied ${downloadFormat.toUpperCase()} to clipboard!`);
    }
  };

  const handleAssemblyDownload = () => {
    if (!assemblyCode) return;
    
    const blob = new Blob([assemblyCode], { type: 'text/plain' });
    const filename = uploadedFileName ? `${uploadedFileName}.tba` : 'assembly_code.tba';
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}!`);
  };

  const handleDownload = () => {
    if (!assemblyCode && downloadFormat !== 'hex' && downloadFormat !== 'bin' && downloadFormat !== 'vhdl') return;
    
    // Calculate smallest power of 2 greater than final org_value
    const finalOrg = pass1Result?.finalOrgValue ?? 0;
    let downloadSize = 1;
    while (downloadSize <= finalOrg && downloadSize < 65536) {
      downloadSize *= 2;
    }
    downloadSize = Math.min(downloadSize, 65536);
    
    let blob: Blob;
    let filename: string;
    
    if (downloadFormat === 'hex') {
      // Generate Intel HEX format from binary data
      const hexLines: string[] = [];
      const bytesPerLine = 16;
      
      for (let i = 0; i < downloadSize; i += bytesPerLine) {
        // Skip lines with all zeros
        const lineData = binaryData.slice(i, i + bytesPerLine);
        const hasData = lineData.some(byte => byte !== 0);
        
        if (hasData) {
          const byteCount = Math.min(bytesPerLine, downloadSize - i);
          const address = i;
          const recordType = 0x00; // Data record
          
          // Build the data part
          const dataBytes = Array.from(binaryData.slice(i, i + byteCount));
          
          // Calculate checksum
          let checksum = byteCount + (address >> 8) + (address & 0xFF) + recordType;
          dataBytes.forEach(byte => checksum += byte);
          checksum = (0x100 - (checksum & 0xFF)) & 0xFF;
          
          // Format the line
          const line = ':' +
            byteCount.toString(16).toUpperCase().padStart(2, '0') +
            address.toString(16).toUpperCase().padStart(4, '0') +
            recordType.toString(16).toUpperCase().padStart(2, '0') +
            dataBytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('') +
            checksum.toString(16).toUpperCase().padStart(2, '0');
          
          hexLines.push(line);
        }
      }
      
      // Add end-of-file record
      hexLines.push(':00000001FF');
      
      blob = new Blob([hexLines.join('\n')], { type: 'text/plain' });
      filename = uploadedFileName ? `${uploadedFileName}.hex` : 'machine_code.hex';
    } else if (downloadFormat === 'bin') {
      // Export raw binary data limited to download size
      blob = new Blob([binaryData.slice(0, downloadSize)], { type: 'application/octet-stream' });
      filename = uploadedFileName ? `${uploadedFileName}.bin` : 'machine_code.bin';
    } else if (downloadFormat === 'vhdl') {
      // Generate VHDL ROM file using template
      const fileName = uploadedFileName || 'il';
      
      // Generate ROM data - 16 values per line
      const romLines: string[] = [];
      for (let i = 0; i < downloadSize; i++) {
        const value = binaryData[i];
        romLines.push('X"' + value.toString(16).toUpperCase().padStart(2, '0') + '"');
      }
      
      // Format with 16 values per line
      const hexBytesLines: string[] = [];
      for (let i = 0; i < romLines.length; i += 16) {
        const chunk = romLines.slice(i, i + 16);
        const line = '\t' + chunk.join(', ') + (i + 16 < romLines.length ? ',' : '');
        hexBytesLines.push(line);
      }
      
      // Use template and replace placeholders
      const template = `----------------------------------------------------------------------------------
-- Company: https://hackaday.io/projects/hacker/233652
-- Engineer: zpekic@hotmail.com
--
-- Create Date: ${new Date().toLocaleString()}
-- Design Name:
-- Module Name: MicroBasic - Behavioral
-- Project Name:
-- Target Devices:
-- Tool versions: ISE 14.7, mcc - microcode compiler
-- Description: https://hackaday.io/project/204482-celebrating-50-years-of-tiny-basic
--
----------------------------------------------------------------------------------

library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

-- Uncomment the following library declaration if using
-- arithmetic functions with Signed or Unsigned values
use IEEE.NUMERIC_STD.ALL;

-- Uncomment the following library declaration if instantiating
-- any Xilinx primitives in this code.
--library UNISIM;
--use UNISIM.VComponents.all;

entity FILENAME_rom is
    Generic (
        ADDR_DEPTH : positive);
    Port (
        a : in  STD_LOGIC_VECTOR (10 downto 0);
        d : out  STD_LOGIC_VECTOR (7 downto 0));
end FILENAME_rom;

architecture Behavioral of FILENAME_rom is

type rom_type is array (0 to (2**ADDR_DEPTH - 1)) of std_logic_vector(7 downto 0);

-- Original from: http://www.ittybittycomputers.com/IttyBitty/TinyBasic/TinyBasic.asm
-- Create your own at: https://tiny-basic-online-utilities.lovable.app/
constant FILENAME_rom: rom_type := (
HEXBYTES
);

begin

	d <= FILENAME_rom(to_integer(unsigned(a((ADDR_DEPTH - 1) downto 0))));

end Behavioral;`;

      const vhdlContent = template
        .replace(/FILENAME/g, fileName)
        .replace('HEXBYTES', hexBytesLines.join('\n'));
      
      blob = new Blob([vhdlContent], { type: 'text/plain' });
      filename = uploadedFileName ? `${uploadedFileName}.vhd` : 'il_rom.vhd';
    } else {
      // Default: download assembly code
      blob = new Blob([assemblyCode], { type: 'text/plain' });
      filename = uploadedFileName ? `${uploadedFileName}.asm` : 'assembly_code.asm';
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}!`);
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
          <PanelGroup direction="horizontal" className="gap-2">
            <Panel defaultSize={50} minSize={30}>
              <Card className="p-6 bg-card border-code-border h-full">
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
                          accept=".tba"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  </div>
                  <LineNumberTextarea
                    value={assemblyCode}
                    onChange={(e) => {
                      setAssemblyCode(e.target.value);
                      setCursorPosition(e.target.selectionStart);
                      setPass1Run(false);
                    }}
                    onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                    placeholder="Upload or enter TBIL assembly code here..."
                    className="font-mono text-sm bg-code-bg border-code-border"
                    errorLines={errorLines}
                  />
                </div>
              </Card>
            </Panel>

            <PanelResizeHandle className="w-2 bg-border hover:bg-primary/20 transition-colors rounded-sm" />

            <Panel defaultSize={50} minSize={30}>
              <Card className="p-6 bg-card border-code-border h-full">
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
            </Panel>
          </PanelGroup>

          <Card className="p-6 bg-card border-code-border">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary">Assembly Tools</h3>
              <div className="flex gap-3">
                <AssemblePass1
                  assemblyCode={assemblyCode}
                  onPass1Complete={(result) => {
                    setPass1Result(result);
                    setPass1Run(true);
                  }}
                  onLogEntry={addLogEntry}
                  onErrorLinesChange={setErrorLines}
                  onOrgValueChange={setOrgValue}
                />
                <AssemblePass2
                  assemblyCode={assemblyCode}
                  pass1Result={pass1Result}
                  onBinaryDataChange={setBinaryData}
                  onLogEntry={addLogEntry}
                  onOrgValueChange={setOrgValue}
                />
                <Button variant="outline" className="gap-2" onClick={handleCopy} disabled={!assemblyCode}>
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleAssemblyDownload} disabled={!assemblyCode}>
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Event Log</h4>
                <Textarea
                  value={eventLog}
                  readOnly
                  placeholder="Events will be logged here..."
                  className="font-mono text-xs h-40 bg-code-bg border-code-border resize-none"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="disassemble" className="space-y-4 mt-6">
          <PanelGroup direction="horizontal" className="gap-2">
            <Panel defaultSize={50} minSize={30}>
              <Card className="p-6 bg-card border-code-border h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-accent">Machine Code</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 text-xs gap-2"
                    >
                      <label htmlFor="file-upload-binary-disassemble" className="cursor-pointer">
                        <Upload className="w-3 h-3" />
                        Upload Binary or Hex File
                        <input
                          id="file-upload-binary-disassemble"
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
                    className="w-full"
                  />
                </div>
              </Card>
            </Panel>

            <PanelResizeHandle className="w-2 bg-border hover:bg-primary/20 transition-colors rounded-sm" />

            <Panel defaultSize={50} minSize={30}>
              <Card className="p-6 bg-card border-code-border h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-primary">Assembly Code</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 text-xs gap-2"
                    >
                      <label htmlFor="file-upload-assemble-disassemble" className="cursor-pointer">
                        <Upload className="w-3 h-3" />
                        Upload Source File
                        <input
                          id="file-upload-assemble-disassemble"
                          type="file"
                          accept=".tba"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  </div>
                  <LineNumberTextarea
                    value={assemblyCode}
                    onChange={(e) => setAssemblyCode(e.target.value)}
                    placeholder="Enter assembly code here..."
                    className="font-mono text-sm bg-code-bg border-code-border"
                  />
                </div>
              </Card>
            </Panel>
          </PanelGroup>

          <Card className="p-6 bg-card border-code-border">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary">Disassembly Tools</h3>
              <div className="flex gap-3 items-center">
                <Button variant="outline" className="gap-2" onClick={handleDisassemblyCopy} disabled={downloadFormat === 'bin'}>
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
                <Select value={downloadFormat} onValueChange={(value: "hex" | "bin" | "vhdl") => setDownloadFormat(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border z-50">
                    <SelectItem value="hex">.hex</SelectItem>
                    <SelectItem value="bin">.bin</SelectItem>
                    <SelectItem value="vhdl">.vhdl</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2" onClick={handleDownload} disabled={downloadFormat === 'hex' || downloadFormat === 'bin' || downloadFormat === 'vhdl' ? false : !assemblyCode}>
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};