import planController from '../controllers/PlanController.js';
import sceneController from '../controllers/SceneController.js';

export function validateInputs(...inputs) {
  return inputs.every((input) => parseFloat(input) > 0 && !isNaN(parseFloat(input)));
}

export function generateUniqueId() {
  return `id_${Date.now()}`;
}

export function syncModels() {
  planController.update2DPlan();
  sceneController.update3DModel();
  console.log("Models synchronized.");
}

export const SCALING_FACTOR = 25; // Scale factor: 1 meter = 25 units
export const INTERSECTION_THRESHOLD = 1e-1; // Tolerance for detecting "near" intersections

export const TEXT_STYLE = {
  fill: 'blue',       // Color of the text
  fontSize: '12',     // Font size
  fontFamily: 'Arial', // Font family
  textAnchor: 'middle' // Text alignment
};
