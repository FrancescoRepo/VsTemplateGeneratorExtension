import path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { TemplateGenerator } from "./template-generator";

export class SolutionExplorerWebview implements vscode.WebviewViewProvider {
  private _htmlFilePath: any | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {
    this._htmlFilePath = path.join(
      this.context.extensionPath,
      "views",
      "templateView.html"
    );
  }

  // This method gets called when the webview is created
  resolveWebviewView(webviewView: vscode.WebviewView) {
    // Configure the webview
    webviewView.webview.options = {
      enableScripts: true,
    };

    fs.readFile(this._htmlFilePath, "utf-8", (err, htmlContent) => {
      if (err) {
        console.error("Error reading HTML file:", err);
        return;
      }

      // Insert additional JavaScript to inject project options into the HTML
      webviewView.webview.html = htmlContent.replace(
        "<!-- Project options will be injected here -->",
        this.getProjectOptions()
      );
    });

    webviewView.webview.html = this.getHtmlContent().replace(
      "<!-- Project options will be injected here -->",
      this.getProjectOptions()
    );

    // Handle messages from the webview (e.g., when the user selects a project)
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === "projectSelected") {
        vscode.window.showInformationMessage(
          `You selected: ${message.selectedProject}`
        );
      } else if (message.command === "generateTemplate") {
        const templateGenerator = new TemplateGenerator();
        templateGenerator.generateVSTemplate(
          message.selectedProject,
          message.templateName,
          message.templateDescription
        );
      }
    });

    // Optionally refresh content when the webview becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        webviewView.webview.html = this.getHtmlContent().replace(
          "<!-- Project options will be injected here -->",
          this.getProjectOptions()
        );
      }
    });
  }

  // Method to generate HTML content for the webview
  private getHtmlContent(): string {
    fs.readFile(this._htmlFilePath, "utf-8", (err, htmlContent) => {
      if (err) {
        console.error("Error reading HTML file:", err);
        return;
      }

      // Insert additional JavaScript to inject project options into the HTML
      return htmlContent;
    });

    return "";
  }

  private getProjectOptions(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    if (workspaceFolders.length === 0) {
      return "";
    }

    const solutionDir = workspaceFolders[0].uri.fsPath;
    let projectNames: string[] = [];

    try {
      // Retrieve all .sln files in the workspace
      const slnFiles = fs
        .readdirSync(solutionDir)
        .filter((file) => file.endsWith(".sln"));
      if (slnFiles.length === 0) {
        return "";
      }

      // Use the first .sln file found
      const slnFileFullPath = path.join(solutionDir, slnFiles[0]);
      const slnContent = fs.readFileSync(slnFileFullPath, "utf-8");
      const projectLines = slnContent
        .split("\n")
        .filter((line) => line.startsWith("Project("));

      // Extract project names from the solution file
      projectNames = projectLines
        .map((line) => {
          const match = line.match(/=\s*"([^"]+)"\s*,/);
          return match ? match[1] : ""; // Get the project name from the match
        })
        .filter((name) => name); // Filter out empty names
    } catch (error) {
      console.error("Error reading solution file:", error);
    }

    return projectNames
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("");
  }
}
