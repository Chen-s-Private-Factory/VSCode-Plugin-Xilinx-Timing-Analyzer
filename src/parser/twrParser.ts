import * as vscode from 'vscode';
import { TimingPath, TimingReport, PathElement } from '../types/timing';

export class TwrParser {
    private document: vscode.TextDocument;

    constructor(document: vscode.TextDocument) {
        this.document = document;
    }

    public parse(): TimingReport {
        const text = this.document.getText();
        const paths = this.extractTimingPaths(text);
        
        return {
            paths,
            constraints: [],
            summary: {
                totalPaths: paths.length,
                failedPaths: paths.filter(p => p.failed).length,
                criticalPath: paths.find(p => p.failed)
            }
        };
    }

    private extractTimingPaths(text: string): TimingPath[] {
        const paths: TimingPath[] = [];
        const lines = text.split('\n');
        
        let currentPath: Partial<TimingPath> | null = null;
        let pathId = 0;
        let inDataPath = false;
        let inSourceClockPath = false;
        let inDestClockPath = false;
        let last_node : PathElement;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Detect start of timing path section (Vivado or ISE format)
            const slackViolatedMatch = line.match(/^Slack\s+\(VIOLATED\)\s*:\s*(-?\d+\.?\d*)\s*ns/i);
            const slackMetMatch = line.match(/^Slack\s+\(MET\)\s*:\s*(-?\d+\.?\d*)\s*ns/i);
            const slackSetupMatch = line.match(/^Slack\s+\((setup|hold)\s+path\)\s*:\s*(-?\d+\.?\d*)\s*ns/i);
            
            if (slackViolatedMatch || slackMetMatch || slackSetupMatch) {
                if (currentPath && currentPath.source && currentPath.destination) {
                    paths.push(this.finalizePath(currentPath, pathId++));
                }
                currentPath = {
                    startLine: i,
                    pathElements: [],
                    sourceClockElements: [],
                    destClockElements: []
                };
                
                // Extract slack immediately
                if (slackViolatedMatch) {
                    currentPath.slack = parseFloat(slackViolatedMatch[1]);
                    currentPath.failed = true;
                } else if (slackMetMatch) {
                    currentPath.slack = parseFloat(slackMetMatch[1]);
                    currentPath.failed = false;
                } else if (slackSetupMatch) {
                    currentPath.slack = parseFloat(slackSetupMatch[2]);
                    currentPath.failed = currentPath.slack < 0;
                }
                
                inDataPath = false;
                inSourceClockPath = false;
                inDestClockPath = false;
            }
            
            if (!currentPath) {
                continue;
            }
            
            // Extract source (handle both formats)
            const sourceMatch = line.match(/^\s*Source:\s+(.+?)(?:\s+\(|$)/i);
            if (sourceMatch) {
                const fullSource = sourceMatch[1].trim();
                // Extract just the register/cell name (last part after /)
                const parts = fullSource.split('/');
                currentPath.source = parts[parts.length - 1] || fullSource;
            }
            
            // Extract destination
            const destMatch = line.match(/^\s*Destination:\s+(.+?)(?:\s+\(|$)/i);
            if (destMatch) {
                const fullDest = destMatch[1].trim();
                const parts = fullDest.split('/');
                currentPath.destination = parts[parts.length - 1] || fullDest;
            }
            
            // Extract requirement
            const reqMatch = line.match(/^\s*Requirement:\s*(-?\d+\.?\d*)\s*ns/i);
            if (reqMatch) {
                currentPath.requirement = parseFloat(reqMatch[1]);
            }
            
            // Extract data path delay
            const dataDelayMatch = line.match(/^\s*Data Path Delay:\s*(\d+\.?\d*)\s*ns/i);
            if (dataDelayMatch) {
                currentPath.delay = parseFloat(dataDelayMatch[1]);
            }
            
            // Extract clock information
            const srcClockMatch = line.match(/clocked by\s+(.+?)(?:\s+\{|$)/i);
            if (srcClockMatch && !currentPath.clockPath) {
                if (!currentPath.clockPath) {
                    currentPath.clockPath = {} as any;
                }
                const clockName = srcClockMatch[1].trim();
                const parts = clockName.split('/');
                currentPath.clockPath!.sourceClock = parts[parts.length - 1] || clockName;
            }
            
            const destClockLineMatch = line.match(/clocked by\s+(.+?)(?:\s+\{|$)/i);
            if (destClockLineMatch && currentPath.clockPath && !currentPath.clockPath.destinationClock) {
                const clockName = destClockLineMatch[1].trim();
                const parts = clockName.split('/');
                currentPath.clockPath!.destinationClock = parts[parts.length - 1] || clockName;
            }
            
            const skewMatch = line.match(/^\s*Clock Path Skew:\s*(-?\d+\.?\d*)\s*ns/i);
            if (skewMatch) {
                if (!currentPath.clockPath) {
                    currentPath.clockPath = {} as any;
                }
                currentPath.clockPath!.clockSkew = parseFloat(skewMatch[1]);
            }
            
            const uncertaintyMatch = line.match(/^\s*Clock Uncertainty:\s*(\d+\.?\d*)\s*ns/i);
            if (uncertaintyMatch) {
                if (!currentPath.clockPath) {
                    currentPath.clockPath = {} as any;
                }
                currentPath.clockPath!.uncertainty = parseFloat(uncertaintyMatch[1]);
            }
            
            // Detect start of detailed path listing
            if (line.includes('Location') && line.includes('Delay type') && line.includes('Physical Resource')) {
                inDataPath = true;
                inSourceClockPath = false;
                inDestClockPath = false;
                continue;
            }
            
            // Detect clock section markers - source clock
            //if (line.match(/^\s*\(clock .+ rise edge\)/i)) {
                // Check if this is source or destination clock
                const nextLine = lines[i + 1];
                if (nextLine && currentPath) {
                    // Look ahead to see if we hit "---" soon (indicates end of source clock section)
                    let isSourceClock = true;
                    for (let j = i; j < Math.min(i + 20, lines.length); j++) {
                        if (lines[j].includes('---') && lines[j + 1] && lines[j + 1].includes('SLICE')) {
                            // This is the divider between source clock and data path
                            isSourceClock = true;
                            break;
                        }
                        if (lines[j].includes('(clock ') && j > i) {
                            // Found another clock section, so first was source
                            isSourceClock = false;
                            break;
                        }
                    }
                    
                    if (isSourceClock && !currentPath.sourceClockElements) {
                        inSourceClockPath = true;
                        inDestClockPath = false;
                        inDataPath = false;
                    } else if (!isSourceClock && !currentPath.destClockElements) {
                        inDestClockPath = true;
                        inSourceClockPath = false;
                        inDataPath = false;
                    }
                }
                //continue;
            //}
            
            // Parse clock path elements
            if ((inSourceClockPath || inDestClockPath) && line.trim().length > 0 && !line.includes('---')) {
                const targetArray = inSourceClockPath ? currentPath.sourceClockElements : currentPath.destClockElements;
                
                // Try Vivado format
                const vivadoMatch = line.match(/^\s*(\S+)\s+([\w_]+)\s+\(([^)]+)\)\s+(-?\d+\.?\d+)\s+(-?\d+\.?\d+)\s+[rf]?\s*(.+)?$/);
                if (vivadoMatch && targetArray) {
                    const location = vivadoMatch[1];
                    const cellType = vivadoMatch[2];
                    const delayType = vivadoMatch[3];
                    const incr = parseFloat(vivadoMatch[4]);
                    const resource = vivadoMatch[6] ? vivadoMatch[6].trim() : cellType;
                    
                    let type: 'logic' | 'net' | 'clock' = 'clock';
                    if (cellType.includes('BUFG') || cellType.includes('DCM') || cellType.includes('MMCM') ||cellType.includes('PLL') || cellType.includes('GTYE4')) {
                        type = 'clock';
                    }
                    
                    targetArray.push({
                        type,
                        name: resource,
                        delay: incr,
                        location,
                        delayType,
                        resource: cellType
                    });
                    continue;
                }
                
                // Try net line format
                const netMatch = line.match(/^\s*net\s+\(([^)]+)\)\s+(-?\d+\.?\d+)\s+(-?\d+\.?\d+)\s+(.+)?$/);
                if (netMatch && targetArray) {
                    const fanout = netMatch[1];
                    const incr = parseFloat(netMatch[2]);
                    const netName = netMatch[4] ? netMatch[4].trim() : 'net';
                    
                    targetArray.push({
                        type: 'net',
                        name: netName,
                        delay: incr,
                        delayType: `net ${fanout}`,
                        resource: netName
                    });
                    continue;
                }
            }
            
            // Detect divider between sections
            if (line.includes('---') && (inSourceClockPath || inDestClockPath)) {
                // Check if next section is data path or another clock path
                const nextLine = lines[i + 1];
                if (nextLine && nextLine.match(/^\s*\(clock .+ rise edge\)/i)) {
                    // Another clock section coming
                    inSourceClockPath = false;
                    inDestClockPath = true;
                } else if (nextLine && nextLine.match(/^\s*\S+\s+([\w_]+)\s+\(/)) {
                    // Data path starting
                    inSourceClockPath = false;
                    inDestClockPath = false;
                    inDataPath = true;
                }
                continue;
            }
            
            // Parse data path elements
            // Vivado format: "    SLICE_X9Y337         FDCE (Prop_CFF_SLICEL_C_Q)      0.079  1050.452 r  ..."
            // ISE format:    "    SLICE_X12Y34.AQ      Tcko                  0.514   data_reg<0>"
            if (inDataPath && line.trim().length > 0 && !line.includes('---')) {
                // Try Vivado format first (with Incr and Path columns)
                //     SLICE_X45Y30.CLK     Tcinck                1.002   divfp_i0/sig000000a4
                const vivadoMatch = line.match(/\s*([A-Z]+)_X([0-9]+)Y([0-9]+)\.CLK.*\s+(.+)?\s+(-?\d+\.?\d+)\s+(.+)?$/);
                if (vivadoMatch) {
                  const type1 = vivadoMatch[1];
                  const x = vivadoMatch[2];
                  const y = vivadoMatch[3];
                  const xy = `X${x}Y${y}`;
                    const location = `${type1}_${xy}.${vivadoMatch[4]}`;
                    const cellType = vivadoMatch[5];
                    const delayType = vivadoMatch[6];
                    const incr = parseFloat(vivadoMatch[7]);
                    const pathTime = parseFloat(vivadoMatch[8]);
                    const resource = vivadoMatch[9] ? vivadoMatch[9].trim() : cellType;
                    
                    // Determine element type
                    let type: 'logic' | 'net' | 'clock' = 'logic';
                    if (cellType.includes('BUFG') || cellType.includes('MMCM') || cellType.includes('PLL')) {
                        type = 'clock';
                    }
                    
                    currentPath.pathElements?.push({
                        type,
                        name: resource,
                        delay: incr,
                        location,
                        delayType,
                        resource: cellType,
                        xy: xy
                    });
                    continue;
                }
                
                // Try net line format: "                     net (fo=2, routed)           3.077  1053.529    ..."
                //const netMatch = line.match(/^\s*net\s+\(([^)]+)\)\s+(-?\d+\.?\d+)\s+(-?\d+\.?\d+)\s+(.+)?$/);
                // SLICE_X45Y27.G1      net (fanout=2)        2.917   fp32_cores_out_div_a<17>
                const netMatch = line.match(/\s+(.+)?net \(fanout=([0-9]+)\)\s+(-?\d+\.?\d+)\s+(.+)?$/);
                if (netMatch) {
                    const fo = parseFloat(netMatch[2]);
                    const time = parseFloat(netMatch[3]);
                    const src = netMatch[1];
                    const netName = netMatch[4] ? netMatch[4].trim() : 'net';
                    
                    currentPath.pathElements?.push({
                        type: 'net',
                        name: src,
                        delay: time,
                        delayType: `net fanout=${fo}`,
                        resource: netName
                    });
                    continue;
                }
                
                // Try ISE format
                // normal line
                //const iseMatch = line.match(/^\s*(\S+)\s+([\w\s()]+?)\s+(\d+\.?\d+)\s+(.+)?$/);
                //if (paths[0].pathElements.length > 0) { // XXX describe
                //    last_node = paths[0].pathElements[paths[0].pathElements.length-1];
                //}
                const iseMatch = line.match(/^\s*([SLICE|MULT18X18]+)_X([0-9]+)Y([0-9]+)\.(\S+)\s+([\w\s()]+?)\s+(\d+\.?\d+)\s+(.+)?$/);
                if (iseMatch) {
                    const type1 = iseMatch[1];
                    const x = iseMatch[2];
                    const y = iseMatch[3];
                    const xy = `X${x}Y${y}`;
                    const location = `${iseMatch[0]}_${iseMatch[1]}${iseMatch[2]}${iseMatch[3]}.${iseMatch[4]}`;
                    const delayType = iseMatch[5].trim();
                    const delay = parseFloat(iseMatch[6]);
                    const resource = iseMatch[7] ? iseMatch[7].trim() : '';
                    if (type1 == "MULT18X18") {
                        vscode.window.showInformationMessage('MULT18X18 not implemented, use null node');
                        console.log ("MULT18X18 not implemented, use null node");
                        currentPath.pathElements?.push ({
                            type: 'undefined',
                            name: 'undefined',
                            delay: 0,
                            location: 'undefined',
                            delayType: 'undefined',
                            resource: 'undefined',
                            xy: `X0Y0`,
                            //xy: paths[0].pathElements[paths[0].pathElements.length-1].xy
                        } as PathElement);
                        continue;
                    }
                    let type: 'logic' | 'net' | 'clock' = 'logic';
                    if (delayType.toLowerCase().includes('net') || delayType.includes('fanout')) {
                        type = 'net';
                    } else if (delayType.toLowerCase().includes('clock')) {
                        type = 'clock';
                    }
                    
                    currentPath.pathElements?.push({
                        type,
                        name: resource || location,
                        delay,
                        location,
                        delayType,
                        resource,
                        xy: xy
                    });
                }
            }
            
            // Detect end of path details
            if (line.includes('slack') && line.match(/-?\d+\.?\d+/) && inDataPath) {
                inDataPath = false;
                inSourceClockPath = false;
                inDestClockPath = false;
            }
            
            if (currentPath) {
                currentPath.endLine = i;
            }
        }
        
        // Add last path
        if (currentPath && currentPath.source && currentPath.destination) {
            paths.push(this.finalizePath(currentPath, pathId));
        }
        
        return paths;
    }

    private finalizePath(partial: Partial<TimingPath>, id: number): TimingPath {
        return {
            id: `path_${id}`,
            source: partial.source || 'Unknown',
            destination: partial.destination || 'Unknown',
            slack: partial.slack || 0,
            requirement: partial.requirement || 0,
            delay: partial.pathElements?.reduce((sum, el) => sum + el.delay, 0) || 0,
            failed: partial.failed || false,
            pathElements: partial.pathElements || [],
            startLine: partial.startLine || 0,
            endLine: partial.endLine || 0
        };
    }

    public getPathAtLine(lineNumber: number): TimingPath | undefined {
        const report = this.parse();
        return report.paths.find(path => 
            lineNumber >= path.startLine && lineNumber <= path.endLine
        );
    }
}
