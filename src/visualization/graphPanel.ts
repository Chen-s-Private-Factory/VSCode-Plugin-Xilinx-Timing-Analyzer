import * as vscode from 'vscode';
import { Graphviz } from '@hpcc-js/wasm';
import { TimingPath, PathElement } from '../types/timing';

export class TimingGraphPanel {
    public static currentPanel: TimingGraphPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    public static async createOrShow(extensionUri: vscode.Uri, paths: TimingPath[], viewColumn?: vscode.ViewColumn) {
        const column = viewColumn || (vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined);

        if (TimingGraphPanel.currentPanel) {
            TimingGraphPanel.currentPanel.panel.reveal(column);
            await TimingGraphPanel.currentPanel.update(paths);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'timingGraph',
            'Timing Graph',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        TimingGraphPanel.currentPanel = new TimingGraphPanel(panel, extensionUri);
        await TimingGraphPanel.currentPanel.update(paths);
    }
    
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

    public async update(paths: TimingPath[]) {
        const graphviz = await Graphviz.load();
        const dotSource = this.generateDotGraph(paths);
        
        try {
            const svg = graphviz.dot(dotSource);
            this.panel.webview.html = this.getWebviewContent(svg);
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating graph: ${error}`);
        }
    }

    private generateDotGraph(paths: TimingPath[]): string {
        let dot = 'digraph TimingPaths {\n';
        dot += '  rankdir=LR;\n';
        dot += '  node [shape=box, style=rounded, fontsize=10];\n';
        dot += '  edge [fontsize=9];\n';
        dot += '  graph [fontsize=10, compound=true];\n\n';

        // Should only have one path (the one at cursor)
        if (paths.length === 0) {
            dot += '  empty [label="No timing path selected"];\n';
            dot += '}';
            return dot;
        }
        
        const path = paths[0];  // Only show the current path
        const color = path.failed ? 'red' : 'green';
        const fillColor = path.failed ? '#ffebee' : '#e8f5e9';
        
        dot += `  labelloc="t";\n`;
        dot += `  label="${path.failed ? '❌' : '✅'} Timing Path: ${path.source} → ${path.destination}\\nSlack: ${path.slack.toFixed(3)}ns | Delay: ${path.delay.toFixed(3)}ns";\n\n`;
        
        // 1. SOURCE CLOCK PATH
        if (path.sourceClockElements && path.sourceClockElements.length > 0) {
            dot += `  subgraph cluster_source_clock {\n`;
            dot += `    label="Source Clock Path";\n`;
            dot += `    style=filled;\n`;
            dot += `    fillcolor="#e3f2fd";\n`;
            dot += `    color=blue;\n`;
            dot += `    fontcolor=blue;\n`;
            dot += `    fontsize=12;\n\n`;
            
            let prevNode = null;
            for (let i = 0; i < path.sourceClockElements.length; i++) {
                const element = path.sourceClockElements[i];
                const nodeId = `src_clk_${i}`;
                
                const label = this.formatNodeLabel(element);
                const nodeColor = element.type === 'net' ? '#fff9c4' : '#bbdefb';
                const shape = element.type === 'net' ? 'ellipse' : 'box';
                
                dot += `    ${nodeId} [label="${label}", shape=${shape}, style=filled, fillcolor="${nodeColor}", color=blue];\n`;
                
                if (prevNode) {
                    dot += `    ${prevNode} -> ${nodeId} [color=blue, label="${element.delay.toFixed(3)}ns"];\n`;
                }
                prevNode = nodeId;
            }
            
            dot += `  }\n\n`;
        }
        
        // 2. DATA PATH (combinational logic)
        if (path.pathElements && path.pathElements.length > 0) {
            dot += `  subgraph cluster_data_path {\n`;
            dot += `    label="Data Path (Logic + Routing)";\n`;
            dot += `    style=filled;\n`;
            dot += `    fillcolor="${fillColor}";\n`;
            dot += `    color=${color};\n`;
            dot += `    fontcolor=${color};\n`;
            dot += `    fontsize=12;\n\n`;
            
            let prevNode = null;
            const sourceClockLastNode = path.sourceClockElements && path.sourceClockElements.length > 0 
                ? `src_clk_${path.sourceClockElements.length - 1}` 
                : null;
            
            for (let i = 0; i < path.pathElements.length; i++) {
                const element = path.pathElements[i];
                const nodeId = `data_${i}`;
                
                const label = this.formatNodeLabel(element);
                let nodeColor = fillColor;
                let shape = 'box';
                
                if (element.type === 'net') {
                    shape = 'ellipse';
                    nodeColor = '#fff9c4';
                } else if (element.type === 'clock') {
                    nodeColor = '#e1f5fe';
                }
                
                dot += `    ${nodeId} [label="${label}", shape=${shape}, style=filled, fillcolor="${nodeColor}", color=${color}];\n`;
                
                if (prevNode) {
                    const edgeStyle = element.type === 'net' ? 'dashed' : 'solid';
                    dot += `    ${prevNode} -> ${nodeId} [color=${color}, style=${edgeStyle}, label="${element.delay.toFixed(3)}ns"];\n`;
                } else if (sourceClockLastNode) {
                    // Connect from source clock path to data path
                    dot += `  ${sourceClockLastNode} -> ${nodeId} [color=${color}, style=bold, label="Launch", ltail=cluster_source_clock];\n`;
                }
                
                prevNode = nodeId;
            }
            
            dot += `  }\n\n`;
        }
        
        // 3. DESTINATION CLOCK PATH
        if (path.destClockElements && path.destClockElements.length > 0) {
            dot += `  subgraph cluster_dest_clock {\n`;
            dot += `    label="Destination Clock Path";\n`;
            dot += `    style=filled;\n`;
            dot += `    fillcolor="#f3e5f5";\n`;
            dot += `    color=purple;\n`;
            dot += `    fontcolor=purple;\n`;
            dot += `    fontsize=12;\n\n`;
            
            let prevNode = null;
            const dataPathLastNode = path.pathElements && path.pathElements.length > 0 
                ? `data_${path.pathElements.length - 1}` 
                : null;
            
            for (let i = 0; i < path.destClockElements.length; i++) {
                const element = path.destClockElements[i];
                const nodeId = `dest_clk_${i}`;
                
                const label = this.formatNodeLabel(element);
                const nodeColor = element.type === 'net' ? '#fff9c4' : '#e1bee7';
                const shape = element.type === 'net' ? 'ellipse' : 'box';
                
                dot += `    ${nodeId} [label="${label}", shape=${shape}, style=filled, fillcolor="${nodeColor}", color=purple];\n`;
                
                if (prevNode) {
                    dot += `    ${prevNode} -> ${nodeId} [color=purple, label="${element.delay.toFixed(3)}ns"];\n`;
                } else if (dataPathLastNode) {
                    // Connect from data path to destination clock path
                    dot += `  ${dataPathLastNode} -> ${nodeId} [color=purple, style=bold, label="Capture", lhead=cluster_dest_clock];\n`;
                }
                
                prevNode = nodeId;
            }
            
            dot += `  }\n\n`;
        }
        
        // Add timing summary
        const logicDelay = path.pathElements ? path.pathElements.filter(el => el.type === 'logic').reduce((sum, el) => sum + el.delay, 0) : 0;
        const netDelay = path.pathElements ? path.pathElements.filter(el => el.type === 'net').reduce((sum, el) => sum + el.delay, 0) : 0;
        
        dot += `  // Summary: Logic=${logicDelay.toFixed(3)}ns, Net=${netDelay.toFixed(3)}ns, Total=${path.delay.toFixed(3)}ns\n`;
        
        dot += '}';
        return dot;
    }
    
    private formatNodeLabel(element: PathElement): string {
        const location = element.location || '';
        const delayType = element.delayType || element.type;
        
        if (element.type === 'net') {
            // Simplified net label
            const netName = element.name.length > 30 ? '...' + element.name.slice(-27) : element.name;
            return `Net\\n${delayType}\\n${element.delay.toFixed(3)}ns`;
        } else {
            // Logic or clock element
            const cellType = element.resource || '';
            return `${location}\\n${cellType}\\n${element.delay.toFixed(3)}ns`;
        }
    }

    private getWebviewContent(svg: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timing Graph</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            overflow: hidden;
        }
        #graph-container {
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            cursor: grab;
            position: relative;
        }
        #graph-container.grabbing {
            cursor: grabbing;
        }
        #controls {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 5px;
            z-index: 1000;
        }
        .control-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 3px;
            font-size: 14px;
            font-weight: bold;
        }
        .control-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        #zoom-level {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 8px 12px;
            border-radius: 3px;
            font-size: 12px;
            min-width: 60px;
            text-align: center;
        }
        #svg-wrapper {
            width: 100%;
            height: 100%;
            transform-origin: 0 0;
        }
        svg {
            display: block;
        }
    </style>
