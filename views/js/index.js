const vscode = acquireVsCodeApi();

const dropdown = document.getElementById("projectDropdown");
const templateNameInput = document.getElementById("templateName");
const templateDescriptionInput = document.getElementById("templateDescription");
const generateButton = document.getElementById("generateButton");
const templateInputs = document.getElementById("templateInputs");
const templateNameError = document.getElementById("templateNameError");
const templateDescriptionError = document.getElementById(
  "templateDescriptionError"
);
const excludePathInput = document.getElementById("excludePathInput");
const addExcludePathButton = document.getElementById("addExcludePathButton");
const excludedPathsList = document.getElementById("excludePathsList");

const previousState = vscode.getState();
let excludedPaths = [];
let projectFile;

if (previousState) {
  dropdown.value = previousState.selectedProject;
  templateNameInput.value = previousState.templateName ?? "";
  templateDescriptionInput.value = previousState.templateDescription ?? "";
  excludedPaths = previousState.excludedPaths ?? [];
  projectFile = previousState.projectFile;
  renderList();

  if (previousState.selectedProject) {
    templateInputs.classList.remove("hidden");
  }
}

function removePath(index) {
  excludedPaths.splice(index, 1);
  renderList();

  const currentState = vscode.getState();
  if (currentState) {
    vscode.setState({
      selectedProject: currentState.selectedProject,
      templateName: currentState.templateName,
      templateDescription: currentState.templateDescription,
      excludedPaths: excludedPaths,
    });
  }
}

// Function to render the list of excluded paths
function renderList() {
  excludedPathsList.innerHTML = "";
  excludedPaths.forEach((path, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = path;
    listItem.classList.add("li");

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.innerHTML = "&times;"; // HTML code for "×"
    removeButton.classList.add("remove-button");
    removeButton.addEventListener("click", () => removePath(index));

    listItem.appendChild(removeButton);
    excludedPathsList.appendChild(listItem);
  });
}

// Add exclude path to the list
addExcludePathButton.addEventListener("click", function () {
  const path = excludePathInput.value.trim();
  if (path) {
    if (!excludedPaths.includes(path)) {
      excludedPaths.push(path);
      excludePathInput.value = "";
      renderList();

      const currentState = vscode.getState();
      if (currentState) {
        vscode.setState({
          selectedProject: currentState.selectedProject,
          templateName: currentState.templateName,
          templateDescription: currentState.templateDescription,
          projectFile: currentState.projectFile,
          excludedPaths: excludedPaths,
        });
      }
    } else {
      excludePathInput.value = "";
    }
  }
});

// Handle dropdown change
dropdown.addEventListener("change", function () {
  selectedProject = this.value;
  templateNameInput.value = "";
  templateDescriptionInput.value = "";
  excludedPaths = [];
  renderList();

  if (selectedProject) {
    templateInputs.classList.remove("hidden"); // Show inputs if a project is selected
  } else {
    templateInputs.classList.add("hidden"); // Hide inputs if no project is selected
  }

  const selectedOption = this.options[this.selectedIndex];
  projectFile = selectedOption.getAttribute("data-project-file");

  vscode.setState({
    selectedProject: selectedProject,
    projectFile: projectFile,
    templateName: "",
    templateDescription: "",
    excludedPaths: [],
  });
});

templateNameInput.addEventListener("input", function () {
  const currentState = vscode.getState();
  if (currentState) {
    vscode.setState({
      selectedProject: currentState.selectedProject,
      projectFile: currentState.projectFile,
      templateName: templateNameInput.value,
    });
  }
});

templateDescription.addEventListener("input", function () {
  const currentState = vscode.getState();
  if (currentState) {
    vscode.setState({
      selectedProject: currentState.selectedProject,
      projectFile: currentState.projectFile,
      templateName: currentState.templateName,
      templateDescription: templateDescriptionInput.value,
    });
  }
});

// Handle generate button click
generateButton.onclick = function () {
  // Clear previous error styles
  templateNameInput.classList.remove("error");
  templateDescriptionInput.classList.remove("error");

  // Validate inputs
  const isTemplateNameValid = validateField(
    templateNameInput,
    templateNameError
  );
  const isTemplateDescriptionValid = validateField(
    templateDescriptionInput,
    templateDescriptionError
  );

  // If valid, send message to extension
  if (isTemplateNameValid && isTemplateDescriptionValid) {
    vscode.postMessage({
      command: "generateTemplate",
      selectedProject: dropdown.value,
      templateName: templateNameInput.value,
      templateDescription: templateDescriptionInput.value,
      projectFile: projectFile,
      excludePaths: excludedPaths,
    });
  } else {
    alert("Please fill in all required fields.");
  }
};

function validateField(field, errorElement) {
  if (!field.value.trim()) {
    field.classList.add("error");
    errorElement.style.display = "inline";
    return false;
  } else {
    field.classList.remove("error");
    errorElement.style.display = "none";
    return true;
  }
}
