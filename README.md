# Xilinx Timing Analyzer

> NOTE: Every code and doc in this repo is created by **Github Copilot CLI** w/ **claude-sonnet-4.5** model

A VSCode extension for analyzing Xilinx .twr (Timing Report) files and visualizing critical timing paths generated purely by AI.

## Features

- **📊 Interactive Timing Graph**: Visualize timing paths with zoom/pan support
- **🎯 Smart Path Highlighting**: Automatic highlighting of timing paths at cursor position
- **🔍 Detailed Hover Information**: Comprehensive timing data on hover
- **⚡ Three-Path Visualization**: Shows source clock, data path, and destination clock separately
- **🖱️ Zoom & Pan Controls**: Mouse wheel zoom, click-drag pan, keyboard shortcuts
- **🎨 Color-Coded Paths**: Failed paths in red, met paths in green, distinct clock paths
- **📝 Dual Format Support**: Works with both Vivado and ISE .twr files

## Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 14.x or later ([Download](https://nodejs.org/))
- **npm** 6.x or later (comes with Node.js)
- **VSCode** 1.80.0 or later ([Download](https://code.visualstudio.com/))

### Installation from Source

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

## Usage

### Opening TWR Files
1. Open any `.twr` file in VSCode
2. The file is automatically recognized and syntax-highlighted

### Viewing Timing Graphs
1. Place cursor on any timing path in the `.twr` file
2. **Option 1**: Click the preview button (📊) in the editor toolbar
3. **Option 2**: Right-click → "Open Timing Graph to the Side"
4. **Option 3**: Press `Ctrl+Shift+P` → "Xilinx: Show Timing Graph"

### Interactive Graph Controls
- **Mouse Wheel**: Zoom in/out (zooms towards cursor position)
- **Click + Drag**: Pan around the graph
- **+/- Buttons**: Zoom controls in top-right corner
- **Reset Button**: Return to 100% zoom
- **Double-Click**: Reset view
- **Keyboard Shortcuts**:
  - `+` or `=`: Zoom in
  - `-`: Zoom out
  - `0` or `r`: Reset view

### Path Highlighting
- Move cursor to any timing path
- Path automatically highlights with orange background
- Hover over elements for detailed timing information

## Environment Setup

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

## Project Structure

```
xilinx-timing-analyzer/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── parser/
│   │   └── twrParser.ts          # TWR file parser (Vivado & ISE)
│   ├── providers/
│   │   ├── hoverProvider.ts      # Hover tooltips
│   │   └── decorationProvider.ts # Path highlighting
│   ├── visualization/
│   │   └── graphPanel.ts         # Graph rendering & zoom/pan
│   └── types/
│       └── timing.ts             # TypeScript interfaces
├── test/
│   └── AppletonTop.twr           # Real Vivado test file (677KB)
├── docs/                         # Documentation files
├── out/                          # Compiled JavaScript (gitignored)
├── node_modules/                 # Dependencies (gitignored)
├── .vscode/
│   ├── launch.json              # Debug configuration
│   └── tasks.json               # Build tasks
├── package.json                 # Extension manifest & dependencies
├── tsconfig.json                # TypeScript compiler config
└── README.md                    # This file
```

## Supported File Formats

- **Vivado Timing Reports**: `.twr` files from Vivado 2018.x - 2024.x
- **ISE Timing Reports**: `.twr` files from ISE 14.x

## Graph Visualization

The extension displays timing paths in three distinct sections:

### 1. Source Clock Path (Blue)
- Clock generation and distribution
- From clock source (PLL, MMCM, GTYE4) to launch flip-flop
- Includes all clock buffers (BUFG, BUFGCE) and routing

### 2. Data Path (Red/Green)
- Combinational logic between flip-flops
- All logic cells and routing delays
- Red for failed paths, green for met paths

### 3. Destination Clock Path (Purple)
- Clock path to capture flip-flop
- Clock distribution network
- Shows setup/hold timing requirements

## Requirements

- **VSCode**: 1.80.0 or higher
- **Node.js**: 14.x or higher
- **npm**: 6.x or higher
- **Operating System**: Windows, macOS, or Linux

## Known Limitations

- Very large paths (>200 elements) may render slowly
- Hold timing paths not extensively tested
- Clock domain crossing analysis is informational only

## Troubleshooting

### Extension not loading
- Check VSCode version (must be ≥1.80.0)
- Verify `out/` directory exists with compiled JavaScript
- Run `npm run compile` to rebuild

### Graph not displaying
- Ensure cursor is positioned on a timing path
- Check Developer Tools (Help → Toggle Developer Tools) for errors
- Verify the path has source/destination information

### Compilation errors
```bash
# Clean and rebuild
rm -rf out node_modules
npm install
npm run compile
```

### TypeScript errors
```bash
# Update TypeScript and type definitions
npm install --save-dev typescript@latest
npm install --save-dev @types/vscode@latest
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Compile and test (`npm run compile` and press F5)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Documentation

Additional documentation is available in the `docs/` directory:
- [Setup Guide](docs/SETUP-COMPLETE.md)
- [Context Menu Features](docs/CONTEXT-MENU-FEATURE.md)
- [Graph Visualization](docs/ENHANCED-VISUALIZATION.md)
- [Issue Fixes](docs/FIXED-ISSUES.md)
- [Format Support](docs/VIVADO-FORMAT-SUPPORT.md)
- [Zoom Controls](docs/ZOOM-SUPPORT.md)

## License

MIT License - See LICENSE file for details

## Author

Created for FPGA timing analysis and debugging, powered by AI.

## Changelog

### v0.1.0 (2026-01-13)
- ✅ Initial release
- ✅ TWR file parsing (Vivado & ISE formats)
- ✅ Interactive timing graph with zoom/pan
- ✅ Three-path visualization (source clock, data, dest clock)
- ✅ Cursor-based path highlighting
- ✅ Hover tooltips with detailed timing info
- ✅ Graphviz-based SVG rendering
- ✅ Mouse wheel zoom and drag-to-pan
- ✅ Keyboard shortcuts (+, -, 0, r)

## Acknowledgments

- **Graphviz** visualization via [@hpcc-js/wasm](https://github.com/hpcc-systems/hpcc-js-wasm)
- Built with **VSCode Extension API**
- Inspired by Xilinx Vivado/ISE timing analyzers
- Created entirely with **GitHub Copilot CLI** and **Claude Sonnet 4.5**


```
xilinx-timing-analyzer/
├── src/
│   ├── extension.ts           # Main entry point
│   ├── parser/
│   │   └── twrParser.ts       # Parse .twr files
│   ├── providers/
│   │   ├── hoverProvider.ts   # Hover tooltips
│   │   └── decorationProvider.ts # Text highlighting
│   ├── visualization/
│   │   └── graphPanel.ts      # Graphviz visualization
│   └── types/
│       └── timing.ts          # TypeScript interfaces
```

## License

ISC

## Version

0.1.0 - Initial Release
