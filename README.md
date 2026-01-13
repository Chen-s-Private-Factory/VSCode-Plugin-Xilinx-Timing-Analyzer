# Xilinx Timing Analyzer

> NOTE: Every code and doc in this repo is created by **Github Copilot CLI** w/ **claude-sonnet-4.5** model
> 

A VSCode extension for analyzing Xilinx .twr (Timing Report) files and visualizing critical timing paths generated purely by AI.

## Features

- **Automatic Path Detection**: Parses .twr files and identifies failed timing paths
- **Hover Information**: Hover over timing paths to see detailed slack and delay information
- **Visual Highlighting**: Failed timing paths are highlighted with color-coded decorations
- **Graphviz Visualization**: View timing graphs in a side panel showing critical paths

## Usage

1. Open a `.twr` file in VSCode
2. Failed timing paths will be automatically highlighted
3. Hover over any timing path to see details
4. Use Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run:
   - `Xilinx: Show Timing Graph` - Display graphical visualization
   - `Xilinx: Analyze Timing Paths` - Show summary of timing analysis

## Requirements

- VSCode 1.80.0 or higher

## Development

### Setup
```bash
npm install
```

### Compile
```bash
npm run compile
```

### Watch Mode
```bash
npm run watch
```

### Test the Extension
1. Press `F5` to open Extension Development Host
2. Open a `.twr` file
3. Test the features

## Project Structure

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
