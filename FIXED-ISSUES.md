# Fixed: Highlighting and Graph Issues! ✅

## Issues Fixed

### 1. ✅ Highlighting Now Shows Only Current Path
**Before**: All failed paths highlighted at once (confusing)
**After**: Only the path where cursor is located gets highlighted

**How it works:**
- Cursor position is tracked continuously
- Highlighting updates as you move through the file
- Single orange highlight shows current timing path
- Changes color from previous red/orange distinction

### 2. ✅ Graph Shows THREE Full Paths
**Before**: Only showed simplified data path nodes
**After**: Complete timing path visualization with:
1. **Source Clock Path** (blue) - From clock source to launch flip-flop
2. **Data Path** (red/green) - Combinational logic and routing
3. **Destination Clock Path** (purple) - From clock source to capture flip-flop

**Graph Structure:**
```
┌────────────────────────────────┐
│   SOURCE CLOCK PATH (Blue)    │
│   GTYE4 → BUFG → Net → FF     │
└────────────┬───────────────────┘
             │ Launch
┌────────────▼───────────────────┐
│   DATA PATH (Red/Green)        │
│   FF → Logic → Net → FF        │
└────────────┬───────────────────┘
             │ Capture
┌────────────▼───────────────────┐
│  DESTINATION CLOCK (Purple)    │
│   MMCM → BUFG → Net → FF       │
└────────────────────────────────┘
```

### 3. ✅ Graph Shows Only Current Path
**Before**: Tried to show all failed paths (messy)
**After**: Shows only the path at cursor position

**Usage:**
1. Move cursor to any timing path in the .twr file
2. Path automatically highlights
3. Click preview button → See graph for THAT path only
4. Move cursor to different path → Click preview → New graph

## Code Changes

### 1. src/providers/decorationProvider.ts
- **Removed**: Multiple decoration types (failed, critical)
- **Added**: Single `currentPathDecorationType` 
- **Changed**: `updateDecorations()` now gets path at cursor line
- **Result**: Only highlights path where cursor is

```typescript
// Old: Highlight all failed paths
for (const path of report.paths) {
    if (path.failed) { /* highlight */ }
}

// New: Highlight only current path
const currentPath = parser.getPathAtLine(cursorLine);
if (currentPath) { /* highlight it */ }
```

### 2. src/extension.ts
- **Added**: `onDidChangeTextEditorSelection` listener
- **Changed**: Graph commands now pass only current path
- **Result**: Highlighting updates as cursor moves

```typescript
// Added cursor movement tracking
const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(event => {
    decorationProvider.updateDecorations(event.textEditor);
});

// Changed to use only current path
const currentPath = parser.getPathAtLine(cursorLine);
await TimingGraphPanel.createOrShow(context.extensionUri, [currentPath]);
```

### 3. src/types/timing.ts
- **Added**: `sourceClockElements?: PathElement[]`
- **Added**: `destClockElements?: PathElement[]`
- **Result**: Can store all three paths separately

### 4. src/parser/twrParser.ts
- **Added**: `inSourceClockPath` and `inDestClockPath` flags
- **Added**: Clock path parsing logic
- **Changed**: Now detects "(clock ... rise edge)" sections
- **Changed**: Parses elements in clock sections separately from data path
- **Result**: Extracts complete source and destination clock paths

```typescript
// Detects clock path sections
if (line.match(/^\s*\(clock .+ rise edge\)/i)) {
    inSourceClockPath = true;  // or inDestClockPath
}

// Parses clock path elements into separate array
if (inSourceClockPath) {
    currentPath.sourceClockElements.push(element);
}
```

### 5. src/visualization/graphPanel.ts
- **Completely rewritten**: `generateDotGraph()`
- **Added**: Three subgraphs (source clock, data, dest clock)
- **Added**: `formatNodeLabel()` helper method
- **Changed**: Uses clusters with different colors
- **Result**: Visual distinction between three path types

