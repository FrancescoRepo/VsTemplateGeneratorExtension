# Visual Studio Code Template Generator Extension

## Overview

The **Visual Studio Code Template Generator Extension** is a powerful tool designed to simplify the process of creating project templates directly from your Visual Studio Code environment. This extension enables users to generate reusable templates for various types of projects, complete with customizable options and exclusion rules.

## Features

- **Dynamic Project Discovery**: Automatically lists all projects in your current solution, allowing you to select the desired project to generate a template from.
- **Custom Template Creation**: Generate a `.vstemplate` file based on the selected project, including configurations for shared libraries, ASP.NET Core Web APIs, and more.
- **Exclusion Options**: Specify folders and files to exclude from the generated template, ensuring a clean and manageable project structure.
- **User-Friendly Interface**: Intuitive dropdown menus and input fields make it easy to set up and customize your templates.

## Getting Started

### Installation

1. Open Visual Studio Code.
2. Navigate to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window.
3. Search for **Template Generator Extension**.
4. Click on the **Install** button.

### Usage

1. After installation, click on the extension icon in the Activity Bar to open the extension panel.
2. Select the desired project from the dropdown list populated with all projects in your solution.
3. Fill in the **Template Name** and **Template Description** fields.
4. Use the multi-select dropdowns for additional configurations such as language tags, platform tags.
5. Specify any folders or files to exclude from the template generation.
6. Click the **Generate Template** button to create your project template.

### Example Workflow

1. **Select Project**: Choose a project from your solution to base your template on.
2. **Configure Template**: Set the template name, description, and any other necessary parameters.
3. **Generate Template**: Click the button to generate a `.vstemplate` file, which will be saved in the designated output directory.

## Project Structure

When a template is generated, it will include:

- A `.vstemplate` file that defines the structure and content of the template.
- Any specified project files, excluding those marked for exclusion.
- A zip file containing all necessary project assets.

### License

Copyright (c) 2024 Francesco Colaianni

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Acknowledgments

Thank you to the Visual Studio Code team and the open-source community for their invaluable support and resources.

## Contact

For inquiries or feedback, please leave a vote and a comment into the marketplace.
