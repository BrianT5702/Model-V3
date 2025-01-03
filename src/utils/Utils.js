import planController from '../controllers/PlanController.js';
import sceneController from '../controllers/SceneController.js';

export function validateInputs(...inputs) {
  return inputs.every((input) => parseFloat(input) > 0 && !isNaN(parseFloat(input)));
}

export function syncModels() {
  planController.update2DPlan();
  sceneController.update3DModel();
  console.log("Models synchronized.");
}

export const SCALING_FACTOR = 25; // Scale factor: 1 meter = 25 units
export const INTERSECTION_THRESHOLD = 1e-1; // Tolerance for detecting "near" intersections

export const TEXT_STYLE = {
  fill: 'blue',           // Color of the text
  fontSize: '10px',        // Font size (explicitly include units like px)
  fontFamily: 'Arial',    // Font family
  textAnchor: 'middle',   // Text alignment
};

export function applyTextStyle(element) {
  if (!element) return;

  // Apply all styles from TEXT_STYLE to the element
  Object.entries(TEXT_STYLE).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}
