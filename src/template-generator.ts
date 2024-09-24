import path from "path";
import * as vscode from "vscode";
import * as fs from "fs";

export class TemplateGenerator {
  public generateVSTemplate(
    selectedProject: string,
    templateName: string,
    templateDescription: string
  ) {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    if (workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("No workspace folder found.");
      return;
    }

    const solutionDir = workspaceFolders[0].uri.fsPath;
    const projectPath = path.join(solutionDir, selectedProject);

    if (!fs.existsSync(projectPath)) {
      vscode.window.showErrorMessage(
        `Project folder not found: ${selectedProject}`
      );
      return;
    }

    // Recursively gather project files and generate ProjectItem tags
    const projectItemsXml = this.getProjectItemsXml(projectPath, projectPath); // passing projectPath twice for relative paths

    const vstemplateContent = this.createVSTemplateContent(
      templateName,
      templateDescription,
      projectItemsXml
    );
    const vstemplatePath = path.join(projectPath, `${templateName}.vstemplate`);

    fs.writeFile(vstemplatePath, vstemplateContent, "utf-8", (err) => {
      if (err) {
        vscode.window.showErrorMessage(
          `Error writing template: ${err.message}`
        );
        return;
      }
      vscode.window.showInformationMessage(
        `Template generated at: ${vstemplatePath}`
      );
    });
  }

  private getProjectItemsXml(
    directoryPath: string,
    baseDirectory: string,
    indentLevel: number = 2
  ): string {
    let projectItemsXml = "";

    const items = fs.readdirSync(directoryPath);
    const indent = " ".repeat(indentLevel);

    items.forEach((item) => {
      const itemPath = path.join(directoryPath, item);
      const relativePath = path
        .relative(baseDirectory, itemPath)
        .replace(/\\/g, "/"); // Convert to forward slashes for XML

      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        const folderName = path.basename(itemPath);

        if (
          folderName === "bin" ||
          folderName === "obj" ||
          folderName.startsWith(".")
        ) {
          // Skip these folders
          return;
        }
        // Recursively process subdirectories
        projectItemsXml += `<Folder Name="${folderName}" TargetFolderName="${folderName}">`;
        projectItemsXml += this.getProjectItemsXml(itemPath, baseDirectory);
        projectItemsXml += `</Folder>`;
      } else if (stats.isFile()) {
        const fileName = path.basename(itemPath);

        if (fileName.includes(".vstemplate")) {
          return;
        }
        // Add a ProjectItem for each file
        projectItemsXml += `${indent}<ProjectItem ReplaceParameters="true" TargetFileName="${fileName}">${fileName}</ProjectItem>\n`;
      }
    });

    return projectItemsXml;
  }

  private createVSTemplateContent(
    templateName: string,
    templateDescription: string,
    projectItemsXml: string
  ): string {
    return `<?xml version="1.0" encoding="utf-8"?>
    <VSTemplate Version="3.0.0" Type="Project" xmlns="http://schemas.microsoft.com/developer/vstemplate/2005">
      <TemplateData>
        <Name>${templateName}</Name>
        <Description>${templateDescription}</Description>
        <ProjectType>CSharp</ProjectType>
        <SortOrder>1000</SortOrder>
        <CreateNewFolder>true</CreateNewFolder>
        <DefaultName>$projectname$</DefaultName>
        <ProvideDefaultName>true</ProvideDefaultName>
        <LocationField>Enabled</LocationField>
        <EnableLocationBrowseButton>true</EnableLocationBrowseButton>
        <CreateInPlace>true</CreateInPlace>
      </TemplateData>
      <TemplateContent>
        <Project File="$safeprojectname$.csproj" TargetFileName="$safeprojectname$.csproj" ReplaceParameters="true">
          ${projectItemsXml.trim()} <!-- Files from the project will be injected here -->
        </Project>
      </TemplateContent>
      <CustomParameters>
        <CustomParameter Name="$safeprojectname$" Value="$safeprojectname$" />
      </CustomParameters>
    </VSTemplate>`;
  }
}