```typescript
// Three separate subgraphs
subgraph cluster_source_clock { ... }  // Blue
subgraph cluster_data_path { ... }     // Red/Green
subgraph cluster_dest_clock { ... }    // Purple

// Connected with labeled edges
src_clk_last -> data_first [label="Launch"]
data_last -> dest_clk_first [label="Capture"]
```

## Visual Improvements

### Graph Colors
- **Source Clock**: Light blue background (#e3f2fd), blue borders
- **Data Path**: Light red (#ffebee) for failed, light green (#e8f5e9) for met
- **Destination Clock**: Light purple (#f3e5f5), purple borders
- **Net elements**: Yellow (#fff9c4) across all paths

### Node Shapes
- **Logic/Clock cells**: Rectangles
- **Net/Routing**: Ellipses
- **Failed paths**: Red borders
- **Met paths**: Green borders

### Edge Styles
- **Logic connections**: Solid lines
- **Net connections**: Dashed lines
- **Launch edge**: Bold, labeled "Launch"
- **Capture edge**: Bold, labeled "Capture"

## Testing

### 1. Open Extension
```bash
cd C:\Users\chen\xilinx-timing-analyzer
code .
# Press F5
```

### 2. Open AppletonTop.twr
- Navigate to first failed path (around line 14)
- See orange highlighting on that path only
- Move cursor up/down → highlighting follows

### 3. View Graph
- Click preview button (top-right)
- **You should see**:
  - TOP: Blue "Source Clock Path" with GTYE4_CHANNEL → BUFG_GT → net → FDCE
  - MIDDLE: Red "Data Path" with FDCE → net → FDRE  
  - BOTTOM: Purple "Destination Clock Path" with MMCM → BUFGCE → BUFGCE → net
  - Arrows connecting: Source Clock → Data (Launch), Data → Dest Clock (Capture)

### 4. Try Different Paths
- Move cursor to line 60 (second failed path)
- Click preview button again
- Graph updates to show that path's three sections

## Example Output

For the first path in AppletonTop.twr:

```
=== SOURCE CLOCK PATH (Blue) ===
GTYE4_CHANNEL_X0Y10 [GTYE4_CHANNEL] 0.000ns
    ↓ net (fo=2, routed) 0.085ns
BUFG_GT_X0Y126 [BUFG_GT] 0.130ns
    ↓ net (fo=31, routed) 0.558ns
SLICE_X9Y337 [FDCE] 0.000ns
    ↓↓↓ LAUNCH ↓↓↓

=== DATA PATH (Red - Failed) ===
SLICE_X9Y337 [FDCE Prop_CFF_SLICEL_C_Q] 0.079ns
    ↓ net (fo=2, routed) 3.077ns
SLICE_X8Y337 [FDRE] 0.000ns
    ↓↓↓ CAPTURE ↓↓↓

=== DESTINATION CLOCK PATH (Purple) ===
HPIOBDIFFINBUF_X0Y36 [DIFFINBUF] 0.578ns
    ↓ net (fo=1, routed) 0.040ns
HPIOB [IBUFCTRL] 0.000ns
    ↓ net (fo=2, routed) 0.301ns
BUFGCE_X0Y29 [BUFGCE] 0.024ns
    ↓ net (fo=1004, routed) 0.858ns
MMCM_X0Y0 [MMCME4_ADV] -2.338ns
    ↓ net (fo=1, routed) 0.215ns
BUFGCE_X0Y13 [BUFGCE] 0.024ns
    ↓ net (fo=4084, routed) 2.482ns
SLICE_X8Y337 [FDRE] 0.000ns
```

## Summary

✅ **Single path highlighting** - Only current path highlighted  
✅ **Cursor-based selection** - Highlighting follows cursor movement  
✅ **Three-part graph** - Source clock, data path, destination clock  
✅ **Color-coded sections** - Blue, red/green, purple for clarity  
✅ **Launch/Capture labels** - Clear timing relationship  
✅ **Complete clock trees** - Shows MMCM, BUFG, distribution network  
✅ **Compiled successfully** - Ready to test!  

**Navigate to any timing path in AppletonTop.twr and click preview to see the complete timing visualization!** 🚀
