import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LineNumberTextarea } from "@/components/ui/line-number-textarea";
import { HexEditor } from "@/components/ui/hex-editor";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, ArrowLeftRight, Trash2, Code2, Binary, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { pass1, pass2, type Pass1Result, type Pass2Result } from "@/lib/assembler";
import { useBinaryData } from "@/contexts/BinaryDataContext";
import { validateCode } from "@/lib/validator";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

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

  const handlePass1 = () => {
    // Clear event log and error lines
    setEventLog('');
    setErrorLines([]);
    
    // Set org_value to 0
    setOrgValue(0);
    
    addLogEntry('Starting Pass 1...');
    addLogEntry('org_value set to 0');
    addLogEntry('pass1_errorcount set to 0');
    
    // Run Pass 1
    const result = pass1(assemblyCode);
    setPass1Result(result);
    
    // Extract error line numbers from error messages
    const errorLineNumbers: number[] = [];
    result.errors.forEach(error => {
      const match = error.match(/line (\d+)/);
      if (match) {
        errorLineNumbers.push(parseInt(match[1]));
      }
    });
    setErrorLines(errorLineNumbers);
    
    // Display label dictionary
    addLogEntry('--- Label Dictionary ---');
    const labels = Object.entries(result.labelDictionary);
    if (labels.length === 0) {
      addLogEntry('(no labels found)');
    } else {
      labels.forEach(([label, entry]) => {
        const hexValue = entry.org_value.toString(16).toUpperCase().padStart(4, '0');
        addLogEntry(`${label}: line=${entry.line_number}, org=${entry.org_value} (0x${hexValue})`);
      });
    }
    
    // Display errors if any
    if (result.errors.length > 0) {
      addLogEntry('--- Errors ---');
      result.errors.forEach(error => {
        addLogEntry(error);
      });
    }
    
    // Display error count
    addLogEntry(`--- Pass 1 Complete ---`);
    addLogEntry(`pass1_errorcount: ${result.errorCount}`);
    const hexOrgValue = result.finalOrgValue.toString(16).toUpperCase().padStart(4, '0');
    addLogEntry(`final org_value: ${result.finalOrgValue} (0x${hexOrgValue})`);
    
    if (result.errorCount === 0) {
      toast.success('Pass 1 completed successfully');
    } else {
      toast.error(`Pass 1 completed with ${result.errorCount} error(s)`);
    }
    
    // Set pass1_run to true at the end
    setPass1Run(true);
  };

  const handlePass2 = () => {
    if (!pass1Result) {
      toast.error('Must run Pass 1 first');
      return;
    }
    
    // Set org_value to 0
    setOrgValue(0);
    
    addLogEntry('Starting Pass 2...');
    addLogEntry('org_value set to 0');
    addLogEntry('pass2_errorcount set to 0');
    
    // Run Pass 2
    const result = pass2(assemblyCode, pass1Result.labelDictionary);
    
    // Update binary data with machine code
    setBinaryData(result.machineCode);
    
    // Display errors if any
    if (result.errors.length > 0) {
      addLogEntry('--- Errors ---');
      result.errors.forEach(error => {
        addLogEntry(error);
      });
    }
    
    // Display error count
    addLogEntry(`--- Pass 2 Complete ---`);
    addLogEntry(`pass2_errorcount: ${result.errorCount}`);
    addLogEntry(`final org_value: ${result.finalOrgValue}`);
    
    if (result.errorCount === 0) {
      toast.success('Pass 2 completed successfully');
    } else {
      toast.error(`Pass 2 completed with ${result.errorCount} error(s)`);
    }
  };

  // Auto-assemble when assembly code changes (commented out for now)
  /*
  useEffect(() => {
    if (mode === "assemble" && assemblyCode.trim()) {
      // First validate the code
      const validationErrors = validateCode(assemblyCode);
      
      if (validationErrors.length > 0) {
        // Log all validation errors
        validationErrors.forEach(error => {
          addLogEntry(`Error on line ${error.line}: ${error.message}`);
        });
        
        // Show toast for first error
        toast.error(`Validation failed: ${validationErrors[0].message}`);
        return;
      }
      
      try {
        const machineCode = assemble(assemblyCode);
        const newData = new Uint8Array(65536);
        const lines = machineCode.split("\n").filter(line => line.trim());
        lines.forEach((line, index) => {
          const hexValue = parseInt(line.trim(), 16);
          if (!isNaN(hexValue) && index * 4 < 65536) {
            newData[index * 4] = (hexValue >> 24) & 0xFF;
            newData[index * 4 + 1] = (hexValue >> 16) & 0xFF;
            newData[index * 4 + 2] = (hexValue >> 8) & 0xFF;
            newData[index * 4 + 3] = hexValue & 0xFF;
          }
        });
        setBinaryData(newData);
        addLogEntry('Assembly completed successfully');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        addLogEntry(`Assembly error: ${errorMsg}`);
        toast.error(`Assembly failed: ${errorMsg}`);
      }
    }
  }, [assemblyCode, mode]);
  */

  // Auto-disassemble when binary data changes in disassemble mode (disabled for now)
  /*
  useEffect(() => {
    if (mode === "disassemble") {
      try {
        const hexLines: string[] = [];
        for (let i = 0; i < 65536; i += 4) {
          const instruction = (binaryData[i] << 24) | (binaryData[i + 1] << 16) | 
                            (binaryData[i + 2] << 8) | binaryData[i + 3];
          if (instruction !== 0) {
            hexLines.push(instruction.toString(16).toUpperCase().padStart(8, '0'));
          }
        }
        if (hexLines.length > 0) {
          const disassembled = disassemble(hexLines.join("\n"));
          setAssemblyCode(disassembled);
        }
      } catch (error) {
        addLogEntry(`Disassembly error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [binaryData, mode]);
  */

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
      // Generate VHDL format
      const vhdlLines: string[] = [];
      vhdlLines.push('----------------------------------------------------------------------------------');
      vhdlLines.push('-- Generated VHDL ROM file');
      vhdlLines.push('-- Create Date: ' + new Date().toLocaleString());
      vhdlLines.push('----------------------------------------------------------------------------------');
      vhdlLines.push('library IEEE;');
      vhdlLines.push('use IEEE.STD_LOGIC_1164.ALL;');
      vhdlLines.push('use IEEE.NUMERIC_STD.ALL;');
      vhdlLines.push('');
      vhdlLines.push('entity il_rom is');
      
      // Calculate VHDL bit width based on download size
      const addrBits = Math.ceil(Math.log2(downloadSize));
      vhdlLines.push(`    Port ( a : in  STD_LOGIC_VECTOR (${addrBits - 1} downto 0);`);
      vhdlLines.push('           d : out  STD_LOGIC_VECTOR (7 downto 0);');
      vhdlLines.push('           a_valid: out STD_LOGIC);');
      vhdlLines.push('end il_rom;');
      vhdlLines.push('');
      vhdlLines.push('architecture Behavioral of il_rom is');
      vhdlLines.push('');
      vhdlLines.push(`type rom_array is array (0 to ${downloadSize - 1}) of STD_LOGIC_VECTOR(7 downto 0);`);
      vhdlLines.push('constant il_rom: rom_array := (');
      
      const romLines: string[] = [];
      for (let i = 0; i < downloadSize; i++) {
        const value = binaryData[i];
        romLines.push('X"' + value.toString(16).toUpperCase().padStart(2, '0') + '"');
      }
      
      for (let i = 0; i < romLines.length; i += 15) {
        const chunk = romLines.slice(i, i + 15);
        vhdlLines.push('\t\t' + chunk.join(', ') + (i + 15 < romLines.length ? ',' : ''));
      }
      
      vhdlLines.push(');');
      vhdlLines.push('');
      vhdlLines.push('begin');
      vhdlLines.push('');
      vhdlLines.push(`\td <= il_rom(to_integer(unsigned(a(${addrBits - 1} downto 0))));`);
      vhdlLines.push(`\ta_valid <= '1' when (unsigned(a) < ${downloadSize}) else '0';`);
      vhdlLines.push('');
      vhdlLines.push('end Behavioral;');
      
      content = vhdlLines.join('\n');
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
      // Generate VHDL ROM file
      const vhdlLines: string[] = [];
      
      // Header
      vhdlLines.push('----------------------------------------------------------------------------------');
      vhdlLines.push('-- Generated VHDL ROM file');
      vhdlLines.push('-- Create Date: ' + new Date().toLocaleString());
      vhdlLines.push('----------------------------------------------------------------------------------');
      vhdlLines.push('library IEEE;');
      vhdlLines.push('use IEEE.STD_LOGIC_1164.ALL;');
      vhdlLines.push('use IEEE.NUMERIC_STD.ALL;');
      vhdlLines.push('');
      vhdlLines.push('entity il_rom is');
      
      // Calculate VHDL bit width based on download size
      const addrBits = Math.ceil(Math.log2(downloadSize));
      vhdlLines.push(`    Port ( a : in  STD_LOGIC_VECTOR (${addrBits - 1} downto 0);`);
      vhdlLines.push('           d : out  STD_LOGIC_VECTOR (7 downto 0);');
      vhdlLines.push('           a_valid: out STD_LOGIC);');
      vhdlLines.push('end il_rom;');
      vhdlLines.push('');
      vhdlLines.push('architecture Behavioral of il_rom is');
      vhdlLines.push('');
      vhdlLines.push(`type rom_array is array (0 to ${downloadSize - 1}) of STD_LOGIC_VECTOR(7 downto 0);`);
      vhdlLines.push('constant il_rom: rom_array := (');
      
      // Generate ROM data - 15 values per line
      const romLines: string[] = [];
      for (let i = 0; i < downloadSize; i++) {
        const value = binaryData[i];
        const hexValue = 'X"' + value.toString(16).toUpperCase().padStart(2, '0') + '"';
        romLines.push(hexValue);
      }
      
      // Format with 15 values per line
      for (let i = 0; i < romLines.length; i += 15) {
        const chunk = romLines.slice(i, i + 15);
        const line = '\t\t' + chunk.join(', ') + (i + 15 < romLines.length ? ',' : '');
        vhdlLines.push(line);
      }
      
      vhdlLines.push(');');
      vhdlLines.push('');
      vhdlLines.push('begin');
      vhdlLines.push('');
      vhdlLines.push(`\td <= il_rom(to_integer(unsigned(a(${addrBits - 1} downto 0))));`);
      vhdlLines.push(`\ta_valid <= '1' when (unsigned(a) < ${downloadSize}) else '0';`);
      vhdlLines.push('');
      vhdlLines.push('end Behavioral;');
      
      blob = new Blob([vhdlLines.join('\n')], { type: 'text/plain' });
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
                <Button variant="outline" className="gap-2" disabled={!assemblyCode.trim()} onClick={handlePass1}>
                  Pass 1
                </Button>
                <Button variant="outline" className="gap-2" disabled={!pass1Run || (pass1Result?.errorCount ?? 1) > 0} onClick={handlePass2}>
                  Pass 2
                </Button>
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
                  className="font-mono text-xs h-24 bg-code-bg border-code-border resize-none"
                />
              </div>
            </div>
          </Card>
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
          </div>

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