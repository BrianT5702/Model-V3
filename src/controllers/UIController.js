import * as Utils from '../utils/Utils.js';
import PlanController from '../controllers/PlanController.js'; // Import PlanController

export default class UIController {
  constructor(sceneController) {
    this.sceneController = sceneController;
    this.is2DPlanVisible = false;
    this.isInteriorView = false;

    // Pass the SceneController instance to PlanController
    this.planController = new PlanController(this.sceneController, this.sceneController.buildingModel);

    this.initializeUI();
    this.initializeDragging(); // Separate method for dragging initialization
    this.initializeEditMode();
  }
  
  initializeUI() {
    try {
      // Safely reference required DOM elements
      const lengthInput = document.getElementById('length');
      const widthInput = document.getElementById('width');
      const heightInput = document.getElementById('height');
      const thicknessInput = document.getElementById('wall-thickness');
      const generateButton = document.getElementById('generate-building');
      const viewToggleButton = document.getElementById('view-interior');
      const viewPlanButton = document.getElementById('viewPlan');
      const plansContainer = document.getElementById('plans-container');
      const floating3DView = document.getElementById('floating-3d-view');
  
      // Throw an error if any required DOM element is missing
      if (!lengthInput || !widthInput || !heightInput || !thicknessInput) {
        throw new Error('One or more input fields (length, width, height, thickness) are missing in the DOM.');
      }
      if (!generateButton || !viewToggleButton || !viewPlanButton) {
        throw new Error('One or more buttons (generate, toggle view, plan view) are missing in the DOM.');
      }
      if (!plansContainer || !floating3DView) {
        throw new Error('Required containers (plans or floating 3D view) are missing in the DOM.');
      }
  
      console.log('All DOM elements loaded successfully.');
    } catch (error) {
      console.error(error.message);
      alert('Application initialization failed. Please reload the page or contact support.');
      return; // Prevent further execution
    }

    const lengthInput = document.getElementById('length');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const thicknessInput = document.getElementById('wall-thickness');
    const generateButton = document.getElementById('generate-building');
    const viewToggleButton = document.getElementById('view-interior'); // Toggle button
    const viewPlanButton = document.getElementById('viewPlan');
    const plansContainer = document.getElementById('plans-container');
    const main3DView = document.getElementById('main-3d-view');
    const floating3DView = document.getElementById('floating-3d-view');
    const floatingContent = floating3DView.querySelector('#floating-3d-content');

    // Generate building based on user input
    generateButton.addEventListener('click', () => {
      const length = parseFloat(lengthInput.value);
      const width = parseFloat(widthInput.value);
      const height = parseFloat(heightInput.value);
      const thickness = parseFloat(thicknessInput.value);
    
      // Check for invalid inputs
      if (!Utils.validateInputs(length, width, height, thickness)) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.textContent = 'Please provide valid dimensions (positive numbers).';
        errorContainer.style.display = 'block';
        return;
      }
    
      // Clear existing errors
      const errorContainer = document.getElementById('error-container');
      errorContainer.style.display = 'none';
    
      // Pass dimensions to PlanController
      this.planController.setDimensions(length, width);
    
      // Generate 3D model
      this.sceneController.createBuilding(length, width, height, thickness);
    });

    // Toggle between interior and exterior views
    viewToggleButton.addEventListener('click', () => {
      if (this.isInteriorView) {
        this.sceneController.toggleExteriorView(); // Switch to exterior view
        viewToggleButton.textContent = 'View Interior'; // Update button text
      } else {
        this.sceneController.toggleInteriorView(); // Switch to interior view
        viewToggleButton.textContent = 'View Exterior'; // Update button text
      }
      this.isInteriorView = !this.isInteriorView; // Toggle the state
    });

