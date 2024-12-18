import SceneController from './controllers/SceneController.js';
import UIController from './controllers/UIController.js';
import PlanController from './controllers/PlanController.js';
import BuildingModel from './models/BuildingModel.js';

if (!window.__APP_INITIALIZED__) {
  window.__APP_INITIALIZED__ = true;

  document.addEventListener('DOMContentLoaded', () => {
    try {
      console.log('DOM fully loaded and parsed. Initializing application...');

      // Initialize the main building model
      const buildingModel = new BuildingModel();
      console.log('Building model initialized.');

      // Initialize the 3D Scene Controller
      const sceneController = new SceneController();
      console.log('Scene controller initialized.');

      // Attach the renderer to the main 3D view container
      console.log('Attaching renderer to main-3d-view...');
      sceneController.sceneView.attachToContainer('main-3d-view');

      // Initialize the UI Controller
      const uiController = new UIController(sceneController);
      console.log('UI controller initialized.');

      // Initialize the Plan Controller for 2D plans
      const planController = new PlanController(sceneController, buildingModel);
      console.log('Plan controller initialized.');

      // Animation loop for continuously rendering the 3D scene
      function animate() {
        requestAnimationFrame(animate);
        sceneController.sceneView.render();
      }

      console.log('Starting animation loop...');
      animate();

      console.log('Application initialized successfully.');
    } catch (error) {
      console.error('Error initializing the application:', error.message);
    }
  });
}
