import { SCALING_FACTOR, TEXT_STYLE, applyTextStyle } from '../utils/Utils.js';
import { saveToLocalStorage } from '../utils/LocalStorage.js';

export default class PlanController {
    constructor(sceneController, buildingModel) {
        this.sceneController = sceneController;
        this.buildingModel = buildingModel;
      
        this.planElement = document.getElementById('wall-plan');
        if (!this.planElement) {
          console.error("Error: 'wall-plan' SVG element not found in the DOM.");
          throw new Error("'wall-plan' SVG element is missing. Ensure it is present in the HTML.");
        }
      
        this.wallThicknessInput = document.getElementById('wall-thickness');
        this.wallHeightInput = document.getElementById('height');
      
        // Attach resize listener
        this.initializeResizeListener();
        this.initializeEditWallButton();
        this.initializeLogWallsButton();
      }

  // Set the dimensions of the plan
  setDimensions(length, width) {
    this.buildingModel.length = length;
    this.buildingModel.width = width;
    console.log(`Plan dimensions set: Length = ${length}, Width = ${width}`);
  }

  updateDimensions(svgElement, planWidth, planHeight) {
    // Clear existing bounding box dimensions
    const boundingBoxDimensions = svgElement.querySelectorAll('.dimension.bounding-box');
    boundingBoxDimensions.forEach((dim) => dim.remove());

    const offset = 20; // Space for dimensions

    // Add bounding box dimensions
    const topDim = this.addDimension(svgElement, 0, -offset, planWidth, -offset, `${this.buildingModel.length.toFixed(2)} m`, false);
    const rightDim = this.addDimension(svgElement, planWidth + offset, 0, planWidth + offset, planHeight, `${this.buildingModel.width.toFixed(2)} m`, true);
    const bottomDim = this.addDimension(svgElement, 0, planHeight + offset, planWidth, planHeight + offset, `${this.buildingModel.length.toFixed(2)} m`, false);
    const leftDim = this.addDimension(svgElement, -offset, 0, -offset, planHeight, `${this.buildingModel.width.toFixed(2)} m`, true);

    // Add bounding-box class
    if (topDim) topDim.classList.add('bounding-box');
    if (rightDim) rightDim.classList.add('bounding-box');
    if (bottomDim) bottomDim.classList.add('bounding-box');
    if (leftDim) leftDim.classList.add('bounding-box');

    console.log('Bounding box dimensions updated.');
  }

  calculateLineLength(x1, z1, x2, z2) {
    if (isNaN(x1) || isNaN(z1) || isNaN(x2) || isNaN(z2)) {
      console.warn('Invalid coordinates for line length calculation:', { x1, z1, x2, z2 });
      return NaN;
    }
  
    // Calculate the real-world length of a line
    const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
    return length; // Ensure this always returns a number
  }  
  
  // Enable edit mode for the 2D plan
  enableEditMode() {
    this.isEditMode = true;
    this.currentAction = null;
    console.log('Edit mode enabled.');
  }

  // Disable edit mode
  disableEditMode() {
    this.isEditMode = false;
    this.currentAction = null;
    console.log('Edit mode disabled.');
  }

