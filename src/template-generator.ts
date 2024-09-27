import path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import archiver from "archiver";
import { exec } from "child_process";
import { ITemplateInfo } from "./models/ITemplateInfo";

export class TemplateGenerator {
  public createZipWithTemplate(templateInfo: ITemplateInfo) {
    try {
      const projectPath = this.getProjectPath(templateInfo.selectedProject);
      const zipFileName = `${templateInfo.templateName}.zip`;
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

      const vstemplateContent = this.generateVSTemplate(templateInfo);

      // Add the .vstemplate file content to the zip
      archive.append(vstemplateContent, {
        name: `${templateInfo.templateName}.vstemplate`,
      });

      const templateIcon = path.join(
        templateInfo.extensionPath,
        "resources",
        "TemplateIcon.ico"
      );
      archive.file(templateIcon, { name: "TemplateIcon.ico" });

      // Add files listed in the .vstemplate (by traversing the directory)
      this.addProjectFilesToZip(
        archive,
        projectPath,
        projectPath,
        templateInfo.excludedPaths
      );

      // Finalize the archive
      archive.finalize();

      vscode.window
        .showInformationMessage(
          `Template generated successfully at: ${projectPath}`,
          "Open"
        )
        .then((action) => {
          if (action === "Open") {
            exec(`explorer ${projectPath}`, (err) => {
              console.log(err);
              if (err) {
                console.error(err);
              }
            });
          }
        });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error while generating template: ${error}`
      );
    }
  }

  private addProjectFilesToZip(
    archive: archiver.Archiver,
    directoryPath: string,
    baseDirectory: string,
    excludedPaths: string[]
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
          folderName === "node_modules" ||
          folderName.startsWith(".") ||
          excludedPaths.includes(folderName)
        ) {
          return; // Skip these folders
        }

        // Recursively process subdirectories
        this.addProjectFilesToZip(
          archive,
          itemPath,
          baseDirectory,
          excludedPaths
        );
      } else if (stats.isFile()) {
        if (excludedPaths.includes(relativePath)) {
          return; // Skip this file
        }
        // Add file to ZIP with its relative path
        archive.file(itemPath, { name: relativePath });
      }
    });
  }

  private generateVSTemplate(templateInfo: ITemplateInfo): string {
    const projectPath = this.getProjectPath(templateInfo.selectedProject);
    if (!fs.existsSync(projectPath)) {
      vscode.window.showErrorMessage(
        `Project folder not found: ${templateInfo.selectedProject}`
      );
      return "";
    }

    // Recursively gather project files and generate ProjectItem tags
    const projectItemsXml = this.getProjectItemsXml(
      projectPath,
      projectPath,
      templateInfo.excludedPaths
    ); // passing projectPath twice for relative paths

    const vstemplateContent = this.createVSTemplateContent(
      templateInfo.templateName,
      templateInfo.templateDescription,
      projectItemsXml,
      templateInfo.projectFile,
      templateInfo.selectedLanguageTags,
      templateInfo.selectedPlatformTags
    );

    return vstemplateContent;
  }

  private getProjectItemsXml(
    directoryPath: string,
    baseDirectory: string,
    excludedPaths: string[],
    indentLevel: number = 2
  ): string {
    let projectItemsXml = "";

    const items = fs.readdirSync(directoryPath);
    const indent = " ".repeat(indentLevel);

    items.forEach((item) => {
      const itemPath = path.join(directoryPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        const folderName = path.basename(itemPath);

        if (
          folderName === "bin" ||
          folderName === "obj" ||
          folderName === "PublishProfiles" ||
          folderName.startsWith(".") ||
          excludedPaths.includes(folderName)
        ) {
          // Skip these folders
          return;
        }
        // Recursively process subdirectories
        projectItemsXml += `<Folder Name="${folderName}" TargetFolderName="${folderName}">`;
        projectItemsXml += this.getProjectItemsXml(
          itemPath,
          baseDirectory,
          excludedPaths
        );
        projectItemsXml += `</Folder>`;
      } else if (stats.isFile()) {
        const fileName = path.basename(itemPath);

        if (
          fileName.includes(".vstemplate") ||
          excludedPaths.includes(fileName)
        ) {
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
    projectItemsXml: string,
    projectFile: string,
    selectedLanguageTags: string[],
    selectedPlatformTags: string[]
  ): string {
    const projectType = this.getProjectType(projectFile);
    if (projectType === "Unknown") {
      throw "Unsupported type of project";
    }
    const projectFileExt = path.extname(projectFile).toLowerCase();
    const defaultName = path.basename(projectFile).replace(projectFileExt, "");

    let languageTags: string = "";
    selectedLanguageTags.forEach((languageTag: string) => {
      languageTags += `<LanguageTag>${languageTag}</LanguageTag>\n`;
    });
    languageTags = languageTags.replace(/\n$/, "");

    let platformTags: string = "";
    selectedPlatformTags.forEach((platformTag: string) => {
      platformTags += `<PlatformTag>${platformTag}</PlatformTag>\n`;
    });
    platformTags = platformTags.replace(/\n$/, "");

    return `<?xml version="1.0" encoding="utf-8"?>
    <VSTemplate Version="3.0.0" Type="Project" xmlns="http://schemas.microsoft.com/developer/vstemplate/2005">
      <TemplateData>
        <Name>${templateName}</Name>
        <Description>${templateDescription}</Description>
        <ProjectType>${projectType.toLocaleLowerCase()}</ProjectType>
        ${languageTags !== "" ? languageTags : ""}
        ${platformTags !== "" ? platformTags : ""}
        <SortOrder>1000</SortOrder>
        <CreateNewFolder>true</CreateNewFolder>
        <DefaultName>${defaultName}</DefaultName>
        <ProvideDefaultName>true</ProvideDefaultName>
        <LocationField>Enabled</LocationField>
        <EnableLocationBrowseButton>true</EnableLocationBrowseButton>
        <CreateInPlace>true</CreateInPlace>
        <Icon>__TemplateIcon.ico</Icon>
      </TemplateData>
      <TemplateContent>
        <Project File="${projectFile}" TargetFileName="$safeprojectname$${projectFileExt}" ReplaceParameters="true">
          ${projectItemsXml.trim()}
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

  private getProjectType(projectFile: string) {
    const ext = path.extname(projectFile).toLowerCase();

    switch (ext) {
      case ".razor":
      case ".csproj":
        return "CSharp";
      case ".fsproj":
        return "FSharp";
      case ".vbproj":
        return "VB";
      case ".esproj":
      case ".jsproj":
        return "JavaScript";
      case ".vcxproj":
        return "C++";
      default:
        return "Unknown";
    }
  }
}
