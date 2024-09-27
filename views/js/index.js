const vscode = acquireVsCodeApi();

const projectDropdown = document.getElementById("projectDropdown");
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

let excludedPaths = [];
let projectFile;
let selectedLanguageTags = [];
let selectedPlatformTags = [];

const previousState = vscode.getState();
if (previousState) {
  projectDropdown.value = previousState.selectedProject;
  templateNameInput.value = previousState.templateName ?? "";
  templateDescriptionInput.value = previousState.templateDescription ?? "";
  excludedPaths = previousState.excludedPaths ?? [];
  projectFile =
    previousState.projectFile ??
    Array.from(projectDropdown.children)
      .find((project) => project.innerText == previousState.selectedProject)
      .getAttribute("data-project-file");

  selectedLanguageTags = previousState.selectedLanguageTags ?? [];
  selectedPlatformTags = previousState.selectedPlatformTags ?? [];

  renderList();

  if (previousState.selectedProject) {
    templateInputs.classList.remove("hidden");
  }
}

// Arrays with strings to populate dropdowns
const languageTags = [
  "cpp",
  "csharp",
  "fsharp",
  "java",
  "javascript",
  "python",
  "queryLanguage",
  "typescript",
  "visualbasic",
  "xaml",
];
const platformTags = [
  "windows",
  "linux",
  "android",
  "azure",
  "ios",
  "macos",
  "tvos",
  "windowsappsdk",
  "xbox",
];

// Initialize dropdowns
populateDropdown(
  "languageTagDropdown",
  languageTags,
  selectedLanguageTags,
  "languageDropdown"
);
populateDropdown(
  "platformTagDropdown",
  platformTags,
  selectedPlatformTags,
  "platformDropdown"
);

// Handle click on dropdowns
document.querySelectorAll(".dropdown").forEach((dropdown) => {
  dropdown.addEventListener("click", function () {
    closeDropdowns(dropdown);
    const container = this.parentElement;
    container.classList.toggle("active");
  });
});

// Close all dropdowns active
function closeDropdowns(currentDropdown) {
  const dropDownContainer = document.querySelector(
    ".dropdown-container.active"
  );
  if (
    dropDownContainer &&
    dropDownContainer.children.item(1).id !== currentDropdown.id
  ) {
    dropDownContainer.classList.remove("active");
  }
}

// Remove excluded path from list
function removePath(index) {
  excludedPaths.splice(index, 1);
  renderList();

  const currentState = vscode.getState();
  if (currentState) {
    vscode.setState({
      ...currentState,
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
          ...currentState,
          excludedPaths: excludedPaths,
        });
      }
    } else {
      excludePathInput.value = "";
    }
  }
});

// Handle project dropdown change
projectDropdown.addEventListener("change", function () {
  selectedProject = this.value;
  resetState();
  renderList();

  if (selectedProject) {
    templateInputs.classList.remove("hidden"); // Show inputs if a project is selected
  } else {
    templateInputs.classList.add("hidden"); // Hide inputs if no project is selected
  }

  const selectedOption = this.options[this.selectedIndex];
  projectFile = selectedOption.getAttribute("data-project-file");
});

// Handle Template Name input
templateNameInput.addEventListener("input", function () {
  const currentState = vscode.getState();
  if (currentState) {
    vscode.setState({
      ...currentState,
      templateName: templateNameInput.value,
    });
  }
});

// Handle Template Description input
templateDescription.addEventListener("input", function () {
  const currentState = vscode.getState();
  if (currentState) {
    vscode.setState({
      ...currentState,
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
      selectedProject: projectDropdown.value,
      templateName: templateNameInput.value,
      templateDescription: templateDescriptionInput.value,
      projectFile: projectFile,
      excludePaths: excludedPaths,
      selectedLanguageTags: selectedLanguageTags,
      selectedPlatformTags: selectedPlatformTags,
    });
  } else {
    alert("Please fill in all required fields.");
  }
};

// Validate Template Name and Description fields
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

// Populating dropdowns with checkboxes
function populateDropdown(
  dropdownId,
  items,
  selectedArray,
  dropdownLabelId,
  reset = false
) {
  console.log(selectedArray);
  const dropdown = document.getElementById(dropdownId);
  const dropdownLabel = document.getElementById(dropdownLabelId);

  if (selectedArray.length !== 0) {
    const selectedText =
      selectedArray.length > 0
        ? selectedArray.join(", ")
        : `-- Select Items --`;
    dropdownLabel.innerText = selectedText;
  }

  if (reset) {
    dropdownLabel.innerText = "-- Select Items --";
    dropdown.innerHTML = "";
  }

  items.forEach((item) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = item;

    if (selectedArray.includes(item)) {
      checkbox.checked = true;
    }

    // Handle checkbox change event
    checkbox.addEventListener("change", function () {
      console.log("ciao");
      if (checkbox.checked) {
        selectedArray.push(checkbox.value);
      } else {
        selectedArray = selectedArray.filter((tag) => tag !== checkbox.value);
      }
      const selectedText =
        selectedArray.length > 0
          ? selectedArray.join(", ")
          : `-- Select Items --`;
      dropdownLabel.innerText = selectedText;

      const currentState = vscode.getState();
      if (currentState) {
        vscode.setState({
          ...currentState,
          selectedLanguageTags:
            dropdownLabelId === "languageDropdown"
              ? selectedArray
              : currentState.selectedLanguageTags,
          selectedPlatformTags:
            dropdownLabelId === "platformDropdown"
              ? selectedArray
              : currentState.selectedPlatformTags,
        });
      }
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(item));
    dropdown.appendChild(label);
    console.log(checkbox.checked);
  });
}

// Reset variables and vs state
function resetState() {
  templateNameInput.value = "";
  templateDescriptionInput.value = "";
  excludedPaths = [];
  selectedLanguageTags = [];
  selectedPlatformTags = [];

  vscode.setState({
    selectedProject: selectedProject,
    projectFile: projectFile,
    templateName: "",
    templateDescription: "",
    excludedPaths: [],
    selectedLanguageTags: [],
    selectedPlatformTags: [],
  });

  populateDropdown(
    "languageTagDropdown",
    languageTags,
    selectedLanguageTags,
    "languageDropdown",
    true
  );
  populateDropdown(
    "platformTagDropdown",
    platformTags,
    selectedPlatformTags,
    "platformDropdown",
    true
  );
}
