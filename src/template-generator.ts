import path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import archiver from "archiver";

export class TemplateGenerator {
  public createZipWithTemplate(
    selectedProject: string,
    templateName: string,
    templateDescription: string
  ) {
    const projectPath = this.getProjectPath(selectedProject);
    const zipFileName = `${templateName}.zip`;
    const output = fs.createWriteStream(path.join(projectPath, zipFileName));
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Set the compression level
    });

    output.on("close", function () {
      console.log(`${archive.pointer()} total bytes`);
      console.log("ZIP file has been created successfully.");
    });

    archive.on("error", function (err) {
      console.error(err);
      throw err;
    });

    // Pipe the archive to the output file
    archive.pipe(output);

    const vstemplateContent = this.generateVSTemplate(
      selectedProject,
      templateName,
      templateDescription
    );

    // Add the .vstemplate file content to the zip
    archive.append(vstemplateContent, { name: `${templateName}.vstemplate` });

    // Add files listed in the .vstemplate (by traversing the directory)
    this.addProjectFilesToZip(archive, projectPath, projectPath);

    // Finalize the archive
    archive.finalize();

    vscode.window.showInformationMessage(
      `Zip file generated successfully at: ${projectPath}`
    );
  }

  private addProjectFilesToZip(
    archive: archiver.Archiver,
    directoryPath: string,
    baseDirectory: string
  ) {
    const items = fs.readdirSync(directoryPath);

    items.forEach((item) => {
      const itemPath = path.join(directoryPath, item);
      const relativePath = path
        .relative(baseDirectory, itemPath)
        .replace(/\\/g, "/"); // Convert to forward slashes for the ZIP

      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        const folderName = path.basename(itemPath);

        // Ignore "bin", "obj", and directories starting with "."
        if (
          folderName === "bin" ||
          folderName === "obj" ||
          folderName.startsWith(".")
        ) {
          return; // Skip these folders
        }

        // Recursively process subdirectories
        this.addProjectFilesToZip(archive, itemPath, baseDirectory);
      } else if (stats.isFile()) {
        // Add file to ZIP with its relative path
        archive.file(itemPath, { name: relativePath });
      }
    });
  }

  private generateVSTemplate(
    selectedProject: string,
    templateName: string,
    templateDescription: string
  ): string {
    const projectPath = this.getProjectPath(selectedProject);
    if (!fs.existsSync(projectPath)) {
      vscode.window.showErrorMessage(
        `Project folder not found: ${selectedProject}`
      );
      return "";
    }

    // Recursively gather project files and generate ProjectItem tags
    const projectItemsXml = this.getProjectItemsXml(projectPath, projectPath); // passing projectPath twice for relative paths

    const vstemplateContent = this.createVSTemplateContent(
      templateName,
      templateDescription,
      projectItemsXml
    );

    return vstemplateContent;
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
          folderName === "PublishProfiles" ||
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

  private getProjectPath(selectedProject: string): string {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];

    if (workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("No workspace folder found.");
      return "";
    }

    const solutionDir = workspaceFolders[0].uri.fsPath;
    const projectPath = path.join(solutionDir, selectedProject);

    return projectPath;
  }
}
