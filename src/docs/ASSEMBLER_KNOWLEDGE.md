# Tiny Basic Assembler - Project Knowledge

This document captures the knowledge and specifications for the Tiny Basic Intermediate Language (TBIL) assembler.

## Overview

The assembler is a companion to ["Celebrating 50 years of Tiny Basic"](https://hackaday.io/project/204482-celebrating-50-years-of-tiny-basic). It supports "Tiny Basic intermediate language" instructions as documented at [TBEK.txt](http://www.ittybittycomputers.com/IttyBitty/TinyBasic/TBEK.txt).

Additional resources:
- [Itty Bitty Computers - Tiny Basic](http://www.ittybittycomputers.com/IttyBitty/TinyBasic/)

---

## Definitions

### Octal Digit
Single digit in range 0 to 7 (inclusive). Represents values 0 to 7.

### Constant
Decimal, hex (prefixed `0X`, valid digits are decimal and A-F), or binary (prefixed `0B`, valid digits are 0, 1) integer. If prefixed by `-` (minus sign) then value is `0-constant` (evaluate as 2's complement integers).

### Expression
A string of one or more constants with operators `+ - * / %` (integer division/modulo) between them. Evaluated using common operation precedence which can be changed using parenthesis `(` and `)`. If expression cannot be evaluated, log error and stop processing.

### Text ("text" or 'text')
Any number of characters (8-bit US ASCII) between single or double quotes. Empty text is not allowed.

**Text Transformation Rules:**
1. Last character has 128 added to its ASCII code (bit 7 set)
2. Character sequence `^^` becomes single `^`
3. Character sequences `A^` to `Z^` become single character equal to ASCII code minus 64 (e.g., `M^` = value 13, `Q^` = 0x11)
4. Otherwise characters are copied verbatim without changing case

### Label (:label)
String starting with `:` containing up to 8 alphanumeric characters or `_`. Cannot start with `_` or number after colon. Must be at beginning of line. Labels are stored in `label_dictionary` with `line_number` and `org_value`.

### Comment (//comment)
Any string starting with `//`. Removed during processing.

### Target
Must be valid key in `label_dictionary`. `target_value` equals stored `org_value`. Must be in range 0-2047.

### Relative Branch
Valid label or `*` (asterisk). If `*`, value is 0. Otherwise:
- `relativebranch_value = label_org - current_org + 31`
- Must be in range 0-63.

### Forward Branch
Valid label or `*` (asterisk). If `*`, value is 0. Otherwise:
- `forwardbranch_value = label_org - current_org - 1`
- Must be ≤31.

### Helper Functions
- `LSB(value)`: returns `value AND 0xFF` (range 0-255)
- `MSB(value)`: returns `(value AND 0xFF00) / 256` (range 0-255)

---

## Supported Instructions

The assembler recognizes the following instructions:

| Instruction | Pass 1 Size | Pass 2 Opcode |
|-------------|-------------|---------------|
| `.ORG expr` | sets org | - |
| `SX digit` | 1 | 0x00+digit |
| `NO` | 1 | 0x08 |
| `LB expr` | 2 | 0x09 + LSB |
| `LN expr` | 3 | 0x0A + MSB + LSB |
| `DS` | 1 | 0x0B |
| `SP` | 1 | 0x0C |
| `SB` | 1 | 0x10 |
| `RB` | 1 | 0x11 |
| `FV` | 1 | 0x12 |
| `SV` | 1 | 0x13 |
| `GS` | 1 | 0x14 |
| `RS` | 1 | 0x15 |
| `GO` | 1 | 0x16 |
| `NE` | 1 | 0x17 |
| `AD` | 1 | 0x18 |
| `SU` | 1 | 0x19 |
| `MP` | 1 | 0x1A |
| `DV` | 1 | 0x1B |
| `CP` | 1 | 0x1C |
| `NX` | 1 | 0x1D |
| `NC` | 1 | 0x1E |
| `LS` | 1 | 0x1F |
| `PN` | 1 | 0x20 |
| `PQ` | 1 | 0x21 |
| `PT` | 1 | 0x22 |
| `NL` | 1 | 0x23 |
| `PC "text"` | 1+len | 0x24 + bytes |
| `FS` | 1 | 0x25 |
| `FE` | 1 | 0x26 |
| `GL` | 1 | 0x27 |
| `IL` | 1 | 0x2A |
| `MT` | 1 | 0x2B |
| `XQ` | 1 | 0x2C |
| `WS` | 1 | 0x2D |
| `US` | 1 | 0x2E |
| `RT` | 1 | 0x2F |
| `JS target` | 2 | 0x30 + addr |
| `J target` | 2 | 0x38 + addr |
| `BR rel` | 1 | 0x40 + offset |
| `BC fwd,"text"` | 1+len | 0x80 + bytes |
| `BV fwd` | 1 | 0xA0 + offset |
| `BN fwd` | 1 | 0xC0 + offset |
| `BE fwd` | 1 | 0xE0 + offset |

**Note:** Instructions `DT`, `RD`, and `RE` are no longer supported.

---

## Branch Instruction Encoding

| Instruction | Base Opcode | Mask |
|-------------|-------------|------|
| `BR` | 0x40 | 0x3F |
| `BC` | 0x80 | 0x1F |
| `BV` | 0xA0 | 0x1F |
| `BN` | 0xC0 | 0x1F |
| `BE` | 0xE0 | 0x1F |

---

## Assembly Process

### Pass 1
1. Remove comments
2. Remove leading/trailing whitespace
3. Convert to uppercase (except quoted text)
4. Process labels (add to dictionary with org value)
5. Calculate instruction sizes, update org value
6. Log labels with org in decimal and hex format (e.g., "org=183 (0x00B7)")

### Pass 2
1. Same preprocessing as Pass 1
2. Validate labels exist in dictionary
3. Generate machine code bytes
4. Write to binary array at org positions

**Pass 2 Enablement:** Only enabled when Pass 1 completed successfully with zero errors. Pass 1 status resets when assembly code changes.

---

## Download Formats

### Size Constraint
Downloads are limited to the smallest power-of-2 size greater than final `org_value`, maximum 65536 bytes. Example: `org_value` of 383 → download size of 512 bytes.

### Supported Formats
- **Binary (.bin)**: Raw machine code bytes
- **Hex (.hex)**: Hexadecimal representation
- **VHDL (.vhd)**: Uses template from [template.vhd](https://github.com/zpekic/Sys_MicroBasic/blob/main/src/common/TBIL/template.vhd)
  - `FILENAME` placeholder → uploaded file name (without extension)
  - `HEXBYTES` placeholder → formatted machine code bytes

---

## File Upload Behavior

- If assembly code is empty: uploaded content replaces it
- If assembly code is not empty: uploaded content inserts at cursor position
- Uploaded filename (without extension) is used as base for all download files

---

## Activity Log

The activity log displays:
- Label org values in decimal and hex: `org=183 (0x00B7)`
- Final org value in same format
- Errors with line numbers
- Total error counts from both passes