</head>
<body>
    <div id="controls">
        <button class="control-btn" id="zoom-in" title="Zoom In (Ctrl/Cmd + Mouse Wheel)">+</button>
        <div id="zoom-level">100%</div>
        <button class="control-btn" id="zoom-out" title="Zoom Out (Ctrl/Cmd + Mouse Wheel)">-</button>
        <button class="control-btn" id="reset" title="Reset View (Double Click)">Reset</button>
    </div>
    <div id="graph-container">
        <div id="svg-wrapper">
            ${svg}
        </div>
    </div>
    <script>
        (function() {
            const container = document.getElementById('graph-container');
            const wrapper = document.getElementById('svg-wrapper');
            const svgElement = wrapper.querySelector('svg');
            const zoomInBtn = document.getElementById('zoom-in');
            const zoomOutBtn = document.getElementById('zoom-out');
            const resetBtn = document.getElementById('reset');
            const zoomLevelDisplay = document.getElementById('zoom-level');
            
            let scale = 1;
            let translateX = 0;
            let translateY = 0;
            let isDragging = false;
            let startX = 0;
            let startY = 0;
            let lastDoubleClickTime = 0;
            
            const MIN_SCALE = 0.1;
            const MAX_SCALE = 5;
            const ZOOM_STEP = 0.2;
            
            function updateTransform() {
                wrapper.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
                zoomLevelDisplay.textContent = Math.round(scale * 100) + '%';
            }
            
            function zoom(delta, clientX, clientY) {
                const oldScale = scale;
                
                if (delta > 0) {
                    scale = Math.min(scale + ZOOM_STEP, MAX_SCALE);
                } else {
                    scale = Math.max(scale - ZOOM_STEP, MIN_SCALE);
                }
                
                if (oldScale !== scale && clientX !== undefined && clientY !== undefined) {
                    // Zoom towards mouse position
                    const rect = container.getBoundingClientRect();
                    const x = clientX - rect.left;
                    const y = clientY - rect.top;
                    
                    const deltaScale = scale / oldScale;
                    translateX = x - (x - translateX) * deltaScale;
                    translateY = y - (y - translateY) * deltaScale;
                }
                
                updateTransform();
            }
            
            function reset() {
                scale = 1;
                translateX = 0;
                translateY = 0;
                updateTransform();
            }
            
            // Mouse wheel zoom
            container.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -1 : 1;
                zoom(delta, e.clientX, e.clientY);
            }, { passive: false });
            
            // Mouse drag to pan
            container.addEventListener('mousedown', (e) => {
                if (e.button === 0) {  // Left mouse button
                    isDragging = true;
                    startX = e.clientX - translateX;
                    startY = e.clientY - translateY;
                    container.classList.add('grabbing');
                }
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    translateX = e.clientX - startX;
                    translateY = e.clientY - startY;
                    updateTransform();
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    container.classList.remove('grabbing');
                }
            });
            
            // Double click to reset
            container.addEventListener('dblclick', () => {
                reset();
            });
            
            // Button controls
            zoomInBtn.addEventListener('click', () => {
                const rect = container.getBoundingClientRect();
                zoom(1, rect.left + rect.width / 2, rect.top + rect.height / 2);
            });
            
            zoomOutBtn.addEventListener('click', () => {
                const rect = container.getBoundingClientRect();
                zoom(-1, rect.left + rect.width / 2, rect.top + rect.height / 2);
            });
            
            resetBtn.addEventListener('click', () => {
                reset();
            });
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    const rect = container.getBoundingClientRect();
                    zoom(1, rect.left + rect.width / 2, rect.top + rect.height / 2);
                } else if (e.key === '-' || e.key === '_') {
                    e.preventDefault();
                    const rect = container.getBoundingClientRect();
                    zoom(-1, rect.left + rect.width / 2, rect.top + rect.height / 2);
                } else if (e.key === '0' || e.key === 'r') {
                    e.preventDefault();
                    reset();
                }
            });
            
            // Initial setup - ensure SVG fits
            if (svgElement) {
                svgElement.style.maxWidth = 'none';
                svgElement.style.width = 'auto';
                svgElement.style.height = 'auto';
            }
        })();
    </script>
</body>
</html>`;
    }

    public dispose() {
        TimingGraphPanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
