import * as vscode from 'vscode';
import { TimingHoverProvider } from './providers/hoverProvider';
import { TimingDecorationProvider } from './providers/decorationProvider';
import { TimingGraphPanel } from './visualization/graphPanel';
import { TwrParser } from './parser/twrParser';

export function activate(context: vscode.ExtensionContext) {
    console.log('Xilinx Timing Analyzer is now active');

    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider(
        { scheme: 'file', language: 'twr' },
        new TimingHoverProvider()
    );

    // Initialize decoration provider
    const decorationProvider = new TimingDecorationProvider();

    // Update decorations when active editor changes
    const activeEditorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            decorationProvider.updateDecorations(editor);
        }
    });

    // Update decorations when document changes
    const documentChangeDisposable = vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            decorationProvider.updateDecorations(editor);
        }
    });
    
    // Update decorations when cursor position changes
    const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(event => {
        if (event.textEditor) {
            decorationProvider.updateDecorations(event.textEditor);
        }
    });

    // Initial decoration for current editor
    if (vscode.window.activeTextEditor) {
        decorationProvider.updateDecorations(vscode.window.activeTextEditor);
    }

    // Register command to show timing graph
    const showGraphCommand = vscode.commands.registerCommand(
        'xilinx-timing-analyzer.showTimingGraph',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            if (editor.document.languageId !== 'twr') {
                vscode.window.showErrorMessage('Please open a .twr file');
                return;
            }

            const parser = new TwrParser(editor.document);
            const cursorLine = editor.selection.active.line;
            const currentPath = parser.getPathAtLine(cursorLine);

            if (!currentPath) {
                vscode.window.showInformationMessage('No timing path found at cursor position');
                return;
            }

            await TimingGraphPanel.createOrShow(context.extensionUri, [currentPath]);
        }
    );

    // Register command to show timing graph to the side (like markdown preview)
    const showGraphToSideCommand = vscode.commands.registerCommand(
        'xilinx-timing-analyzer.showTimingGraphToSide',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            if (editor.document.languageId !== 'twr') {
                vscode.window.showErrorMessage('Please open a .twr file');
                return;
            }

            const parser = new TwrParser(editor.document);
            const cursorLine = editor.selection.active.line;
            const currentPath = parser.getPathAtLine(cursorLine);

            if (!currentPath) {
                vscode.window.showInformationMessage('No timing path found at cursor position');
                return;
            }

            await TimingGraphPanel.createOrShowToSide(context.extensionUri, [currentPath]);
        }
    );

    // Register command to analyze timing
    const analyzeCommand = vscode.commands.registerCommand(
        'xilinx-timing-analyzer.analyzeTiming',
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            if (editor.document.languageId !== 'twr') {
                vscode.window.showErrorMessage('Please open a .twr file');
                return;
            }

            const parser = new TwrParser(editor.document);
            const report = parser.parse();

            const message = `Found ${report.paths.length} timing paths. ${report.summary.failedPaths} failed.`;
            
            if (report.summary.failedPaths > 0) {
                vscode.window.showWarningMessage(message);
            } else {
                vscode.window.showInformationMessage(message);
            }
        }
    );

    context.subscriptions.push(
        hoverProvider,
        activeEditorChangeDisposable,
        documentChangeDisposable,
        selectionChangeDisposable,
        showGraphCommand,
        showGraphToSideCommand,
        analyzeCommand,
        decorationProvider
    );
}

export function deactivate() {
    console.log('Xilinx Timing Analyzer is now deactivated');
}
