import * as vscode from 'vscode';
import { TwrParser } from '../parser/twrParser';

export class TimingDecorationProvider {
    private currentPathDecorationType: vscode.TextEditorDecorationType;

    constructor() {
        this.currentPathDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 165, 0, 0.15)',
            border: '1px solid rgba(255, 165, 0, 0.4)',
            isWholeLine: true
        });
    }

    public updateDecorations(editor: vscode.TextEditor) {
        if (editor.document.languageId !== 'twr') {
            return;
        }

        const parser = new TwrParser(editor.document);
        const cursorLine = editor.selection.active.line;
        
        // Find the path at cursor position
        const currentPath = parser.getPathAtLine(cursorLine);
        
        const decorations: vscode.DecorationOptions[] = [];
        
        if (currentPath) {
            const range = new vscode.Range(
                new vscode.Position(currentPath.startLine, 0),
                new vscode.Position(currentPath.endLine, 0)
            );

            decorations.push({
                range,
                hoverMessage: currentPath.failed 
                    ? `❌ Failed timing path: ${currentPath.slack.toFixed(3)} ns slack`
                    : `✅ Met timing path: ${currentPath.slack.toFixed(3)} ns slack`
            });
        }

        editor.setDecorations(this.currentPathDecorationType, decorations);
    }

    public dispose() {
        this.currentPathDecorationType.dispose();
    }
}
