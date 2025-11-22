// Tiny Basic Assembler - Pass 1 and Pass 2 implementation

export interface LabelEntry {
  line_number: number;
  org_value: number;
}

export interface Pass1Result {
  labelDictionary: Record<string, LabelEntry>;
  errorCount: number;
  errors: string[];
  finalOrgValue: number;
}

// Helper function to evaluate expressions
function evaluateExpression(expr: string): number {
  try {
    // Remove spaces
    let normalized = expr.trim();
    
    // Replace hex (0X prefix), binary (0B prefix), and handle negative numbers
    normalized = normalized.replace(/0[xX]([0-9A-Fa-f]+)/g, (_, hex) => String(parseInt(hex, 16)));
    normalized = normalized.replace(/0[bB]([01]+)/g, (_, bin) => String(parseInt(bin, 2)));
    
    // Evaluate the expression using Function constructor (safe for numeric expressions)
    const result = new Function(`'use strict'; return (${normalized})`)();
    
    if (!Number.isInteger(result)) {
      throw new Error('Expression must evaluate to an integer');
    }
    
    return result;
  } catch (error) {
    throw new Error(`Invalid expression: ${expr}`);
  }
}

// Helper function to process text strings
function transformText(text: string): { transformed: string; length: number } {
  let transformed = '';
  let i = 0;
  
  while (i < text.length) {
    if (text[i] === '^' && i + 1 < text.length) {
      if (text[i + 1] === '^') {
        // ^^ becomes single ^
        transformed += '^';
        i += 2;
      } else if (text[i + 1] >= 'A' && text[i + 1] <= 'Z') {
        // A^ to Z^ becomes ASCII code - 64
        transformed += String.fromCharCode(text[i + 1].charCodeAt(0) - 64);
        i += 2;
      } else {
        transformed += text[i];
        i++;
      }
    } else if (i === text.length - 1) {
      // Last character - add 128 to ASCII code
      transformed += String.fromCharCode(text[i].charCodeAt(0) + 128);
      i++;
    } else {
      transformed += text[i];
      i++;
    }
  }
  
  return { transformed, length: transformed.length };
}

// Remove comments from a line
function removeComments(line: string): string {
  const commentIndex = line.indexOf('//');
  if (commentIndex !== -1) {
    return line.substring(0, commentIndex);
  }
  return line;
}

// Extract and validate label from line
function extractLabel(line: string): { label: string | null; remaining: string; error: string | null } {
  if (!line.startsWith(':')) {
    return { label: null, remaining: line, error: null };
  }
  
  const match = line.match(/^:([A-Z_][A-Z0-9_]{0,7})\s+(.+)$/i);
  if (!match) {
    // Check various error conditions
    if (line.match(/^:[0-9]/)) {
      return { label: null, remaining: line, error: 'Label cannot start with a number after colon' };
    }
    if (line.match(/^:_/)) {
      return { label: null, remaining: line, error: 'Label cannot start with underscore after colon' };
    }
    if (line.match(/^:[A-Z_][A-Z0-9_]{8,}/i)) {
      return { label: null, remaining: line, error: 'Label exceeds 8 characters' };
    }
    if (!line.match(/\s/)) {
      return { label: null, remaining: line, error: 'Label cannot stand by itself on the line' };
    }
    return { label: null, remaining: line, error: 'Invalid label format' };
  }
  
  return { label: match[1].toUpperCase(), remaining: match[2], error: null };
}