    // Toggle 2D Plans visibility and floating 3D view
    viewPlanButton.addEventListener('click', () => {
      this.is2DPlanVisible = !this.is2DPlanVisible;
    
      if (this.is2DPlanVisible) {
        const length = parseFloat(document.getElementById('length').value);
        const width = parseFloat(document.getElementById('width').value);
    
        // Ensure dimensions are set
        if (!this.planController.length || !this.planController.width) {
          if (!Utils.validateInputs(length, width)) {
            alert('Please provide valid dimensions before viewing the plan.');
            return;
          }
          this.planController.setDimensions(length, width);
        }
    
        plansContainer.classList.remove('hidden'); // Show 2D Plans
        floating3DView.classList.remove('hidden'); // Show floating 3D view
        main3DView.classList.add('hidden'); // Hide the main 3D view
    
        // Attach the renderer to the floating container
        this.sceneController.sceneView.attachToContainer('floating-3d-view');
      } else {
        plansContainer.classList.add('hidden'); // Hide 2D Plans
        floating3DView.classList.add('hidden'); // Hide floating 3D view
        main3DView.classList.remove('hidden'); // Show the main 3D view
    
        // Attach the renderer back to the main container
        this.sceneController.sceneView.attachToContainer('main-3d-view');
      }
    });
    if (floatingContent) {
      const resizeObserver = new ResizeObserver(() => {
          if (this.sceneController && this.sceneController.sceneView) {
              this.sceneController.sceneView.resizeRenderer();
          }
      });
      resizeObserver.observe(floatingContent);
    }
  }
  initializeDragging() {
    const floatingView = document.getElementById('floating-3d-view');
    const dragHandle = floatingView.querySelector('.drag-handle');
    const planViewer = document.getElementById('plan-viewer');

    if (!floatingView || !dragHandle || !planViewer) {
      console.error('Missing required elements for dragging functionality.');
      return;
    }

    let isDragging = false;
    let startX, startY, initialX, initialY;

    // Mouse down event on the drag handle
    dragHandle.addEventListener('mousedown', (e) => {
      console.log('Mouse down event detected on drag handle');
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      floatingView.classList.add('dragging');
      // Get current position, defaulting to 0 if not set
      const computedStyle = window.getComputedStyle(floatingView);
      initialX = parseInt(computedStyle.left, 10) || 0;
      initialY = parseInt(computedStyle.top, 10) || 0;

      dragHandle.style.cursor = 'grabbing';
      e.preventDefault();
    });

    // Mouse move event on document to allow dragging outside of handle
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newX = initialX + dx;
      let newY = initialY + dy;

      const containerRect = planViewer.getBoundingClientRect();
      const elementRect = floatingView.getBoundingClientRect();

      // Restrict movement within the container
      newX = Math.max(0, Math.min(newX, containerRect.width - elementRect.width));
      newY = Math.max(0, Math.min(newY, containerRect.height - elementRect.height));

      floatingView.style.position = 'absolute';
      floatingView.style.left = `${newX}px`;
      floatingView.style.top = `${newY}px`;

      console.log('Dragging:', { newX, newY });
    });

    // Mouse up event to stop dragging
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        floatingView.classList.add('dragging');
        dragHandle.style.cursor = 'grab';
        console.log('Drag ended');
      }
    });
    document.addEventListener('mouseleave', () => {
      if (isDragging) {
          isDragging = false;
          dragHandle.style.cursor = 'grab';
          console.log('Drag ended (mouseleave)');
      }
  });
  }

  initializeEditMode() {
    const enableEditButton = document.getElementById('enable-edit-mode');
    const editControls = document.getElementById('edit-controls');
    const exitEditButton = document.getElementById('exit-edit-mode');
    const addWallButton = document.getElementById('add-wall-button');

    // Enable Edit Mode
    enableEditButton.addEventListener('click', () => {
        console.log('Enable Edit Mode button clicked!');
        editControls.classList.remove('hidden');
        enableEditButton.classList.add('hidden');
        this.planController.enableEditMode();
    });

    // Exit Edit Mode
    exitEditButton.addEventListener('click', () => {
        console.log('Exit Edit Mode button clicked!');
        editControls.classList.add('hidden');
        enableEditButton.classList.remove('hidden');
        this.planController.disableEditMode();
    });

    // Draw Wall Mode
    addWallButton.addEventListener('click', () => {
      console.log('Draw Wall button clicked!');
      this.planController.startDrawingWall(); // Trigger wall drawing in PlanController
  });
}
}