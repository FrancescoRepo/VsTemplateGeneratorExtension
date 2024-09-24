import * as vscode from "vscode";
import { SolutionExplorerWebview } from "./solution-explorer-webview";

export function activate(context: vscode.ExtensionContext) {
  // Register the webview view in the activity bar
  vscode.window.registerWebviewViewProvider(
    "solutionExplorerWebview",
    new SolutionExplorerWebview(context)
  );
}
