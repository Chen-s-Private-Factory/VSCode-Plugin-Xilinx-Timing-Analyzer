import * as vscode from 'vscode';
import { TwrParser } from '../parser/twrParser';

export class TimingHoverProvider implements vscode.HoverProvider {
    
    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        
        // Only provide hover for .twr files
        if (document.languageId !== 'twr') {
            return null;
        }

        const parser = new TwrParser(document);
        const path = parser.getPathAtLine(position.line);

        if (!path) {
            return null;
        }

        // Create hover content
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        
        markdown.appendMarkdown(`### ${path.failed ? '❌' : '✅'} Timing Path\n\n`);
        markdown.appendMarkdown(`**Source:** ${path.source}\n\n`);
        markdown.appendMarkdown(`**Destination:** ${path.destination}\n\n`);
        markdown.appendMarkdown(`**Slack:** ${path.slack.toFixed(3)} ns ${path.failed ? '(FAILED)' : '(MET)'}\n\n`);
        markdown.appendMarkdown(`**Requirement:** ${path.requirement.toFixed(3)} ns\n\n`);
        markdown.appendMarkdown(`**Total Delay:** ${path.delay.toFixed(3)} ns\n\n`);
        
        // Add clock path information
        if (path.clockPath) {
            markdown.appendMarkdown(`---\n\n`);
            markdown.appendMarkdown(`**Clock Information:**\n\n`);
            markdown.appendMarkdown(`- Source Clock: ${path.clockPath.sourceClock}\n`);
            markdown.appendMarkdown(`- Destination Clock: ${path.clockPath.destinationClock}\n`);
            markdown.appendMarkdown(`- Clock Skew: ${path.clockPath.clockSkew?.toFixed(3) || '0.000'} ns\n`);
            markdown.appendMarkdown(`- Uncertainty: ${path.clockPath.uncertainty?.toFixed(3) || '0.000'} ns\n\n`);
        }
        
        // Add detailed path breakdown
        if (path.pathElements.length > 0) {
            markdown.appendMarkdown(`---\n\n`);
            markdown.appendMarkdown(`**Path Details (${path.pathElements.length} elements):**\n\n`);
            
            const logicElements = path.pathElements.filter(el => el.type === 'logic');
            const netElements = path.pathElements.filter(el => el.type === 'net');
            const clockElements = path.pathElements.filter(el => el.type === 'clock');
            
            const logicDelay = logicElements.reduce((sum, el) => sum + el.delay, 0);
            const netDelay = netElements.reduce((sum, el) => sum + el.delay, 0);
            const clockDelay = clockElements.reduce((sum, el) => sum + el.delay, 0);
            
            markdown.appendMarkdown(`- **Logic:** ${logicDelay.toFixed(3)} ns (${logicElements.length} elements)\n`);
            markdown.appendMarkdown(`- **Net:** ${netDelay.toFixed(3)} ns (${netElements.length} elements)\n`);
            if (clockElements.length > 0) {
                markdown.appendMarkdown(`- **Clock:** ${clockDelay.toFixed(3)} ns (${clockElements.length} elements)\n`);
            }
            
            // Show first few elements as preview
            markdown.appendMarkdown(`\n**Path Preview:**\n\n`);
            const previewCount = Math.min(5, path.pathElements.length);
            for (let i = 0; i < previewCount; i++) {
                const element = path.pathElements[i];
                const icon = element.type === 'logic' ? '🔲' : element.type === 'net' ? '🔗' : '🕐';
                markdown.appendMarkdown(`${i + 1}. ${icon} ${element.location || ''} ${element.delayType || element.type}: ${element.delay.toFixed(3)} ns\n`);
            }
            
            if (path.pathElements.length > previewCount) {
                markdown.appendMarkdown(`\n... and ${path.pathElements.length - previewCount} more elements\n`);
            }
        }

        return new vscode.Hover(markdown);
    }
}
