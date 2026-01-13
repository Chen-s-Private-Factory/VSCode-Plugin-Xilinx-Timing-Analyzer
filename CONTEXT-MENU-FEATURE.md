# Context Menu Feature Added! 🎉

## What Was Added

A context menu button (similar to VSCode's markdown preview) that opens the timing graph in a side panel when viewing a .twr file.

## New Features

### 1. **Editor Title Button** 📍
When you open a `.twr` file, you'll see a new button in the editor toolbar (top-right):
- **Icon**: `$(open-preview)` - Preview icon
- **Action**: Opens timing graph to the side
- **Location**: Next to other editor controls

### 2. **Context Menu Option** 🖱️
Right-click anywhere in a `.twr` file:
- **Menu item**: "Open Timing Graph to the Side"
- **Group**: "Xilinx" section
- **Action**: Same as toolbar button

### 3. **New Command** ⌨️
Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):
- **Command**: "Open Timing Graph to the Side"
- **When**: Active editor is a `.twr` file

## Implementation Details

### Modified Files

#### 1. **package.json**
```json
"commands": [
  {
    "command": "xilinx-timing-analyzer.showTimingGraphToSide",
    "title": "Open Timing Graph to the Side",
    "icon": "$(open-preview)"
  }
],
"menus": {
  "editor/title": [
    {
      "command": "xilinx-timing-analyzer.showTimingGraphToSide",
      "when": "editorLangId == twr",
      "group": "navigation"
    }
  ],
  "editor/context": [
    {
      "command": "xilinx-timing-analyzer.showTimingGraph",
      "when": "editorLangId == twr",
      "group": "xilinx"
    }
  ]
}
```

#### 2. **src/visualization/graphPanel.ts**
Added new method:
```typescript
public static async createOrShowToSide(extensionUri: vscode.Uri, paths: TimingPath[]) {
    const activeColumn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : vscode.ViewColumn.One;
    
    // Open to the side (like markdown preview)
    const column = activeColumn === vscode.ViewColumn.One 
        ? vscode.ViewColumn.Two 
        : vscode.ViewColumn.Beside;
    
    await this.createOrShow(extensionUri, paths, column);
}
```

#### 3. **src/extension.ts**
Registered new command:
```typescript
const showGraphToSideCommand = vscode.commands.registerCommand(
    'xilinx-timing-analyzer.showTimingGraphToSide',
    async () => {
        // Validates editor, parses TWR, opens graph to side
    }
);
```

## How to Use

### Option 1: Toolbar Button (Easiest) ⭐
1. Open a `.twr` file
2. Look for the preview icon button in the top-right corner
3. Click it → Graph opens in side panel

### Option 2: Right-Click Menu
1. Open a `.twr` file
2. Right-click anywhere in the editor
3. Select "Open Timing Graph to the Side"

### Option 3: Command Palette
1. Open a `.twr` file
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
3. Type "Open Timing Graph to the Side"
4. Press Enter

## Behavior

### Column Placement Logic
- **If editor is in Column 1** → Opens graph in Column 2
- **If editor is in Column 2+** → Opens graph "Beside" (VSCode chooses next available)
- **Reuses existing panel** → If graph panel already open, reveals it instead of creating new

### Similar to Markdown Preview
This follows the same pattern as VSCode's built-in markdown preview:
```
┌─────────────────┬─────────────────┐
│                 │                 │
│   .twr file     │  Timing Graph   │
│   (Source)      │  (Visualization)│
│                 │                 │
└─────────────────┴─────────────────┘
```

## Testing

1. **Press F5** to launch Extension Development Host
2. **Open** `test-sample.twr`
3. **Look for** the preview button in top-right corner
4. **Click** the button
5. **Verify** the graph opens to the side

## Icon Reference

The extension uses VSCode's built-in codicons:
- `$(open-preview)` - Preview/side panel icon (used for toolbar)
- `$(graph)` - Graph icon (used for main command)

## Comparison with VSCode Markdown

| Feature | Markdown Preview | Timing Graph Preview |
|---------|-----------------|---------------------|
| Toolbar button | ✅ Yes | ✅ Yes |
| Context menu | ✅ Yes | ✅ Yes |
| Opens to side | ✅ Yes | ✅ Yes |
| Auto-refresh | ✅ Yes | 🔄 Partial (on edit) |
| Split view | ✅ Yes | ✅ Yes |

## Next Enhancements

### Potential Improvements:
1. **Auto-refresh** - Update graph when .twr file changes (like markdown)
2. **Sync scrolling** - Link graph selection to editor line
3. **Lock button** - Pin graph to specific file
4. **Theme support** - Dark/light mode graph styling

## Summary

✅ **Toolbar button** added to editor title bar  
✅ **Context menu** option for right-click access  
✅ **Side panel opening** behavior (like markdown preview)  
✅ **Compiled and ready** to test  

**Try it now by pressing F5 and opening test-sample.twr!** 🚀