  // Start drawing a wall
  startDrawingWall() {
    if (!this.buildingModel.length || !this.buildingModel.width) {
        alert('Please set valid plan dimensions before drawing walls.');
        return;
    }

    const gapWidth = 5; // Same gap width used for the inner wall
    const innerBoundary = {
        xMin: gapWidth,
        xMax: this.buildingModel.length * SCALING_FACTOR - gapWidth,
        yMin: gapWidth,
        yMax: this.buildingModel.width * SCALING_FACTOR - gapWidth,
    };

    // Prevent multiple listener additions
    if (this.currentAction === 'draw-wall') {
        this.exitDrawingWall();
        const addWallButton = document.getElementById('add-wall-button');
        if (addWallButton) addWallButton.textContent = 'Draw Wall';
        this.currentAction = null;
        console.log('Exited wall drawing mode.');
        return;
    }

    this.currentAction = 'draw-wall';
    const addWallButton = document.getElementById('add-wall-button');
    if (addWallButton) addWallButton.textContent = 'Done Drawing';

    let startX = null;
    let startY = null;
    let tempLine = null;
    let guidelineX = null; // Horizontal guideline
    let guidelineY = null; // Vertical guideline

    const guidelineThreshold = 10; // Threshold for snapping to guideline or 90 degrees

    const getMousePosition = (event) => {
        const point = this.planElement.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const svgPoint = point.matrixTransform(this.planElement.getScreenCTM().inverse());
        return { x: svgPoint.x, y: svgPoint.y };
    };

    const clampToInnerBoundary = (x, y) => {
        const clampedX = Math.min(Math.max(x, innerBoundary.xMin), innerBoundary.xMax);
        const clampedY = Math.min(Math.max(y, innerBoundary.yMin), innerBoundary.yMax);
        return { x: clampedX, y: clampedY };
    };

    const snapTo90Degrees = (endX, endY) => {
        const deltaX = Math.abs(endX - startX);
        const deltaY = Math.abs(endY - startY);

        // Snap to horizontal or vertical if within the threshold
        if (deltaX < guidelineThreshold) {
            return { x: startX, y: endY }; // Snap to vertical
        } else if (deltaY < guidelineThreshold) {
            return { x: endX, y: startY }; // Snap to horizontal
        }
        return { x: endX, y: endY }; // No snapping
    };

    const onMouseDown = (event) => {
        const { x, y } = getMousePosition(event);
        const clampedStart = clampToInnerBoundary(x, y);

        startX = clampedStart.x;
        startY = clampedStart.y;

        // Create a temporary line for drawing
        tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tempLine.setAttribute('x1', startX);
        tempLine.setAttribute('y1', startY);
        tempLine.setAttribute('x2', startX);
        tempLine.setAttribute('y2', startY);
        tempLine.setAttribute('stroke', 'gray');
        tempLine.setAttribute('stroke-dasharray', '5,5');
        this.planElement.appendChild(tempLine);

        // Create horizontal guideline
        guidelineX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        guidelineX.setAttribute('x1', 0);
        guidelineX.setAttribute('y1', startY);
        guidelineX.setAttribute('x2', this.buildingModel.length * SCALING_FACTOR);
        guidelineX.setAttribute('y2', startY);
        guidelineX.setAttribute('stroke', 'blue');
        guidelineX.setAttribute('stroke-dasharray', '2,2');
        guidelineX.setAttribute('stroke-width', '1');
        this.planElement.appendChild(guidelineX);

        // Create vertical guideline
        guidelineY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        guidelineY.setAttribute('x1', startX);
        guidelineY.setAttribute('y1', 0);
        guidelineY.setAttribute('x2', startX);
        guidelineY.setAttribute('y2', this.buildingModel.width * SCALING_FACTOR);
        guidelineY.setAttribute('stroke', 'blue');
        guidelineY.setAttribute('stroke-dasharray', '2,2');
        guidelineY.setAttribute('stroke-width', '1');
        this.planElement.appendChild(guidelineY);

        console.log('Started drawing wall at:', { startX, startY });
    };

    const onMouseMove = (event) => {
        if (startX !== null && startY !== null) {
            const { x, y } = getMousePosition(event);
            const clampedEnd = clampToInnerBoundary(x, y);

            // Update the temporary line's end position
            if (tempLine) {
                tempLine.setAttribute('x2', clampedEnd.x);
                tempLine.setAttribute('y2', clampedEnd.y);
            }

            // Update the horizontal guideline
            if (guidelineX) {
                guidelineX.setAttribute('y1', clampedEnd.y);
                guidelineX.setAttribute('y2', clampedEnd.y);
            }

            // Update the vertical guideline
            if (guidelineY) {
                guidelineY.setAttribute('x1', clampedEnd.x);
                guidelineY.setAttribute('x2', clampedEnd.x);
            }
        }
    };

    const onMouseUp = (event) => {
        if (startX === null || startY === null) return; // Ensure drag started

        const { x, y } = getMousePosition(event);
        const clampedEnd = clampToInnerBoundary(x, y);

        // Snap the end point to the nearest 90-degree alignment
        const snappedPoint = snapTo90Degrees(clampedEnd.x, clampedEnd.y);

        const endX = snappedPoint.x;
        const endY = snappedPoint.y;

        if (startX !== endX || startY !== endY) {
            // Add the wall, which will handle line creation
            this.addWall(startX, startY, endX, endY);
        }

        // Reset for the next wall
        startX = null;
        startY = null;

        // Remove the temporary line and guidelines
        if (tempLine) {
            this.planElement.removeChild(tempLine);
            tempLine = null;
        }
        if (guidelineX) {
            this.planElement.removeChild(guidelineX);
            guidelineX = null;
        }
        if (guidelineY) {
            this.planElement.removeChild(guidelineY);
            guidelineY = null;
        }

        console.log('Wall completed.');
    };

    // Add event listeners for drawing
    this.planElement.addEventListener('mousedown', onMouseDown);
    this.planElement.addEventListener('mousemove', onMouseMove);
    this.planElement.addEventListener('mouseup', onMouseUp);

    this.exitDrawingWall = () => {
        this.planElement.removeEventListener('mousedown', onMouseDown);
        this.planElement.removeEventListener('mousemove', onMouseMove);
        this.planElement.removeEventListener('mouseup', onMouseUp);

        if (tempLine && this.planElement.contains(tempLine)) {
            this.planElement.removeChild(tempLine);
        }
        if (guidelineX && this.planElement.contains(guidelineX)) {
            this.planElement.removeChild(guidelineX);
        }
        if (guidelineY && this.planElement.contains(guidelineY)) {
            this.planElement.removeChild(guidelineY);
        }

        console.log('Exited wall drawing mode.');
        this.currentAction = null;
    };
  }

  clampToBoundary(x, y) {
    const planWidth = this.buildingModel.length * SCALING_FACTOR;
    const planHeight = this.buildingModel.width * SCALING_FACTOR;

    // Clamp coordinates within the boundaries
    const clampedX = Math.min(Math.max(x, 0), planWidth);
    const clampedY = Math.min(Math.max(y, 0), planHeight);

    return { x: clampedX, y: clampedY };
  }

