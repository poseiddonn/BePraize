# PDF Generation Unicode Fix

## Problem

The ticket PDF generation was failing with:

```
Error: WinAnsi cannot encode "◆" (0x25c6)
```

This happened because PDF-lib's standard fonts (Helvetica, HelveticaBold) only support WinAnsi encoding, which can't handle Unicode characters like:

- `◆` (diamond, U+25C6)
- `——` (em-dashes, U+2014)

## Solution

Replaced all Unicode characters with WinAnsi-compatible ASCII equivalents:

### Changes Made

1. **Line 302-303:** Replaced `◆` (diamond) with `*` (asterisk)
   - Before: `page.drawText("◆", ...)`
   - After: `page.drawText("*", ...)`

2. **Line 427-428:** Replaced `——` (em-dashes) with `- - -` (dash-space pattern)
   - Before: `page.drawText("——", ...)`
   - After: `page.drawText("- - -", ...)`

## Files Modified

- `/app/lib/tickets/generateTicket.ts` - Lines 302-303, 427-428

## Testing

Tickets should now generate and send successfully. The visual appearance is slightly different but maintains the design intent:

- Asterisks `*` instead of diamonds for decorative ornaments
- Dashed lines `- - -` instead of em-dashes for footer decoration

No functional changes - just font encoding compatible with PDF-lib standard fonts.
