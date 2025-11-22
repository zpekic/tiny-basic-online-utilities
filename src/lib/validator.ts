/**
 * Tiny Basic Label Validator
 * Based on project knowledge specifications
 */

export interface ValidationError {
  line: number;
  message: string;
  type: 'label' | 'syntax' | 'general';
}

/**
 * Validates a label according to Tiny Basic rules:
 * - Must start with : (colon)
 * - After colon: must start with letter (A-Z, case-insensitive)
 * - Can contain alphanumeric characters and underscore (but not start with _ or digit)
 * - Max 8 characters after the colon
 * - Cannot stand alone on a line
 * - Must be at beginning of line (no whitespace before colon)
 */
export function validateLabel(line: string, lineNumber: number): ValidationError | null {
  const trimmed = line.trim();
  
  // Check if line has a label (starts with :)
  if (!line.startsWith(':')) {
    return null; // No label on this line
  }
  
  // Check for whitespace before colon
  if (line[0] !== ':') {
    return {
      line: lineNumber,
      message: `Label must be at beginning of line (no whitespace before colon)`,
      type: 'label'
    };
  }
  
  // Extract label (everything from : to first space or end of line)
  const labelMatch = line.match(/^:([A-Za-z0-9_]*)/);
  if (!labelMatch) {
    return {
      line: lineNumber,
      message: `Invalid label format`,
      type: 'label'
    };
  }
  
  const labelContent = labelMatch[1];
  
  // Check if label is empty
  if (labelContent.length === 0) {
    return {
      line: lineNumber,
      message: `Label cannot be empty (missing label name after :)`,
      type: 'label'
    };
  }
  
  // Check length (max 8 characters)
  if (labelContent.length > 8) {
    return {
      line: lineNumber,
      message: `Label "${labelContent}" exceeds 8 characters (${labelContent.length} chars)`,
      type: 'label'
    };
  }
  
  // Check if starts with underscore
  if (labelContent[0] === '_') {
    return {
      line: lineNumber,
      message: `Label "${labelContent}" cannot start with underscore`,
      type: 'label'
    };
  }
  
  // Check if starts with digit
  if (/^\d/.test(labelContent)) {
    return {
      line: lineNumber,
      message: `Label "${labelContent}" cannot start with number`,
      type: 'label'
    };
  }
  
  // Check if starts with letter
  if (!/^[A-Za-z]/.test(labelContent)) {
    return {
      line: lineNumber,
      message: `Label "${labelContent}" must start with a letter (A-Z)`,
      type: 'label'
    };
  }
  
  // Check if contains only alphanumeric and underscore
  if (!/^[A-Za-z0-9_]+$/.test(labelContent)) {
    return {
      line: lineNumber,
      message: `Label "${labelContent}" contains invalid characters (only letters, numbers, and _ allowed)`,
      type: 'label'
    };
  }
  
  // Check if label stands alone on the line
  const afterLabel = line.substring(labelContent.length + 1).trim();
  if (afterLabel.length === 0 || afterLabel.startsWith('//')) {
    return {
      line: lineNumber,
      message: `Label ":${labelContent}" cannot stand alone on a line (must have code after it)`,
      type: 'label'
    };
  }
  
  return null; // Valid label
}

/**
 * Validates an octal digit (0-7)
 */
export function validateOctalDigit(char: string): boolean {
  return /^[0-7]$/.test(char);
}

/**
 * Validates all labels in code and checks for duplicates
 */
export function validateCode(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');
  const labelDictionary = new Map<string, number>();
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Skip empty lines and comment-only lines
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('//')) {
      return;
    }
    
    // Validate label if present
    const labelError = validateLabel(line, lineNumber);
    if (labelError) {
      errors.push(labelError);
      return;
    }
    
    // Check for duplicate labels
    if (line.startsWith(':')) {
      const labelMatch = line.match(/^:([A-Za-z0-9_]+)/);
      if (labelMatch) {
        const labelName = labelMatch[1].toUpperCase();
        
        if (labelDictionary.has(labelName)) {
          errors.push({
            line: lineNumber,
            message: `Duplicate label ":${labelName}" (first defined on line ${labelDictionary.get(labelName)})`,
            type: 'label'
          });
        } else {
          labelDictionary.set(labelName, lineNumber);
        }
      }
    }
  });
  
  return errors;
}