  // Update the addWall method in PlanController
  addWall(startX, startY, endX, endY) {
    const clampedStart = this.clampToBoundary(startX, startY);
    const clampedEnd = this.clampToBoundary(endX, endY);

    // Convert 2D coordinates to 3D space
    const startCoords = this.convertTo3DCoordinates(clampedStart.x, clampedStart.y);
    const endCoords = this.convertTo3DCoordinates(clampedEnd.x, clampedEnd.y);

    const wallId = `wall-${Date.now()}-${Math.random().toString(16).slice(2)}`; // Temporary ID becomes permanent
    const newWall = {
        id: wallId,
        startX: startCoords.x,
        startZ: startCoords.z,
        endX: endCoords.x,
        endZ: endCoords.z,
        width: parseFloat(this.wallThicknessInput.value) || 0.2,
        height: parseFloat(this.wallHeightInput.value) || 3,
    };

    console.log('Attempting to add new wall:', newWall);

    // Save the new wall to BuildingModel and LocalStorage
    const createdWall = this.buildingModel.addWall(
        newWall.startX,
        newWall.startZ,
        newWall.endX,
        newWall.endZ,
        newWall.width,
        newWall.height,
        newWall.id // Use the temporary ID as the permanent ID
    );

    if (!createdWall || !createdWall.id) {
        console.error('Failed to create wall. Aborting wall addition.');
        return;
    }

    // Check if this is a default wall
    const isDefaultWall = createdWall.isDefaultWall || false;

    if (isDefaultWall) {
        // Add the outer wall line to SVG
        this.addWallLineToSVG(clampedStart.x, clampedStart.y, clampedEnd.x, clampedEnd.y, createdWall.id, false);
        createdWall.outerLine = { startX: clampedStart.x, startY: clampedStart.y, endX: clampedEnd.x, endY: clampedEnd.y };

        // Add the inner wall line to SVG
        const gapWidth = 5; // Adjust as necessary
        this.addWallLineToSVG(clampedStart.x + gapWidth, clampedStart.y + gapWidth, clampedEnd.x - gapWidth, clampedEnd.y - gapWidth, createdWall.id, true);
        createdWall.innerLine = {
            startX: clampedStart.x + gapWidth,
            startY: clampedStart.y + gapWidth,
            endX: clampedEnd.x - gapWidth,
            endY: clampedEnd.y - gapWidth,
        };
    } else {
        // For added walls, just add a single line
        this.addWallLineToSVG(clampedStart.x, clampedStart.y, clampedEnd.x, clampedEnd.y, createdWall.id, false);
    }

    saveToLocalStorage('buildingModelWalls', this.buildingModel.getWalls());
    console.log('Wall data saved to storage:', this.buildingModel.getWalls());

    // Check for intersections with existing walls
    const intersectedWalls = [];
    const walls = this.buildingModel.getWalls();

    walls.forEach(existingWall => {
        if (existingWall.id !== newWall.id) {
            const intersection = this.findIntersectionPoint(newWall, existingWall);
            if (intersection) {
                console.log('Intersection detected at:', intersection);
                intersectedWalls.push({ existingWall, intersection });
            }
        }
    });

    // If intersections exist, handle splitting
    if (intersectedWalls.length > 0) {
        intersectedWalls.forEach(({ existingWall, intersection }) => {
            this.splitWallAtIntersection(existingWall, intersection); // Split existing wall
            this.splitWallAtIntersection(newWall, intersection); // Split new wall
        });

        // Remove the original wall after segments are added
        this.buildingModel.removeWall(newWall.id);
        saveToLocalStorage('buildingModelWalls', this.buildingModel.getWalls());
        console.log('Original wall removed after adding segments.');

        // Sync the 3D and 2D views
        this.sceneController.updateScene(this.buildingModel.getWalls());
        return;
    }

    // Add wall line to SVG and draw dimensions if no intersections occur
    this.addWallLineToSVG(clampedStart.x, clampedStart.y, clampedEnd.x, clampedEnd.y, createdWall.id, false);
    const wallLength = this.calculateLineLength(newWall.startX, newWall.startZ, newWall.endX, newWall.endZ);
    this.addDimension(this.planElement, clampedStart.x, clampedStart.y, clampedEnd.x, clampedEnd.y, `${wallLength.toFixed(2)} m`, createdWall.id);

    console.log('New wall successfully added and stored:', createdWall);

    // Sync the 3D scene with the updated BuildingModel
    this.sceneController.updateScene(this.buildingModel.getWalls());
  }

