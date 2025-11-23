import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { pass1, type Pass1Result } from "@/lib/assembler";

interface AssemblePass1Props {
  assemblyCode: string;
  onPass1Complete: (result: Pass1Result) => void;
  onLogEntry: (message: string) => void;
  onErrorLinesChange: (lines: number[]) => void;
  onOrgValueChange: (value: number) => void;
  disabled?: boolean;
}

export const AssemblePass1 = ({
  assemblyCode,
  onPass1Complete,
  onLogEntry,
  onErrorLinesChange,
  onOrgValueChange,
  disabled = false
}: AssemblePass1Props) => {
  
  const handlePass1 = () => {
    // Set org_value to 0
    onOrgValueChange(0);
    
    onLogEntry('Starting Pass 1...');
    onLogEntry('org_value set to 0');
    onLogEntry('pass1_errorcount set to 0');
    
    // Run Pass 1
    const result = pass1(assemblyCode);
    onPass1Complete(result);
    
    // Extract error line numbers from error messages
    const errorLineNumbers: number[] = [];
    result.errors.forEach(error => {
      const match = error.match(/line (\d+)/);
      if (match) {
        errorLineNumbers.push(parseInt(match[1]));
      }
    });
    onErrorLinesChange(errorLineNumbers);
    
    // Display label dictionary
    onLogEntry('--- Label Dictionary ---');
    const labels = Object.entries(result.labelDictionary);
    if (labels.length === 0) {
      onLogEntry('(no labels found)');
    } else {
      labels.forEach(([label, entry]) => {
        const hexValue = entry.org_value.toString(16).toUpperCase().padStart(4, '0');
        onLogEntry(`${label}: line=${entry.line_number}, org=${entry.org_value} (0x${hexValue})`);
      });
    }
    
    // Display errors if any
    if (result.errors.length > 0) {
      onLogEntry('--- Errors ---');
      result.errors.forEach(error => {
        onLogEntry(error);
      });
    }
    
    // Display error count
    onLogEntry(`--- Pass 1 Complete ---`);
    onLogEntry(`pass1_errorcount: ${result.errorCount}`);
    const hexOrgValue = result.finalOrgValue.toString(16).toUpperCase().padStart(4, '0');
    onLogEntry(`final org_value: ${result.finalOrgValue} (0x${hexOrgValue})`);
    
    if (result.errorCount === 0) {
      toast.success('Pass 1 completed successfully');
    } else {
      toast.error(`Pass 1 completed with ${result.errorCount} error(s)`);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="gap-2" 
      disabled={disabled || !assemblyCode.trim()} 
      onClick={handlePass1}
    >
      Pass 1
    </Button>
  );
};
