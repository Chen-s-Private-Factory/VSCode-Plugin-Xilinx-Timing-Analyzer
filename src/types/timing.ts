export interface TimingPath {
    id: string;
    source: string;
    destination: string;
    slack: number;
    requirement: number;
    delay: number;
    failed: boolean;
    pathElements: PathElement[];
    sourceClockElements?: PathElement[];  // NEW: Source clock path
    destClockElements?: PathElement[];    // NEW: Destination clock path
    clockPath?: ClockPathInfo;
    startLine: number;
    endLine: number;
}

export interface PathElement {
    type: 'logic' | 'net' | 'clock';
    name: string;
    delay: number;
    location?: string;
    delayType?: string;
    resource?: string;
}

export interface ClockPathInfo {
    sourceClock: string;
    destinationClock: string;
    clockSkew: number;
    uncertainty: number;
}

export interface TimingReport {
    paths: TimingPath[];
    constraints: Constraint[];
    summary: Summary;
}

export interface Constraint {
    name: string;
    requirement: number;
    worstSlack: number;
    paths: number;
}

export interface Summary {
    totalPaths: number;
    failedPaths: number;
    criticalPath?: TimingPath;
}