  addWallLineToSVG(x1, y1, x2, y2, wallId, isInnerWall = false) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);

    // Determine color based on whether it's an inner wall
    line.setAttribute('stroke', isInnerWall ? '#D3D3D3' : 'black'); // Light grey for inner walls, black for outer walls
    line.setAttribute('stroke-width', 2);
    line.classList.add('wall-line');
    line.setAttribute('data-wall-id', wallId);
    line.setAttribute('data-wall-type', isInnerWall ? 'inner' : 'outer'); // New attribute to differentiate wall type

    // Add the line to the SVG
    this.planElement.appendChild(line);

    console.log(`Wall line added to SVG: {x1: ${x1}, y1: ${y1}, x2: ${x2}, y2: ${y2}, wallId: ${wallId}, isInnerWall: ${isInnerWall}}`);
  }


  removeWallLineFromSVG(wallId) {
    const wallLine = this.planElement.querySelector(`.wall-line[data-wall-id="${wallId}"]`);
    if (wallLine) {
        wallLine.remove();
        console.log(`Wall line with ID ${wallId} removed from SVG.`);
    }
  }

  // Updated splitWallAtIntersection
  splitWallAtIntersection(wall, intersection) {
    console.log('Splitting wall at intersection:', { wall, intersection });

    // Maintain a processed walls set to prevent duplicate actions
    if (!this.processedWallIds) {
        this.processedWallIds = new Set();
    }

    if (this.processedWallIds.has(wall.id)) {
        console.log(`Wall with ID ${wall.id} has already been processed. Skipping.`);
        return;
    }

    this.processedWallIds.add(wall.id);

    // Generate unique IDs for the new segments
    const generateWallId = (parentId, suffix) => `${parentId}-${suffix}`;

    // Save a copy of the original wall before making changes
    const originalWall = { ...wall };

    // Validate intersection coordinates
    if (!intersection || isNaN(intersection.x) || isNaN(intersection.z)) {
        console.error('Invalid intersection coordinates:', intersection);
        return;
    }

    // Create the first segment
    const firstSegment = {
        id: generateWallId(wall.id, 'a'),
        startX: wall.startX,
        startZ: wall.startZ,
        endX: intersection.x,
        endZ: intersection.z,
        width: wall.width,
        height: wall.height,
    };

    // Create the second segment
    const secondSegment = {
        id: generateWallId(wall.id, 'b'),
        startX: intersection.x,
        startZ: intersection.z,
        endX: wall.endX,
        endZ: wall.endZ,
        width: wall.width,
        height: wall.height,
    };

    console.log('New segments created:', firstSegment, secondSegment);

    // Add the new segments to the BuildingModel and track their IDs
    const createdFirstSegment = this.buildingModel.addWall(
        firstSegment.startX,
        firstSegment.startZ,
        firstSegment.endX,
        firstSegment.endZ,
        firstSegment.width,
        firstSegment.height,
        firstSegment.id
    );

    const createdSecondSegment = this.buildingModel.addWall(
        secondSegment.startX,
        secondSegment.startZ,
        secondSegment.endX,
        secondSegment.endZ,
        secondSegment.width,
        secondSegment.height,
        secondSegment.id
    );

    if (!createdFirstSegment || !createdSecondSegment) {
        console.error('Failed to add wall segments to BuildingModel:', {
            firstSegment,
            secondSegment,
        });
        return;
    }

    // Save the updated walls to storage
    saveToLocalStorage('buildingModelWalls', this.buildingModel.getWalls());

    // Remove the original wall's dimensions and associated elements
    this.removeAssociatedElements(originalWall.id);

    // Update SVG elements with proper scaling and offsets
    const offsetX = this.buildingModel.length * SCALING_FACTOR / 2;
    const offsetZ = this.buildingModel.width * SCALING_FACTOR / 2;

    this.addWallLineToSVG(
        firstSegment.startX * SCALING_FACTOR + offsetX,
        firstSegment.startZ * SCALING_FACTOR + offsetZ,
        firstSegment.endX * SCALING_FACTOR + offsetX,
        firstSegment.endZ * SCALING_FACTOR + offsetZ,
        firstSegment.id
    );

    this.addWallLineToSVG(
        secondSegment.startX * SCALING_FACTOR + offsetX,
        secondSegment.startZ * SCALING_FACTOR + offsetZ,
        secondSegment.endX * SCALING_FACTOR + offsetX,
        secondSegment.endZ * SCALING_FACTOR + offsetZ,
        secondSegment.id
    );

    // Add dimensions for the first segment
    this.addDimension(
        this.planElement,
        firstSegment.startX * SCALING_FACTOR + offsetX,
        firstSegment.startZ * SCALING_FACTOR + offsetZ,
        firstSegment.endX * SCALING_FACTOR + offsetX,
        firstSegment.endZ * SCALING_FACTOR + offsetZ,
        `${this.calculateLineLength(
            firstSegment.startX,
            firstSegment.startZ,
            firstSegment.endX,
            firstSegment.endZ
        ).toFixed(2)} m`,
        firstSegment.id
    );

    // Add dimensions for the second segment
    this.addDimension(
        this.planElement,
        secondSegment.startX * SCALING_FACTOR + offsetX,
        secondSegment.startZ * SCALING_FACTOR + offsetZ,
        secondSegment.endX * SCALING_FACTOR + offsetX,
        secondSegment.endZ * SCALING_FACTOR + offsetZ,
        `${this.calculateLineLength(
            secondSegment.startX,
            secondSegment.startZ,
            secondSegment.endX,
            secondSegment.endZ
        ).toFixed(2)} m`,
        secondSegment.id
    );

    console.log('Wall successfully split and updated in storage and SVG.');
  }

  // Helper function to remove overlapping dimensions
  removeOverlappingDimensions(wallId) {
      const dimensions = this.planElement.querySelectorAll(`[data-wall-id="${wallId}"]`);
      dimensions.forEach((dimension) => {
          dimension.remove();
          console.log(`Removed overlapping dimension for wall ID: ${wallId}`);
      });
  }

  removeAssociatedElements(wallId) {
    if (!wallId) {
        console.warn('Invalid wall ID provided for removal.');
        return;
    }

    // Use a regex pattern to match all wall IDs, including sub-segments (e.g., 3, 3-a, 3-a-1)
    const regex = new RegExp(`^${wallId}(-[a-z0-9]+)*$`);

    // Query all SVG elements associated with the wall ID pattern
    const associatedElements = this.planElement.querySelectorAll(`[data-wall-id]`);

    associatedElements.forEach((element) => {
        const elementWallId = element.getAttribute('data-wall-id');
        if (regex.test(elementWallId)) {
            element.remove();
            console.log(`Removed associated element for wall ID: ${elementWallId}`);
        }
    });

    console.log(`All associated elements for wall ID pattern "${wallId}" have been removed.`);
  }

  addWallDimension(wallSegment) {
    const svgElement = this.planElement;

    if (!svgElement) {
        console.error("SVG element for dimensions is missing.");
        return;
    }

    // Calculate the line midpoint and its length
    const midX = ((wallSegment.startX + wallSegment.endX) / 2) * SCALING_FACTOR;
    const midZ = ((wallSegment.startZ + wallSegment.endZ) / 2) * SCALING_FACTOR;
    const wallLength = this.calculateLineLength(
        wallSegment.startX,
        wallSegment.startZ,
        wallSegment.endX,
        wallSegment.endZ
    );

    // Offset for text label placement
    const offset = 10;

    // Add dimension text
    const dimensionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dimensionText.setAttribute('x', midX);
    dimensionText.setAttribute('y', midZ - offset);
    dimensionText.setAttribute('fill', 'blue');
    dimensionText.setAttribute('font-size', '14px');
    dimensionText.setAttribute('font-family', 'Arial');
    dimensionText.setAttribute('text-anchor', 'middle');
    dimensionText.textContent = `${wallLength.toFixed(2)} m`;
    svgElement.appendChild(dimensionText);

    console.log(`Dimension added for wall segment ${wallSegment.id}: ${wallLength.toFixed(2)} m`);
  }

  findIntersectionPoint(wall1, wall2) {
    const { startX: x1, startZ: y1, endX: x2, endZ: y2 } = wall1; // Wall 1
    const { startX: x3, startZ: y3, endX: x4, endZ: y4 } = wall2; // Wall 2

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (Math.abs(denominator) < 1e-10) {
        return null; // Parallel lines
    }

    const px =
        ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denominator;
    const py =
        ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denominator;

    // Convert to appropriate coordinate space if necessary
    return { x: px, z: py };
  }
  
  // Convert 2D coordinates to 3D space
  convertTo3DCoordinates(x, y) {
    const viewBox = this.planElement.getAttribute('viewBox').split(' ').map(Number);
    const offsetX = x - viewBox[0] - viewBox[2] / 2;
    const offsetY = y - viewBox[1] - viewBox[3] / 2;

    // Correct the Z-axis inversion
    return { 
        x: offsetX / SCALING_FACTOR, 
        z: offsetY / SCALING_FACTOR // Remove the '-' to fix the inversion
    };
  }

  initializePlanToggle() {
    const wallPlanButton = document.getElementById('show-wall-plan');
    const floorPlanButton = document.getElementById('show-floor-plan');
    const ceilingPlanButton = document.getElementById('show-ceiling-plan');
  
    const wallPlan = document.getElementById('wall-plan');
    const floorPlan = document.getElementById('floor-plan');
    const ceilingPlan = document.getElementById('ceiling-plan');
  
    // Add click event listeners for the buttons
    wallPlanButton.addEventListener('click', () => {
      this.switchPlan('wall', wallPlan, [floorPlan, ceilingPlan]);
    });
  
    floorPlanButton.addEventListener('click', () => {
      this.switchPlan('floor', floorPlan, [wallPlan, ceilingPlan]);
    });
  
    ceilingPlanButton.addEventListener('click', () => {
      this.switchPlan('ceiling', ceilingPlan, [wallPlan, floorPlan]);
    });
  
    console.log('Plan toggle buttons initialized.');
  }
  
  switchPlan(planType, activePlanElement, otherPlanElements) {
    if (!activePlanElement) {
        console.error(`Active plan element for ${planType} is undefined.`);
        return;
    }

    console.log(`Displaying ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`);

    // Hide all other plans
    otherPlanElements.forEach((element) => {
        if (element) element.classList.add('hidden');
    });

    // Show the active plan
    activePlanElement.classList.remove('hidden');

    // Render the specific plan if necessary
    if (planType === 'wall') {
        this.drawWallPlan(activePlanElement); // Call the updated drawWallPlan
    } else if (planType === 'floor') {
        this.drawFloorPlan(activePlanElement);
    } else if (planType === 'ceiling') {
        this.drawCeilingPlan(activePlanElement);
    }
  }

  // Add dimension text and apply TEXT_STYLE dynamically
  addDimension(svgElement, startX, startY, endX, endY, label, wallId = null) {
    const offset = 10; // Offset for dimension lines
    const tickLength = 5; // Length of ticks

    // Determine if the line is vertical or horizontal based on coordinates
    const isVertical = Math.abs(startX - endX) < 1e-6;

    // Calculate dimension line start and end points
    const dimensionStartX = isVertical ? startX - offset : startX;
    const dimensionStartY = isVertical ? startY : startY - offset;
    const dimensionEndX = isVertical ? endX - offset : endX;
    const dimensionEndY = isVertical ? endY : endY - offset;

    // Add extension line (start)
    const extensionLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    extensionLine1.setAttribute('x1', startX);
    extensionLine1.setAttribute('y1', startY);
    extensionLine1.setAttribute('x2', isVertical ? dimensionStartX : startX);
    extensionLine1.setAttribute('y2', isVertical ? startY : dimensionStartY);
    extensionLine1.setAttribute('stroke', 'gray');
    extensionLine1.setAttribute('stroke-width', 1);
    extensionLine1.setAttribute('stroke-dasharray', '2,2');
    if (wallId) extensionLine1.setAttribute('data-wall-id', wallId);
    extensionLine1.classList.add('dimension-extension-line');
    svgElement.appendChild(extensionLine1);

    // Add extension line (end)
    const extensionLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    extensionLine2.setAttribute('x1', endX);
    extensionLine2.setAttribute('y1', endY);
    extensionLine2.setAttribute('x2', isVertical ? dimensionEndX : endX);
    extensionLine2.setAttribute('y2', isVertical ? endY : dimensionEndY);
    extensionLine2.setAttribute('stroke', 'gray');
    extensionLine2.setAttribute('stroke-width', 1);
    extensionLine2.setAttribute('stroke-dasharray', '2,2');
    if (wallId) extensionLine2.setAttribute('data-wall-id', wallId);
    extensionLine2.classList.add('dimension-extension-line');
    svgElement.appendChild(extensionLine2);

    // Add dimension line
    const dimensionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    dimensionLine.setAttribute('x1', dimensionStartX);
    dimensionLine.setAttribute('y1', dimensionStartY);
    dimensionLine.setAttribute('x2', dimensionEndX);
    dimensionLine.setAttribute('y2', dimensionEndY);
    dimensionLine.setAttribute('stroke', 'black');
    dimensionLine.setAttribute('stroke-width', 1);
    if (wallId) dimensionLine.setAttribute('data-wall-id', wallId);
    dimensionLine.classList.add('dimension');
    svgElement.appendChild(dimensionLine);

    // Add dimension tick (start)
    const tickStart = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    if (isVertical) {
        tickStart.setAttribute('x1', dimensionStartX - tickLength / 2);
        tickStart.setAttribute('y1', dimensionStartY);
        tickStart.setAttribute('x2', dimensionStartX + tickLength / 2);
        tickStart.setAttribute('y2', dimensionStartY);
    } else {
        tickStart.setAttribute('x1', dimensionStartX);
        tickStart.setAttribute('y1', dimensionStartY - tickLength / 2);
        tickStart.setAttribute('x2', dimensionStartX);
        tickStart.setAttribute('y2', dimensionStartY + tickLength / 2);
    }
    tickStart.setAttribute('stroke', 'black');
    tickStart.setAttribute('stroke-width', 1);
    if (wallId) tickStart.setAttribute('data-wall-id', wallId);
    tickStart.classList.add('dimension-tick');
    svgElement.appendChild(tickStart);

    // Add dimension tick (end)
    const tickEnd = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    if (isVertical) {
        tickEnd.setAttribute('x1', dimensionEndX - tickLength / 2);
        tickEnd.setAttribute('y1', dimensionEndY);
        tickEnd.setAttribute('x2', dimensionEndX + tickLength / 2);
        tickEnd.setAttribute('y2', dimensionEndY);
    } else {
        tickEnd.setAttribute('x1', dimensionEndX);
        tickEnd.setAttribute('y1', dimensionEndY - tickLength / 2);
        tickEnd.setAttribute('x2', dimensionEndX);
        tickEnd.setAttribute('y2', dimensionEndY + tickLength / 2);
    }
    tickEnd.setAttribute('stroke', 'black');
    tickEnd.setAttribute('stroke-width', 1);
    if (wallId) tickEnd.setAttribute('data-wall-id', wallId);
    tickEnd.classList.add('dimension-tick');
    svgElement.appendChild(tickEnd);

    // Add dimension label
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const labelX = isVertical ? dimensionStartX - 10 : midX;
    const labelY = isVertical ? midY : dimensionStartY - 5;

    const dimensionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dimensionText.setAttribute('x', labelX);
    dimensionText.setAttribute('y', labelY);
    if (isVertical) {
        dimensionText.setAttribute('transform', `rotate(-90, ${labelX}, ${labelY})`);
    }
    dimensionText.setAttribute('fill', 'blue');
    dimensionText.setAttribute('font-size', '14px');
    dimensionText.setAttribute('font-family', 'Arial');
    dimensionText.setAttribute('text-anchor', 'middle');
    dimensionText.textContent = label;
    if (wallId) dimensionText.setAttribute('data-wall-id', wallId);
    dimensionText.classList.add('dimension-label');
    svgElement.appendChild(dimensionText);

    console.log(`Dimension added: ${label} for wall ID: ${wallId || 'unknown'}`);
  }
  
  // Add ticks to the dimension lines
  addDimensionTick(svgElement, x, y, isVertical, lineLength) {
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    if (isVertical) {
        tick.setAttribute('x1', x - lineLength / 2);
        tick.setAttribute('y1', y);
        tick.setAttribute('x2', x + lineLength / 2);
        tick.setAttribute('y2', y);
    } else {
        tick.setAttribute('x1', x);
        tick.setAttribute('y1', y - lineLength / 2);
        tick.setAttribute('x2', x);
        tick.setAttribute('y2', y + lineLength / 2);
    }
    tick.setAttribute('stroke', 'black');
    tick.setAttribute('stroke-width', 1);
    svgElement.appendChild(tick);
  }

  drawWallPlan(svgElement, gapWidth = 5) {
    if (!svgElement) {
      console.error('Wall plan SVG element is undefined.');
      return;
    }
  
    const planWidth = this.buildingModel.length * SCALING_FACTOR;
    const planHeight = this.buildingModel.width * SCALING_FACTOR;
  
    // Validate dimensions before rendering
    if (!planWidth || !planHeight || planWidth <= 0 || planHeight <= 0) {
      console.warn('Cannot render wall plan. Missing or invalid dimensions.');
      return;
    }
  
    console.log('Rendering wall plan...');
  
    // Clear existing elements
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }
  
    // Resize and center the SVG
    this.resizeAndCenter(svgElement, planWidth, planHeight);
  
    // Draw the outer wall
    const outerWall = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    outerWall.setAttribute('x', 0);
    outerWall.setAttribute('y', 0);
    outerWall.setAttribute('width', planWidth);
    outerWall.setAttribute('height', planHeight);
    outerWall.setAttribute('fill', 'none');
    outerWall.setAttribute('stroke', 'black');
    outerWall.setAttribute('stroke-width', 2);
    svgElement.appendChild(outerWall);
  
    // Draw the inner wall
    const innerWall = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    innerWall.setAttribute('x', gapWidth);
    innerWall.setAttribute('y', gapWidth);
    innerWall.setAttribute('width', planWidth - 2 * gapWidth);
    innerWall.setAttribute('height', planHeight - 2 * gapWidth);
    innerWall.setAttribute('fill', 'none');
    innerWall.setAttribute('stroke', 'gray');
    innerWall.setAttribute('stroke-width', 2);
    svgElement.appendChild(innerWall);
  
    // Add dimensions for the top and left sides only
    const offset = 20; // Offset for dimension lines
    this.addDimension(svgElement, 0, -offset, planWidth, -offset, `${this.buildingModel.length.toFixed(2)} m`, { isVertical: false });
    this.addDimension(svgElement, -offset, 0, -offset, planHeight, `${this.buildingModel.width.toFixed(2)} m`, { isVertical: true });
  
    // Draw dynamically added walls
    const walls = this.buildingModel.getWalls();
    walls.forEach((wall) => {
      this.drawWallInPlan(svgElement, wall); // Include proper scaling and offsets
    });
  
    console.log('Wall plan updated with all walls.');
  }

  // Draw wall in plan and apply TEXT_STYLE to text
  drawWallInPlan(svgElement, wall) {
    const { startX, startZ, endX, endZ } = wall;
  
    // Offset coordinates to align with the building boundary
    const offsetX = this.buildingModel.length * SCALING_FACTOR / 2;
    const offsetZ = this.buildingModel.width * SCALING_FACTOR / 2;
  
    // Convert coordinates to SVG space with scaling and offset
    const x1 = startX * SCALING_FACTOR + offsetX;
    const y1 = startZ * SCALING_FACTOR + offsetZ;
    const x2 = endX * SCALING_FACTOR + offsetX;
    const y2 = endZ * SCALING_FACTOR + offsetZ;
  
    // Draw the wall line
    const wallLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    wallLine.setAttribute('x1', x1);
    wallLine.setAttribute('y1', y1);
    wallLine.setAttribute('x2', x2);
    wallLine.setAttribute('y2', y2);
    wallLine.setAttribute('stroke', 'black');
    wallLine.setAttribute('stroke-width', 2);
    wallLine.classList.add('wall-line');
    svgElement.appendChild(wallLine);
  
    // Add dimensions for the wall
    const wallLength = this.calculateLineLength(startX, startZ, endX, endZ);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
  
    const dimensionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dimensionText.setAttribute('x', midX);
    dimensionText.setAttribute('y', midY - 10); // Slight offset above the wall
  
    // Apply centralized text style
    applyTextStyle(dimensionText);
  
    dimensionText.textContent = `${wallLength.toFixed(2)} m`;
    svgElement.appendChild(dimensionText);
  }

  drawFloorPlan(svgElement) {
    if (!svgElement) {
      console.error('Floor plan SVG element is undefined.');
      return;
    }
  
    console.log('Rendering floor plan...');
    
    // Clear the SVG element
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }
  
    const planWidth = this.buildingModel.length * SCALING_FACTOR;
    const planHeight = this.buildingModel.width * SCALING_FACTOR;
  
    if (!planWidth || !planHeight) {
      console.error('Cannot render floor plan. Missing or invalid dimensions.');
      return;
    }
  
    // Resize and center the SVG
    this.resizeAndCenter(svgElement, planWidth, planHeight);
  
    // Draw a simple grid for the floor plan
    const floorGrid = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    floorGrid.setAttribute('x', 0);
    floorGrid.setAttribute('y', 0);
    floorGrid.setAttribute('width', planWidth);
    floorGrid.setAttribute('height', planHeight);
    floorGrid.setAttribute('fill', '#f0f0f0');
    floorGrid.setAttribute('stroke', 'gray');
    floorGrid.setAttribute('stroke-width', 1);
  
    svgElement.appendChild(floorGrid);
  
    console.log('Floor plan drawn successfully.');
  }  
  
  drawCeilingPlan(svgElement) {
    if (!svgElement) {
      console.error('Ceiling plan SVG element is undefined.');
      return;
    }
  
    console.log('Rendering ceiling plan...');
  
    // Clear the SVG element
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }
  
    const planWidth = this.buildingModel.length * SCALING_FACTOR;
    const planHeight = this.buildingModel.width * SCALING_FACTOR;
  
    if (!planWidth || !planHeight) {
      console.error('Cannot render ceiling plan. Missing or invalid dimensions.');
      return;
    }
  
    // Resize and center the SVG
    this.resizeAndCenter(svgElement, planWidth, planHeight);
  
    // Draw a basic ceiling outline (similar to the wall outline for now)
    const ceilingOutline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ceilingOutline.setAttribute('x', 0);
    ceilingOutline.setAttribute('y', 0);
    ceilingOutline.setAttribute('width', planWidth);
    ceilingOutline.setAttribute('height', planHeight);
    ceilingOutline.setAttribute('stroke', 'blue');
    ceilingOutline.setAttribute('fill', 'none');
    ceilingOutline.setAttribute('stroke-width', 2);
  
    svgElement.appendChild(ceilingOutline);
  
    console.log('Ceiling plan drawn successfully.');
  }  

  resizeAndCenter(svgElement, contentWidth, contentHeight, padding = 50) {
    if (!svgElement) {
      console.error('Cannot resize and center SVG. Missing SVG element.');
      return;
    }
    if (!contentWidth || !contentHeight || contentWidth <= 0 || contentHeight <= 0) {
      console.error('Cannot resize and center SVG. Missing or invalid dimensions.');
      return;
    }
  
    // Calculate the new viewBox size with padding
    const viewBoxWidth = contentWidth + padding * 2;
    const viewBoxHeight = contentHeight + padding * 2;
  
    svgElement.setAttribute(
      'viewBox',
      `-${padding} -${padding} ${viewBoxWidth} ${viewBoxHeight}`
    );
  
    console.log('SVG resized and centered to fit content.');
  }  
  
  // Attach a resize listener to the plan viewer
  initializeResizeListener() {
    const planViewer = document.getElementById('plan-viewer');
    if (!planViewer) {
      console.error('Plan viewer element is not found.');
      return;
    }
  
    const resizeObserver = new ResizeObserver(() => {
      const activePlan = document.querySelector('.plan:not(.hidden)');
      if (!activePlan) {
        console.log("No active plan is visible.");
        return;
      }
  
      const contentWidth = this.buildingModel?.length * SCALING_FACTOR || 0;
      const contentHeight = this.buildingModel?.width * SCALING_FACTOR || 0;
  
      if (contentWidth > 0 && contentHeight > 0) {
        // Call resizeAndCenter only if valid dimensions are available
        console.log("Resizing active plan:", { contentWidth, contentHeight });
        this.resizeAndCenter(activePlan, contentWidth, contentHeight);
      } else {
        console.warn("Skipping resize. Missing or invalid building model dimensions.", {
          length: this.buildingModel?.length,
          width: this.buildingModel?.width,
        });
      }
    });
  
    resizeObserver.observe(planViewer);
  }  


  //Edit wall method starts here
  initializeEditWallButton() {
    if (this.isEditWallButtonInitialized) return; // Prevent re-initialization
    this.isEditWallButtonInitialized = true;

    const editWallButton = document.getElementById('edit-wall');

    if (!editWallButton) {
        console.error('Edit Wall button not found.');
        return;
    }

    editWallButton.addEventListener('click', () => {
        this.toggleEditWallMode();
    });

    console.log('Edit Wall button initialized.');
  }

  toggleEditWallMode() {
    if (this.isTogglingEditWallMode) return; // Prevent re-entry
    this.isTogglingEditWallMode = true;

    this.isEditWallMode = !this.isEditWallMode;

    if (this.isEditWallMode) {
        console.log('Edit Wall mode enabled.');
        this.enableLineEditing();
    } else {
        console.log('Edit Wall mode disabled.');
        this.disableLineEditing();
    }

    setTimeout(() => {
        this.isTogglingEditWallMode = false; // Reset flag after execution
    }, 0);  
  }

  enableLineEditing() {
    if (this.isLineEditingEnabled) return; // Prevent duplicate enabling
    this.isLineEditingEnabled = true;

    const lines = this.planElement.querySelectorAll('.wall-line');
    lines.forEach((line) => {
        line.addEventListener('mouseenter', this.onLineHoverEnter.bind(this));
        line.addEventListener('mouseleave', this.onLineHoverLeave.bind(this));
        line.addEventListener('click', this.onLineClick.bind(this));
    });

    console.log('Line editing enabled.');
  }

  disableLineEditing() {
    if (!this.isLineEditingEnabled) return; // Prevent duplicate disabling
    this.isLineEditingEnabled = false;

    const lines = this.planElement.querySelectorAll('.wall-line');
    lines.forEach((line) => {
        line.removeEventListener('mouseenter', this.onLineHoverEnter.bind(this));
        line.removeEventListener('mouseleave', this.onLineHoverLeave.bind(this));
        line.removeEventListener('click', this.onLineClick.bind(this));
    });

    console.log('Line editing disabled.');
  }

  onLineHoverEnter(event) {
    const hoveredLine = event.target;

    // Ensure the hovered element is a wall line
    if (hoveredLine.classList.contains('wall-line')) {
        hoveredLine.style.cursor = 'pointer'; // Change cursor to pointer
    }
  }

  onLineHoverLeave(event) {
    const hoveredLine = event.target;

    // Reset cursor style
    if (hoveredLine.classList.contains('wall-line')) {
        hoveredLine.style.cursor = 'default'; // Reset to default cursor
    }
  }

  onLineClick(event) {
    const selectedLine = event.target;

    // Ensure only wall lines can be selected
    if (!selectedLine.classList.contains('wall-line')) {
        return;
    }

    // Retrieve the wall segment ID from the clicked line
    const wallSegmentId = selectedLine.getAttribute('data-wall-id');

    if (!wallSegmentId) {
        console.warn('Selected line does not have an associated wall segment ID.');
        return;
    }

    // Remove highlight from previously selected lines
    const allLines = this.planElement.querySelectorAll('.wall-line');
    allLines.forEach(line => line.classList.remove('selected-line'));

    // Highlight the clicked line
    selectedLine.classList.add('selected-line');

    // Remove any existing floating button
    const existingButton = document.getElementById('remove-line-button');
    if (existingButton) existingButton.remove();

    // Create a floating button for wall removal
    const button = document.createElement('button');
    button.id = 'remove-line-button';
    button.textContent = '🗑️'; // Trash bin icon
    button.style.position = 'absolute';
    button.style.zIndex = '1000';
    button.style.background = '#f44336'; // Red background
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '50%';
    button.style.width = '30px';
    button.style.height = '30px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';

    // Get the coordinates of the clicked line's midpoint
    const x1 = parseFloat(selectedLine.getAttribute('x1'));
    const y1 = parseFloat(selectedLine.getAttribute('y1'));
    const x2 = parseFloat(selectedLine.getAttribute('x2'));
    const y2 = parseFloat(selectedLine.getAttribute('y2'));

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Transform the midpoint coordinates from SVG to screen space
    const point = this.planElement.createSVGPoint();
    point.x = midX;
    point.y = midY;
    const transformedPoint = point.matrixTransform(this.planElement.getScreenCTM());

    // Position the button near the line's midpoint
    button.style.left = `${transformedPoint.x + 10}px`; // Offset 10px to the right
    button.style.top = `${transformedPoint.y - 15}px`; // Center vertically with a 15px adjustment

    // Attach click handler to remove the selected wall segment
    button.addEventListener('click', () => {
        this.removeSegment(wallSegmentId, selectedLine, button);
    });

    // Append the button to the document
    document.body.appendChild(button);

    console.log(`Wall segment with ID ${wallSegmentId} selected.`);
}

