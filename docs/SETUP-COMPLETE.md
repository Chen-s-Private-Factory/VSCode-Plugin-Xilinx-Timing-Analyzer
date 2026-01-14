# Xilinx Timing Analyzer - Setup Complete! ✅

## Environment Setup

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 14.x or later ([Download](https://nodejs.org/))
- **npm** 6.x or later (comes with Node.js)
- **VSCode** 1.80.0 or later ([Download](https://code.visualstudio.com/))

### Setting Up VSCode Extension Development Environment

#### 1. Install Node.js and npm
```bash
# Verify installation
node --version  # Should be v14.x or later
npm --version   # Should be v6.x or later
```

#### 2. Install TypeScript Globally (Optional)
```bash
npm install -g typescript
tsc --version
```

#### 3. Install Required VSCode Extensions (Optional but Recommended)
In VSCode, install these extensions:
- **ESLint** - For code linting
- **Prettier** - For code formatting
- **TypeScript and JavaScript Language Features** (built-in)

#### 4. Clone and Setup Project
```bash
git clone https://github.com/Chen-s-Private-Factory/VSCode-Plugin-Xilinx-Timing-Analyzer.git
cd VSCode-Plugin-Xilinx-Timing-Analyzer
npm install
```

#### 5. Understanding package.json Dependencies
```json
{
  "dependencies": {
    "@hpcc-js/wasm": "^2.5.0"  // Graphviz for graph rendering
  },
  "devDependencies": {
    "@types/node": "^20.x",     // Node.js type definitions
    "@types/vscode": "^1.80.0", // VSCode API types
    "typescript": "^5.1.6"      // TypeScript compiler
  }
}
```

#### 6. Project Build Scripts
```bash
# Compile TypeScript to JavaScript
npm run compile

# Watch mode - auto-recompile on file changes
npm run watch

# Run tests (if available)
npm test

# Package extension as .vsix
vsce package
```

#### 7. Debug Configuration
The project includes `.vscode/launch.json` for debugging:
- Press `F5` to start debugging
- Opens new VSCode window (Extension Development Host)
- Breakpoints work in TypeScript source files
- Console output in Debug Console

#### 8. Common Development Tasks

**Adding new dependencies:**
```bash
npm install <package-name>
npm install --save-dev <dev-package>
```

**Updating dependencies:**
```bash
npm update
```

**Check for outdated packages:**
```bash
npm outdated
```

**Clean and rebuild:**
```bash
rm -rf node_modules out
npm install
npm run compile
```

## Development Workflow

### Daily Development
1. **Start watch mode** (auto-compile on save):
   ```bash
   npm run watch
   ```

2. **Press F5** to launch Extension Development Host

3. **Make changes** in `src/` files

4. **Reload extension** in Development Host:
   - Press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)
   - Or use Command Palette → "Developer: Reload Window"

### Testing Changes
1. Open `test/AppletonTop.twr` in Extension Development Host
2. Place cursor on a timing path
3. Click preview button to see graph
4. Test zoom/pan features
5. Verify highlighting works

### Debugging
1. Set breakpoints in TypeScript files (`.ts`)
2. Press `F5` to start debugging
3. Reproduce the issue in Extension Development Host
4. Debugger pauses at breakpoints
5. Inspect variables in Debug panel

## Installation from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chen-s-Private-Factory/VSCode-Plugin-Xilinx-Timing-Analyzer.git
   cd VSCode-Plugin-Xilinx-Timing-Analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will install:
   - TypeScript compiler
   - VSCode extension APIs
   - Graphviz WASM module (@hpcc-js/wasm)
   - Development tools

3. **Compile TypeScript**
   ```bash
   npm run compile
   ```
   This compiles TypeScript files in `src/` to JavaScript in `out/`

4. **Test the extension**
   - Open the project in VSCode
   - Press `F5` to launch Extension Development Host
   - Open `test/AppletonTop.twr` in the new window
   - Try the features!

## Project Overview
A VSCode extension for analyzing Xilinx .twr (Timing Report) files with automatic path detection, hover information, visual highlighting, and Graphviz visualization.

## What Was Created

### 📁 Project Structure
```
xilinx-timing-analyzer/
├── src/
│   ├── extension.ts              # Main entry point & command registration
│   ├── parser/
│   │   └── twrParser.ts          # Parse .twr files & extract timing paths
│   ├── providers/
│   │   ├── hoverProvider.ts      # Hover tooltips with timing details
│   │   └── decorationProvider.ts # Visual highlighting of failed paths
│   ├── visualization/
│   │   └── graphPanel.ts         # Graphviz graph generation & webview
│   └── types/
│       └── timing.ts             # TypeScript interfaces
├── .vscode/
│   ├── launch.json               # Debug configuration (F5 to test)
│   └── tasks.json                # Build tasks
├── out/                          # Compiled JavaScript (✅ compiled)
├── package.json                  # Extension manifest & dependencies
├── tsconfig.json                 # TypeScript configuration
├── test-sample.twr               # Sample .twr file for testing
└── README.md                     # Documentation
```

## Features Implemented

### 1. ✅ TWR File Parser
- Extracts timing paths from .twr files
- Identifies failed timing paths (negative slack)
- Parses source/destination, slack, delays, and path elements
- Located at: `src/parser/twrParser.ts`

### 2. ✅ Hover Provider
- Shows detailed timing information when hovering over paths
- Displays: source, destination, slack (MET/FAILED), total delay, path breakdown
- Located at: `src/providers/hoverProvider.ts`

### 3. ✅ Visual Highlighting
- Failed paths highlighted in red (rgba 255,0,0,0.1)
- Most critical path highlighted in orange (rgba 255,165,0,0.2)
- Updates automatically when file changes
- Located at: `src/providers/decorationProvider.ts`

### 4. ✅ Graphviz Visualization
- Generates DOT graph from timing paths
- Renders SVG in VSCode webview panel
- Shows source → destination with delays and slack
- Color-coded: red = failed, green = passed
- Located at: `src/visualization/graphPanel.ts`

## How to Test the Extension

### Method 1: Run in Extension Development Host (Recommended)
1. Open the project in VSCode:
   ```bash
   cd C:\Users\chen\xilinx-timing-analyzer
   code .
   ```

2. Press **F5** (or Run → Start Debugging)
   - This opens a new VSCode window with the extension loaded

3. In the new window, open the test file:
   ```
   File → Open File → test-sample.twr
   ```

4. You should see:
   - Failed paths highlighted in red/orange
   - Hover over paths to see details
   
5. Test commands (Ctrl+Shift+P):
   - `Xilinx: Show Timing Graph` - View graphviz visualization
   - `Xilinx: Analyze Timing Paths` - Show summary

### Method 2: Manual Testing
```bash
cd C:\Users\chen\xilinx-timing-analyzer
npm run watch
```
Then press F5 in VSCode.

## Available Commands

| Command | Description |
|---------|-------------|
| `Xilinx: Show Timing Graph` | Opens webview panel with Graphviz visualization |
| `Xilinx: Analyze Timing Paths` | Shows summary: total paths and failed count |

## Next Steps

### To Install Locally
```bash
# Package the extension
npm install -g @vscode/vsce
vsce package

# This creates: xilinx-timing-analyzer-0.1.0.vsix
# Install via: Extensions → Install from VSIX
```

### To Publish (Future)
1. Create publisher account at https://marketplace.visualstudio.com
2. Update `publisher` field in package.json
3. Run: `vsce publish`

## Customization Ideas

### Enhance the Parser
- Support more .twr format variations
- Extract clock domain crossing paths
- Parse hold violations

### Improve Visualization
- Interactive graph (zoom, pan, click to jump to line)
- Filter by slack threshold
- Show multiple timing constraints separately
- Export graph as PNG/SVG

### Add Features
- Quick fixes for common timing issues
- Timeline view of path delays
- Comparison between multiple .twr files
- Integration with Vivado/ISE

## Technology Stack
- **Language**: TypeScript 5.9.3
- **Framework**: VSCode Extension API 1.80+
- **Visualization**: @hpcc-js/wasm (Graphviz)
- **Build**: TypeScript Compiler

## Troubleshooting

### Extension doesn't activate
- Check that file has `.twr` extension
- Look at Output → Extension Host for errors

### Compilation errors
```bash
npm install --production=false
npx tsc -p .
```

### Graph doesn't show
- Check Console (Help → Toggle Developer Tools)
- Verify @hpcc-js/wasm is installed

## Files to Review

### Core Logic
- `src/extension.ts` - Entry point, command registration
- `src/parser/twrParser.ts` - Parsing logic (customize for your .twr format)

### UI/UX
- `src/providers/hoverProvider.ts` - Customize hover tooltip
- `src/providers/decorationProvider.ts` - Adjust highlight colors
- `src/visualization/graphPanel.ts` - Modify graph appearance

## Important Notes

⚠️ **Parser Customization Required**: The parser uses regex patterns based on common .twr formats. You may need to adjust patterns in `twrParser.ts` to match your specific Xilinx tool version.

✅ **Already Compiled**: The extension is ready to test with F5

🎯 **Sample File**: `test-sample.twr` contains realistic timing data with 15 failed paths

## Summary

✅ Project scaffolded and compiled  
✅ All features implemented  
✅ Test file created  
✅ Debug configuration ready  
✅ Documentation complete  

**You're ready to press F5 and start testing!** 🚀
