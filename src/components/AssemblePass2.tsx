import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { pass2, type Pass1Result } from "@/lib/assembler";

interface AssemblePass2Props {
  assemblyCode: string;
  pass1Result: Pass1Result | null;
  onBinaryDataChange: (data: Uint8Array) => void;
  onByteToLineMapChange: (map: Map<number, number>) => void;
  onLogEntry: (message: string) => void;
  onOrgValueChange: (value: number) => void;
  disabled?: boolean;
}

export const AssemblePass2 = ({
  assemblyCode,
  pass1Result,
  onBinaryDataChange,
  onByteToLineMapChange,
  onLogEntry,
  onOrgValueChange,
  disabled = false
}: AssemblePass2Props) => {
  
  const handlePass2 = () => {
    if (!pass1Result) {
      toast.error('Must run Pass 1 first');
      return;
    }
    
    // Set org_value to 0
    onOrgValueChange(0);
    
    onLogEntry('Starting Pass 2...');
    onLogEntry('org_value set to 0');
    onLogEntry('pass2_errorcount set to 0');
    
    // Run Pass 2
    const result = pass2(assemblyCode, pass1Result.labelDictionary);
    
    // Update binary data with machine code
    onBinaryDataChange(result.machineCode);
    
    // Update byte-to-line mapping
    onByteToLineMapChange(result.byteToLineMap);
    
    // Display errors if any
    if (result.errors.length > 0) {
      onLogEntry('--- Errors ---');
      result.errors.forEach(error => {
        onLogEntry(error);
      });
    }
    
    // Display error count
    onLogEntry(`--- Pass 2 Complete ---`);
    onLogEntry(`pass2_errorcount: ${result.errorCount}`);
    onLogEntry(`final org_value: ${result.finalOrgValue}`);
    
    if (result.errorCount === 0) {
      toast.success('Pass 2 completed successfully');
    } else {
      toast.error(`Pass 2 completed with ${result.errorCount} error(s)`);
    }
  };

  const isDisabled = disabled || !pass1Result || (pass1Result?.errorCount ?? 1) > 0;

  return (
    <Button 
      variant="outline" 
      className="gap-2" 
      disabled={isDisabled} 
      onClick={handlePass2}
    >
      Pass 2
    </Button>
  );
};