removeSegment(wallSegmentId, lineElement, buttonElement) {
    // Ensure both line and button are valid
    if (!lineElement || !buttonElement) {
        console.warn('Line or button element is invalid for removal.');
        return;
    }

    console.log(`Removing wall segment with ID: ${wallSegmentId}`);

    // Remove the segment from the building model
    const segmentRemoved = this.buildingModel.removeWall(wallSegmentId);

    if (segmentRemoved) {
        console.log(`Wall segment successfully removed: ${wallSegmentId}`);

        // Remove the line element from the SVG
        lineElement.remove();

        // Remove the floating button
        buttonElement.remove();

        // Update the 3D scene to reflect the removal
        this.sceneController.updateScene(this.buildingModel.getWalls());

        console.log('3D scene updated after wall segment removal.');
    } else {
        console.warn(`Wall segment with ID ${wallSegmentId} could not be removed from the building model.`);
    }
  }

  removeLine(line) {
    // Retrieve the wall ID from the selected line
    const wallId = line.getAttribute('data-wall-id');

    if (!wallId) {
        console.warn('Line does not have an associated wall ID. Skipping removal.');
        return;
    }

    console.log('Removing wall with ID:', wallId);

    // Remove the wall from the BuildingModel
    const wallRemoved = this.buildingModel.removeWall(wallId);

    if (wallRemoved) {
        console.log('Wall successfully removed:', wallRemoved);

        // Remove the line from the SVG
        line.remove();
        console.log('Line successfully removed from the SVG.');

        // Remove associated dimension lines, labels, and other related elements
        const associatedElements = this.planElement.querySelectorAll(`[data-wall-id="${wallId}"]`);
        associatedElements.forEach((element) => {
            element.remove();
            console.log('Associated element removed:', element);
        });

        // Update the 3D scene with the remaining walls
        if (this.sceneController && typeof this.sceneController.updateScene === 'function') {
            this.sceneController.updateScene(this.buildingModel.getWalls());
            console.log('3D model updated to reflect wall removal.');
        }
    } else {
        console.warn(`Wall with ID ${wallId} not found in BuildingModel.`);
    }
  }

  onLineMouseDown(event) {
    const selectedLine = event.target;
    const initialMousePos = this.getMousePosition(event);

    const initialX1 = parseFloat(selectedLine.getAttribute('x1'));
    const initialY1 = parseFloat(selectedLine.getAttribute('y1'));
    const initialX2 = parseFloat(selectedLine.getAttribute('x2'));
    const initialY2 = parseFloat(selectedLine.getAttribute('y2'));

    const onMouseMove = (moveEvent) => {
        const currentMousePos = this.getMousePosition(moveEvent);
        const dx = currentMousePos.x - initialMousePos.x;
        const dy = currentMousePos.y - initialMousePos.y;

        selectedLine.setAttribute('x1', initialX1 + dx);
        selectedLine.setAttribute('y1', initialY1 + dy);
        selectedLine.setAttribute('x2', initialX2 + dx);
        selectedLine.setAttribute('y2', initialY2 + dy);
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  initializeLogWallsButton() {
    const logWallsButton = document.getElementById('log-walls-button');
    if (!logWallsButton) {
      console.error('Log Walls button not found.');
      return;
    }
  
    logWallsButton.addEventListener('click', () => {
      this.buildingModel.logAllWalls();
    });
  
    console.log('Log Walls button initialized.');
  }

  logAllWalls() {
    const walls = this.buildingModel.getWalls();
    console.log('Logging all walls:', walls);

    if (walls.length === 0) {
        console.log('No walls exist.');
    } else {
        walls.forEach((wall, index) => {
            console.log(`Wall ${index + 1}:`, wall);
        });
    }
  }
}