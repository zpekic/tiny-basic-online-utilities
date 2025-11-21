// Simple ARM-like assembler/disassembler
// Supports basic instructions: MOV, ADD, SUB, MUL, LDR, STR

interface Instruction {
  opcode: string;
  encoding: number;
  format: "reg-imm" | "reg-reg" | "mem";
}

const INSTRUCTIONS: Record<string, Instruction> = {
  MOV: { opcode: "MOV", encoding: 0xe3a0, format: "reg-imm" },
  ADD: { opcode: "ADD", encoding: 0xe281, format: "reg-reg" },
  SUB: { opcode: "SUB", encoding: 0xe041, format: "reg-reg" },
  MUL: { opcode: "MUL", encoding: 0xe003, format: "reg-reg" },
  LDR: { opcode: "LDR", encoding: 0xe594, format: "mem" },
  STR: { opcode: "STR", encoding: 0xe584, format: "mem" },
};

const REGISTERS: Record<string, number> = {
  R0: 0, R1: 1, R2: 2, R3: 3, R4: 4, R5: 5, R6: 6, R7: 7,
  R8: 8, R9: 9, R10: 10, R11: 11, R12: 12, R13: 13, R14: 14, R15: 15,
};

function parseRegister(reg: string): number {
  const upper = reg.toUpperCase().trim();
  if (!(upper in REGISTERS)) {
    throw new Error(`Invalid register: ${reg}`);
  }
  return REGISTERS[upper];
}

function parseImmediate(imm: string): number {
  const trimmed = imm.trim();
  if (trimmed.startsWith("#")) {
    const value = parseInt(trimmed.substring(1));
    if (isNaN(value) || value < 0 || value > 255) {
      throw new Error(`Invalid immediate value: ${imm}`);
    }
    return value;
  }
  throw new Error(`Invalid immediate format: ${imm}`);
}

export function assemble(code: string): string {
  const lines = code.split("\n").filter((line) => line.trim() && !line.trim().startsWith(";"));
  const machineCode: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const parts = line.split(/[\s,]+/).filter(Boolean);

    if (parts.length === 0) continue;

    const instruction = parts[0].toUpperCase();
    if (!(instruction in INSTRUCTIONS)) {
      throw new Error(`Unknown instruction at line ${i + 1}: ${instruction}`);
    }

    const instr = INSTRUCTIONS[instruction];
    let encoded = instr.encoding << 16;

    try {
      if (instr.format === "reg-imm") {
        // MOV R0, #5
        if (parts.length !== 3) throw new Error("Invalid format");
        const rd = parseRegister(parts[1]);
        const imm = parseImmediate(parts[2]);
        encoded |= (rd << 12) | imm;
      } else if (instr.format === "reg-reg") {
        // ADD R1, R0, #3 or ADD R1, R0, R2
        if (parts.length !== 4) throw new Error("Invalid format");
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        
        let rm = 0;
        if (parts[3].startsWith("#")) {
          rm = parseImmediate(parts[3]);
        } else {
          rm = parseRegister(parts[3]);
        }
        
        encoded |= (rd << 12) | (rn << 16) | rm;
      } else if (instr.format === "mem") {
        // LDR R5, [R4]
        if (parts.length !== 3) throw new Error("Invalid format");
        const rd = parseRegister(parts[1]);
        const base = parts[2].replace(/[\[\]]/g, "");
        const rn = parseRegister(base);
        encoded |= (rd << 12) | (rn << 16);
      }

      machineCode.push(encoded.toString(16).toUpperCase().padStart(8, "0"));
    } catch (error) {
      throw new Error(`Error at line ${i + 1}: ${error instanceof Error ? error.message : "Invalid format"}`);
    }
  }

  return machineCode.join("\n");
}

export function disassemble(code: string): string {
  const lines = code.split("\n").filter((line) => line.trim());
  const assembly: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const hex = lines[i].trim();
    if (!/^[0-9A-Fa-f]{8}$/.test(hex)) {
      throw new Error(`Invalid hex format at line ${i + 1}: ${hex}`);
    }

    const encoded = parseInt(hex, 16);
    const opcodeBase = (encoded >> 16) & 0xffff;

    let found = false;
    for (const [name, instr] of Object.entries(INSTRUCTIONS)) {
      if ((opcodeBase & 0xfff0) === (instr.encoding & 0xfff0)) {
        const rd = (encoded >> 12) & 0xf;
        const rn = (encoded >> 16) & 0xf;
        const rm = encoded & 0xff;

        let asm = "";
        if (instr.format === "reg-imm") {
          asm = `${name} R${rd}, #${rm}`;
        } else if (instr.format === "reg-reg") {
          asm = `${name} R${rd}, R${rn}, R${rm}`;
        } else if (instr.format === "mem") {
          asm = `${name} R${rd}, [R${rn}]`;
        }

        assembly.push(asm);
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Unknown instruction at line ${i + 1}: ${hex}`);
    }
  }

  return assembly.join("\n");
}