// Process a single line for Pass 1
function processPass1Line(
  lineString: string, 
  lineNumber: number, 
  orgValue: number, 
  labelDictionary: Record<string, LabelEntry>
): { newOrgValue: number; error: string | null } {
  
  // Extract label if present
  const { label, remaining, error: labelError } = extractLabel(lineString);
  
  if (labelError) {
    return { newOrgValue: orgValue, error: labelError };
  }
  
  if (label) {
    if (labelDictionary[label]) {
      return { newOrgValue: orgValue, error: `Duplicate label: ${label}` };
    }
    labelDictionary[label] = { line_number: lineNumber, org_value: orgValue };
    lineString = remaining;
  }
  
  // Validate that line is not empty after label removal
  if (!lineString.trim()) {
    return { newOrgValue: orgValue, error: 'Instruction missing after label' };
  }
  
  // Parse the instruction/directive (convert to uppercase except for quoted strings)
  const parts = lineString.match(/("[^"]*"|'[^']*'|\S+)/g) || [];
  if (parts.length === 0) {
    return { newOrgValue: orgValue, error: 'Empty line after processing' };
  }
  
  const instruction = parts[0].toUpperCase();
  
  try {
    // Process based on instruction/directive
    switch (instruction) {
      case '.ORG': {
        if (parts.length < 2) throw new Error('.ORG requires an expression');
        const newOrg = evaluateExpression(parts[1]);
        if (newOrg < orgValue) {
          return { newOrgValue: orgValue, error: '.ORG value cannot be less than current org_value' };
        }
        return { newOrgValue: newOrg, error: null };
      }
      
      // Single-byte instructions
      case 'SX':
        if (parts.length < 2) throw new Error('SX requires an octal digit');
        const digit = parseInt(parts[1], 8);
        if (isNaN(digit) || digit < 0 || digit > 7) {
          throw new Error('SX requires a valid octal digit (0-7)');
        }
        return { newOrgValue: orgValue + 1, error: null };
        
      case 'NO': case 'DS': case 'SP': case 'DT': case 'RD': case 'RE':
      case 'SB': case 'RB': case 'FV': case 'SV': case 'GS': case 'RS':
      case 'GO': case 'NE': case 'AD': case 'SU': case 'MP': case 'DV':
      case 'CP': case 'NX': case 'LS': case 'PN': case 'PQ': case 'PT':
      case 'NL': case 'GL': case 'IL': case 'MT': case 'XQ': case 'WS': case 'US': case 'RT':
      case 'FS': case 'FE':
        return { newOrgValue: orgValue + 1, error: null };
      
      // Two-byte instructions
      case 'LB':
        if (parts.length < 2) throw new Error('LB requires an expression');
        evaluateExpression(parts[1]); // Validate expression
        return { newOrgValue: orgValue + 2, error: null };
      
      // Three-byte instructions
      case 'LN':
        if (parts.length < 2) throw new Error('LN requires an expression');
        evaluateExpression(parts[1]); // Validate expression
        return { newOrgValue: orgValue + 3, error: null };
      
      // Jump instructions
      case 'JS': case 'J':
        if (parts.length < 2) throw new Error(`${instruction} requires a target`);
        // Target validation will be done in Pass 2
        return { newOrgValue: orgValue + 2, error: null };
      
      // Branch instructions
      case 'BR':
        if (parts.length < 2) throw new Error('BR requires a relative branch target');
        return { newOrgValue: orgValue + 1, error: null };
      
      case 'BV': case 'BN': case 'BE':
        if (parts.length < 2) throw new Error(`${instruction} requires a forward branch target`);
        return { newOrgValue: orgValue + 1, error: null };
      
      // PC instruction with text
      case 'PC': {
        if (parts.length < 2) throw new Error('PC requires a text string');
        const textMatch = lineString.match(/PC\s+(['"])(.*?)\1/i);
        if (!textMatch) throw new Error('PC requires quoted text');
        const { length } = transformText(textMatch[2]);
        return { newOrgValue: orgValue + 1 + length, error: null };
      }
      
      // BC instruction with text
      case 'BC': {
        if (parts.length < 3) throw new Error('BC requires a forward branch target and text');
        const textMatch = lineString.match(/BC\s+\S+\s*,\s*(['"])(.*?)\1/i);
        if (!textMatch) throw new Error('BC requires a forward branch target and quoted text');
        const { length } = transformText(textMatch[2]);
        return { newOrgValue: orgValue + 1 + length, error: null };
      }
      
      default:
        return { newOrgValue: orgValue, error: `Unknown instruction or directive: ${instruction}` };
    }
  } catch (error) {
    return { newOrgValue: orgValue, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function pass1(assemblyCode: string): Pass1Result {
  const labelDictionary: Record<string, LabelEntry> = {};
  const errors: string[] = [];
  let errorCount = 0;
  let orgValue = 0;
  
  const lines = assemblyCode.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    let lineString = lines[i];
    const lineNumber = i + 1;
    
    // Remove comments
    lineString = removeComments(lineString);
    
    // Remove leading and trailing blanks
    lineString = lineString.trim();
    
    // Skip empty lines
    if (!lineString) continue;
    
    // Convert to uppercase except quoted strings
    const quotedParts: string[] = [];
    let tempLine = lineString.replace(/(['"])(.*?)\1/g, (match) => {
      quotedParts.push(match);
      return `__QUOTED_${quotedParts.length - 1}__`;
    });
    tempLine = tempLine.toUpperCase();
    quotedParts.forEach((quoted, idx) => {
      tempLine = tempLine.replace(`__QUOTED_${idx}__`, quoted);
    });
    lineString = tempLine;
    
    // Process the line
    const { newOrgValue, error } = processPass1Line(lineString, lineNumber, orgValue, labelDictionary);
    
    if (error) {
      errors.push(`Line ${lineNumber}: ${error}`);
      errorCount++;
    } else {
      orgValue = newOrgValue;
    }
  }
  
  return {
    labelDictionary,
    errorCount,
    errors,
    finalOrgValue: orgValue
  };
}

export function assemble(code: string): string {
  // Placeholder - will be implemented with Pass 2
  return "";
}

export function disassemble(code: string): string {
  // Placeholder - will be implemented later
  return "";
}
