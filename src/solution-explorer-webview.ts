import path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { TemplateGenerator } from "./template-generator";
import { IProject } from "./models/IProject";

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

    this.getHtmlContent().then((htmlContent: string) => {
      webviewView.webview.html = this.replaceHtmlContent(
        htmlContent,
        webviewView
      );
    });

    // Handle messages from the webview (e.g., when the user selects a project)
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === "projectSelected") {
        vscode.window.showInformationMessage(
          `You selected: ${message.selectedProject}`
        );
      } else if (message.command === "generateTemplate") {
        const templateGenerator = new TemplateGenerator();
        templateGenerator.createZipWithTemplate(
          message.selectedProject,
          message.templateName,
          message.templateDescription,
          message.projectFile,
          message.excludePaths,
          this.context.extensionPath
        );
      }
    });

    // Optionally refresh content when the webview becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.getHtmlContent().then((htmlContent: string) => {
          webviewView.webview.html = this.replaceHtmlContent(
            htmlContent,
            webviewView
          );
        });
      }
    });
  }

  private getHtmlContent(): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(this._htmlFilePath, "utf-8", (err, htmlContent) => {
        if (err) {
          console.error("Error reading HTML file:", err);
          reject(err);
          return;
        }
        resolve(htmlContent);
      });
    });
  }

  private getProjectOptions(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    if (workspaceFolders.length === 0) {
      return "";
    }

    const solutionDir = workspaceFolders[0].uri.fsPath;
    let projects: IProject[] = [];

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
      projects = projectLines
        .map((line) => {
          // Adjusted regex to capture both project name and file path
          const match = line.match(/=\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,/);
          if (match) {
            const projectName = match[1]; // Project name
            const projectFilePath = match[2]; // Project file path

            // Get the project file name only (last part of the path)
            const projectFileName = path.basename(projectFilePath);

            const project: IProject = {
              name: projectName,
              file: projectFileName,
            };
            return project;
          }
          return;
        })
        .filter((project): project is IProject => project !== null);
    } catch (error) {
      console.error("Error reading solution file:", error);
    }

    return projects
      .map(
        (project) =>
          `<option value="${project.name}" data-project-file="${project.file}">${project.name}</option>`
      )
      .join("");
  }

  private replaceHtmlContent(
    htmlContent: string,
    webviewView: vscode.WebviewView
  ): string {
    htmlContent = htmlContent.replace(
      "<!-- Project options will be injected here -->",
      this.getProjectOptions()
    );

    const cssPathOnDisk = vscode.Uri.file(
      path.join(this.context.extensionPath, "views", "css", "style.css")
    );
    const cssUri = webviewView.webview.asWebviewUri(cssPathOnDisk);
    const jsPathOnDisk = vscode.Uri.file(
      path.join(this.context.extensionPath, "views", "js", "index.js")
    );
    const jsUri = webviewView.webview.asWebviewUri(jsPathOnDisk);

    return htmlContent
      .replace("{{cssUri}}", `${cssUri}`)
      .replace("{{jsUri}}", `${jsUri}`);
  }
}
