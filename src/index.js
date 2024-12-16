import SceneController from './controllers/SceneController.js';
import UIController from './controllers/UIController.js';
import PlanController from './controllers/PlanController.js';
import BuildingModel from './models/BuildingModel.js';

if (!window.__APP_INITIALIZED__) {
  window.__APP_INITIALIZED__ = true;

  document.addEventListener('DOMContentLoaded', () => {
      const buildingModel = new BuildingModel();
      const sceneController = new SceneController();

      // Attach the renderer to the main 3D view container
      console.log('Attaching renderer to main-3d-view');
      sceneController.sceneView.attachToContainer('main-3d-view');

      // Initialize other controllers
      const uiController = new UIController(sceneController);
      const planController = new PlanController(sceneController, buildingModel);

      // Animation loop
      function animate() {
          requestAnimationFrame(animate);
          sceneController.sceneView.render();
      }

      // Start the animation loop
      animate();
  });
}