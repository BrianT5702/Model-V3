import SceneController from './controllers/SceneController.js';
import UIController from './controllers/UIController.js';
import PlanController from './controllers/PlanController.js';
import BuildingModel from './models/BuildingModel.js';

if (!window.__APP_INITIALIZED__) {
  window.__APP_INITIALIZED__ = true;

  document.addEventListener('DOMContentLoaded', () => {
    try {
      console.log('DOM fully loaded and parsed. Initializing application...');

      // Initialize the main building model (central instance)
      const buildingModel = new BuildingModel();
      console.log('BuildingModel initialized.');

      // Initialize controllers with the central BuildingModel
      const sceneController = new SceneController(buildingModel);
      const planController = new PlanController(sceneController, buildingModel);
      const uiController = new UIController(sceneController, planController, buildingModel);

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
