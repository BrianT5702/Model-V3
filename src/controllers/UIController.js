import * as Utils from '../utils/Utils.js';
import PlanController from './PlanController.js';
import SceneController from './SceneController.js';
import BuildingModel from '../models/BuildingModel.js';

export default class UIController {
  constructor(sceneController) {
    this.sceneController = sceneController;
    this.buildingModel = new BuildingModel();
    this.planController = new PlanController(sceneController, this.buildingModel);
    this.is2DPlanVisible = false;
    this.isInteriorView = false;

    this.initializeUI();
  }

  initializeUI() {
    const lengthInput = document.getElementById('length');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const thicknessInput = document.getElementById('wall-thickness');
    const generateButton = document.getElementById('generate-building');
    const viewPlanButton = document.getElementById('viewPlan');
    const toggleViewButton = document.getElementById('view-interior');
    const enableEditButton = document.getElementById('enable-edit-mode');
    const exitEditButton = document.getElementById('exit-edit-mode');
    const addWallButton = document.getElementById('add-wall-button');

    // Validate elements
    if (!lengthInput || !widthInput || !heightInput || !thicknessInput || 
        !generateButton || !viewPlanButton || !toggleViewButton || 
        !enableEditButton || !exitEditButton || !addWallButton) {
      console.error('One or more UI elements are missing.');
      return;
    }

    // Initialize plan toggle
    this.planController.initializePlanToggle();

    // Generate Building
    generateButton.addEventListener('click', () => {
      const wallPlan = document.getElementById('wall-plan');
      if (!wallPlan) {
          alert('Error: Wall plan is not initialized.');
          return;
      }
  
      // Existing logic for generating the building
      const length = parseFloat(lengthInput.value);
      const width = parseFloat(widthInput.value);
      const height = parseFloat(heightInput.value);
      const thickness = parseFloat(thicknessInput.value);
  
      if (!Utils.validateInputs(length, width, height, thickness)) {
          const errorContainer = document.getElementById('error-container');
          errorContainer.textContent = 'Please provide valid dimensions (positive numbers).';
          errorContainer.style.display = 'block';
          return;
      }
  
      this.planController.setDimensions(length, width);
      this.sceneController.createBuilding(length, width, height, thickness);
  });

    // Toggle between 2D and 3D views
    viewPlanButton.addEventListener('click', () => {
      this.is2DPlanVisible = !this.is2DPlanVisible;
      const plansContainer = document.getElementById('plans-container');
      const main3DView = document.getElementById('main-3d-view');

      if (this.is2DPlanVisible) {
        plansContainer.classList.remove('hidden');
        main3DView.classList.add('hidden');
      } else {
        plansContainer.classList.add('hidden');
        main3DView.classList.remove('hidden');
      }
    });

    // Toggle between interior and exterior views
    toggleViewButton.addEventListener('click', () => {
      if (this.isInteriorView) {
        this.sceneController.toggleExteriorView();
        toggleViewButton.textContent = 'View Interior';
      } else {
        this.sceneController.toggleInteriorView();
        toggleViewButton.textContent = 'View Exterior';
      }
      this.isInteriorView = !this.isInteriorView;
    });

    // Enable edit mode
    enableEditButton.addEventListener('click', () => {
      enableEditButton.classList.add('hidden');
      document.getElementById('edit-controls').classList.remove('hidden');
      this.planController.enableEditMode();
    });

    // Exit edit mode
    exitEditButton.addEventListener('click', () => {
      enableEditButton.classList.remove('hidden');
      document.getElementById('edit-controls').classList.add('hidden');
      this.planController.disableEditMode();
    });

    // Start drawing walls
    addWallButton.addEventListener('click', () => {
      this.planController.startDrawingWall();
    });
  }
}