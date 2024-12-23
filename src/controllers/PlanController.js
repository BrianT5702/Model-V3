import { SCALING_FACTOR, TEXT_STYLE } from '../utils/Utils.js';

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
  
  updateWallDimensions() {
    console.log('Updating wall dimensions...');
    const svgElement = this.planElement; // Reference to the wall-plan SVG
    if (!svgElement) {
        console.error('Wall plan SVG element is undefined.');
        return;
    }

    // Clear existing wall-specific dimensions
    const wallDimensions = svgElement.querySelectorAll('.dimension.wall');
    wallDimensions.forEach((dim) => dim.remove());

    const walls = this.buildingModel.getWalls();

    // Iterate over each wall and redraw its dimensions
    walls.forEach((wall) => {
        const wallLength = this.calculateLineLength(wall.startX, wall.startZ, wall.endX, wall.endZ);
        this.addDimension(
            this.planElement,
            wall.startX * SCALING_FACTOR,
            wall.startZ * SCALING_FACTOR,
            wall.endX * SCALING_FACTOR,
            wall.endZ * SCALING_FACTOR,
            `${wallLength} m`
        ).classList.add('wall');
    });

    console.log('Wall dimensions updated.');
  }

  drawSplitDimensions(svgElement, wall, intersectionPoints) {
    const { startX, startZ, endX, endZ } = wall;

    // Sort intersection points by their position along the wall
    const sortedPoints = [{ x: startX, z: startZ }, ...intersectionPoints, { x: endX, z: endZ }];
    sortedPoints.sort((a, b) => {
        const distanceA = Math.sqrt((a.x - startX) ** 2 + (a.z - startZ) ** 2);
        const distanceB = Math.sqrt((b.x - startX) ** 2 + (b.z - startZ) ** 2);
        return distanceA - distanceB;
    });

    // Draw dimensions for each segment
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const point1 = sortedPoints[i];
        const point2 = sortedPoints[i + 1];

        const segmentLength = this.calculateLineLength(point1.x, point1.z, point2.x, point2.z);

        // Draw dimension line
        this.addDimension(
          svgElement,
          point1.x * SCALING_FACTOR,
          point1.z * SCALING_FACTOR,
          point2.x * SCALING_FACTOR,
          point2.z * SCALING_FACTOR,
          `${segmentLength} m`
      );
    }
  }

  isPointOnWall(point, wall) {
    const tolerance = 0.1; // Adjust tolerance as needed
    const distanceToStart = Math.hypot(point.x - wall.startX, point.z - wall.startZ);
    const distanceToEnd = Math.hypot(point.x - wall.endX, point.z - wall.endZ);
    const wallLength = Math.hypot(wall.endX - wall.startX, wall.endZ - wall.startZ);

    return Math.abs(distanceToStart + distanceToEnd - wallLength) < tolerance;
  }
  
  calculateLineLength(x1, z1, x2, z2) {
    // Calculate the real-world length of a line
    const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
    return length.toFixed(2); // Return length with 2 decimal places  
  }

  drawWallDimensions() {
    // Get all walls from the BuildingModel
    const walls = this.buildingModel.getWalls();

    if (!walls || walls.length === 0) {
        console.log('No walls found. No dimensions to draw.');
        return;
    }

    // Iterate over all walls and draw dimensions
    walls.forEach(wall => {
        const wallLength = this.calculateLineLength(
            wall.startX,
            wall.startZ,
            wall.endX,
            wall.endZ
        );

        // Add dimension line
        this.addDimension(
            this.planElement,
            wall.startX * SCALING_FACTOR,
            wall.startZ * SCALING_FACTOR,
            wall.endX * SCALING_FACTOR,
            wall.endZ * SCALING_FACTOR,
            `${wallLength.toFixed(2)} m`
        );
    });

    console.log('Dimensions drawn for all walls.');
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

  if (this.currentAction === 'draw-wall') {
      this.exitDrawingWall(); // Only explicitly called when "Done Drawing" is clicked
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
    let guideLine = null;

    const SNAP_THRESHOLD = 10; // Pixel distance for snapping
    const WALL_SNAP_THRESHOLD = 10; // Pixel distance for snapping to walls

    const getMousePosition = (event) => {
        const point = this.planElement.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const svgPoint = point.matrixTransform(this.planElement.getScreenCTM().inverse());
        return { x: svgPoint.x, y: svgPoint.y };
    };

    const onMouseDown = (event) => {
        const { x, y } = getMousePosition(event);
        const clampedStart = this.clampToBoundary(x, y);

        if (startX === null && startY === null) {
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

            // Create guide line for snapping visualization
            guideLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            guideLine.setAttribute('x1', startX);
            guideLine.setAttribute('y1', startY);
            guideLine.setAttribute('x2', startX);
            guideLine.setAttribute('y2', startY);
            guideLine.setAttribute('stroke', 'blue');
            guideLine.setAttribute('stroke-dasharray', '2,2');
            this.planElement.appendChild(guideLine);
        } else {
            const endClamped = this.clampToBoundary(x, y);

            const endX = endClamped.x;
            const endY = endClamped.y;

            if (startX !== endX || startY !== endY) {
                this.addPermanentLine(startX, startY, endX, endY);
                this.addWall(startX, startY, endX, endY);
            }
        }
    };

    const onMouseMove = (event) => {
        if (startX !== null && startY !== null) {
            const { x, y } = getMousePosition(event);
            let clampedEnd = this.clampToBoundary(x, y);

            // Check snapping to straight alignment
            let alignedX = clampedEnd.x;
            let alignedY = clampedEnd.y;

            if (Math.abs(clampedEnd.x - startX) <= SNAP_THRESHOLD) {
                alignedX = startX; // Snap to vertical
            } else if (Math.abs(clampedEnd.y - startY) <= SNAP_THRESHOLD) {
                alignedY = startY; // Snap to horizontal
            }

            const nearestWallSnap = this.getNearestWallSnap(alignedX, alignedY, WALL_SNAP_THRESHOLD);
            if (nearestWallSnap) {
                alignedX = nearestWallSnap.x;
                alignedY = nearestWallSnap.y;
            }

            if (tempLine) {
                tempLine.setAttribute('x2', alignedX);
                tempLine.setAttribute('y2', alignedY);
            }

            if (guideLine) {
                guideLine.setAttribute('x2', alignedX);
                guideLine.setAttribute('y2', alignedY);
            }
        }
    };

    this.planElement.addEventListener('mousedown', onMouseDown);
    this.planElement.addEventListener('mousemove', onMouseMove);

    this.exitDrawingWall = () => {
        this.planElement.removeEventListener('mousedown', onMouseDown);
        this.planElement.removeEventListener('mousemove', onMouseMove);

        if (tempLine && this.planElement.contains(tempLine)) {
            this.planElement.removeChild(tempLine);
        }

        console.log('Exited wall drawing mode.');
        this.currentAction = null; // Ensure the state is reset
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

  getNearestWallSnap(x, y, threshold) {
    const walls = this.buildingModel.getWalls();

    for (let wall of walls) {
        const startDist = Math.hypot(wall.startX * SCALING_FACTOR - x, wall.startZ * SCALING_FACTOR - y);
        if (startDist <= threshold) {
            return { x: wall.startX * SCALING_FACTOR, y: wall.startZ * SCALING_FACTOR };
        }

        const endDist = Math.hypot(wall.endX * SCALING_FACTOR - x, wall.endZ * SCALING_FACTOR - y);
        if (endDist <= threshold) {
            return { x: wall.endX * SCALING_FACTOR, y: wall.endZ * SCALING_FACTOR };
        }
    }

    return null; // No nearby wall to snap to
  }

  // Add a permanent wall to the plan and sync with 3D
  addWall(startX, startY, endX, endY) {
    // Clamp both start and end points
    const clampedStart = this.clampToBoundary(startX, startY);
    const clampedEnd = this.clampToBoundary(endX, endY);

    // Convert 2D coordinates to 3D
    const startCoords = this.convertTo3DCoordinates(clampedStart.x, clampedStart.y);
    const endCoords = this.convertTo3DCoordinates(clampedEnd.x, clampedEnd.y);

    const wallData = {
        id: `wall-${Date.now()}-${Math.random().toString(16).slice(2)}`, // Unique ID
        startX: startCoords.x,
        startZ: startCoords.z,
        endX: endCoords.x,
        endZ: endCoords.z,
        width: parseFloat(this.wallThicknessInput.value) || 0.2,
        height: parseFloat(this.wallHeightInput.value) || 3,
    };

    // Add the wall to the BuildingModel
    const newWall = this.buildingModel.addWall(
        wallData.startX, wallData.startZ,
        wallData.endX, wallData.endZ,
        wallData.width, wallData.height
    );

    if (this.sceneController && typeof this.sceneController.updateScene === 'function') {
        this.sceneController.updateScene(this.buildingModel.getWalls());
        console.log('3D model updated with new wall.');
    } else {
        console.warn('SceneController is not available or updateScene method is missing.');
    }

    // Create the corresponding line element
    const line = this.addPermanentLine(clampedStart.x, clampedStart.y, clampedEnd.x, clampedEnd.y);

    // Link the line to the wall by adding a custom attribute
    line.setAttribute('data-wall-id', newWall.id);

    // Debug: Verify the wall ID is set
    console.log('Wall added and linked to line:', { wall: newWall, line });

    console.log('Wall added and linked to line:', newWall);
  }

  clearWallDimensions() {
    const dimensions = this.planElement.querySelectorAll('.dimension.wall');
    dimensions.forEach((dimension) => dimension.remove());
    console.log('Cleared previous wall dimensions.'); 
  }

  addPermanentLine(startX, startY, endX, endY) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', '2');
    line.classList.add('wall-line'); // Add wall-line class
    this.planElement.appendChild(line);

    console.log('Permanent line added.');
    return line; // Return the created line element
  }

  detectEdgeIntersections(newWall) {
    const intersections = [];
  
    this.edges.forEach((edge) => {
      const intersection = this.findIntersectionPoint(newWall, edge);
      if (intersection) {
        intersections.push({ edge, intersection });
      }
    });
  
    return intersections;
  }
  
  updateSplitDimensions(svgElement, intersections) {
    intersections.forEach(({ edge, intersection }) => {
      // Calculate split dimensions for the edge
      const distance1 = Math.hypot(intersection.x - edge.x1, intersection.y - edge.y1).toFixed(2);
      const distance2 = Math.hypot(intersection.x - edge.x2, intersection.y - edge.y2).toFixed(2);
  
      // Redraw dimensions for the edge with split parts
      console.log(`Split dimensions: ${distance1} m and ${distance2} m`);
      // Call drawDimension for each split part
    });
  }
  
  splitWallAtIntersection(newLine) {
    const walls = this.buildingModel.getWalls();
    const newWalls = [];
    const intersectionPoints = [];
    let wallWasSplit = false;

    walls.forEach((wall) => {
        const intersection = this.findIntersectionPoint(newLine, wall);
        if (intersection) {
            wallWasSplit = true;
            intersectionPoints.push(intersection);

            console.log("Intersection detected at:", intersection);

            // Split wall into two segments
            const firstSegment = {
                startX: wall.startX,
                startZ: wall.startZ,
                endX: intersection.x,
                endZ: intersection.z,
                width: wall.width,
                height: wall.height,
            };

            const secondSegment = {
                startX: intersection.x,
                startZ: intersection.z,
                endX: wall.endX,
                endZ: wall.endZ,
                width: wall.width,
                height: wall.height,
            };

            newWalls.push(firstSegment, secondSegment);
        } else {
            newWalls.push(wall);
        }
    });

    if (wallWasSplit) {
        this.buildingModel.walls = newWalls;
        console.log("Walls after splitting:", newWalls);
    } else {
        console.log("No intersections detected.");
    }

    // Return the list of intersection points
    return intersectionPoints;
  }

  findIntersectionPoint(wall1, wall2) {
    const { startX: x1, startZ: y1, endX: x2, endZ: y2 } = wall1; // Wall 1
    const { startX: x3, startZ: y3, endX: x4, endZ: y4 } = wall2; // Wall 2
  
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
    // Check if the lines are parallel (denominator is 0)
    if (Math.abs(denominator) < 1e-10) {
      return null; // No intersection
    }
  
    const px =
      ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
      denominator;
    const py =
      ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
      denominator;
  
    // Check if the intersection is within both segments
    if (
      px < Math.min(x1, x2) ||
      px > Math.max(x1, x2) ||
      px < Math.min(x3, x4) ||
      px > Math.max(x3, x4) ||
      py < Math.min(y1, y2) ||
      py > Math.max(y1, y2) ||
      py < Math.min(y3, y4) ||
      py > Math.max(y3, y4)
    ) {
      return null; // Intersection point is outside the segments
    }
  
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
      this.drawWallPlan(activePlanElement);
    } else if (planType === 'floor') {
      this.drawFloorPlan(activePlanElement);
    } else if (planType === 'ceiling') {
      this.drawCeilingPlan(activePlanElement);
    }
  }
  
  addDimension(svgElement, startX, startY, endX, endY, label, isVertical = false) {
    // Add dimension line
    const dimensionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    dimensionLine.setAttribute('x1', startX);
    dimensionLine.setAttribute('y1', startY);
    dimensionLine.setAttribute('x2', endX);
    dimensionLine.setAttribute('y2', endY);
    dimensionLine.setAttribute('stroke', 'gray');
    dimensionLine.setAttribute('stroke-dasharray', '5,5');
    dimensionLine.classList.add('dimension'); // Add 'dimension' class
    svgElement.appendChild(dimensionLine);

    // Add dimension text
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const dimensionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dimensionText.setAttribute('x', isVertical ? startX - 10 : midX);
    dimensionText.setAttribute('y', isVertical ? midY : startY - 10);

    if (isVertical) {
        dimensionText.setAttribute('transform', `rotate(-90, ${startX - 10}, ${midY})`);
    }

    dimensionText.setAttribute('fill', TEXT_STYLE.fill);
    dimensionText.setAttribute('font-size', TEXT_STYLE.fontSize);
    dimensionText.setAttribute('font-family', TEXT_STYLE.fontFamily);
    dimensionText.setAttribute('text-anchor', TEXT_STYLE.textAnchor);
    dimensionText.textContent = label;

    dimensionText.classList.add('dimension'); // Add 'dimension' class
    svgElement.appendChild(dimensionText);

    return dimensionLine; // Return the line for further manipulation
  }

  
  drawWallPlan(svgElement) {
    if (!svgElement) {
        console.error('Wall plan SVG element is undefined.');
        return;
    }

    console.log('Rendering wall plan...');

    // Clear existing elements
    while (svgElement.firstChild) {
        svgElement.removeChild(svgElement.firstChild);
    }

    const planWidth = this.buildingModel.length * SCALING_FACTOR;
    const planHeight = this.buildingModel.width * SCALING_FACTOR;

    if (!planWidth || !planHeight || planWidth <= 0 || planHeight <= 0) {
        console.error('Cannot render wall plan. Missing or invalid dimensions.');
        alert('Please set valid dimensions for the wall plan.');
        return; // Stop rendering if dimensions are invalid
    }

    // Resize and center the SVG
    this.resizeAndCenter(svgElement, planWidth, planHeight);

    // Draw the building outline
    const outline = [
        { x1: 0, y1: 0, x2: planWidth, y2: 0 }, // Top edge
        { x1: planWidth, y1: 0, x2: planWidth, y2: planHeight }, // Right edge
        { x1: planWidth, y1: planHeight, x2: 0, y2: planHeight }, // Bottom edge
        { x1: 0, y1: planHeight, x2: 0, y2: 0 } // Left edge
    ];

    outline.forEach((line) => {
        const wallLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        wallLine.setAttribute('x1', line.x1);
        wallLine.setAttribute('y1', line.y1);
        wallLine.setAttribute('x2', line.x2);
        wallLine.setAttribute('y2', line.y2);
        wallLine.setAttribute('stroke', 'black');
        wallLine.setAttribute('stroke-width', 2);
        svgElement.appendChild(wallLine);
    });

    // Add initial dimensions
    this.updateDimensions(svgElement, planWidth, planHeight);

    console.log('Wall plan drawn successfully.');
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
  
    const viewBoxWidth = contentWidth + padding * 2;
    const viewBoxHeight = contentHeight + padding * 2;
  
    svgElement.setAttribute(
      'viewBox',
      `-${padding} -${padding} ${viewBoxWidth} ${viewBoxHeight}`
    );
  
    console.log('SVG resized and centered.');
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

    // Remove highlight from previously selected lines
    const allLines = this.planElement.querySelectorAll('.wall-line');
    allLines.forEach(line => line.classList.remove('selected-line'));

    // Highlight the clicked line
    selectedLine.classList.add('selected-line');

    // Remove any existing floating button
    const existingButton = document.getElementById('remove-line-button');
    if (existingButton) existingButton.remove();

    // Create a floating button
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

    // Get the x2 and y2 coordinates of the line
    const x2 = parseFloat(selectedLine.getAttribute('x2'));
    const y2 = parseFloat(selectedLine.getAttribute('y2'));

    // Transform the coordinates from SVG to screen space
    const point = this.planElement.createSVGPoint();
    point.x = x2;
    point.y = y2;
    const transformedPoint = point.matrixTransform(this.planElement.getScreenCTM());

    // Position the button slightly to the right of the line's end point
    button.style.left = `${transformedPoint.x + 10}px`; // Offset 10px to the right
    button.style.top = `${transformedPoint.y - 15}px`; // Center vertically with a 15px adjustment

    // Attach click handler to remove the line
    button.addEventListener('click', () => {
        this.removeLine(selectedLine, button);
    });

    // Append the button to the document
    document.body.appendChild(button);
  }

  removeLine(line, button) {
    // Get the wall ID linked to the line
    const wallId = line.getAttribute('data-wall-id');

    if (!wallId) {
        console.warn('Line is not linked to any wall. Skipping wall removal.');
    } else {
        // Find and remove the wall in the BuildingModel
        const wallToRemove = this.buildingModel.getWalls().find(wall => wall.id === wallId);

        if (wallToRemove) {
            this.buildingModel.walls = this.buildingModel.getWalls().filter(wall => wall !== wallToRemove);
            console.log('Wall removed from BuildingModel:', wallToRemove);

            // Update the 3D scene
            if (this.sceneController && typeof this.sceneController.updateScene === 'function') {
                this.sceneController.updateScene(this.buildingModel.getWalls());
                console.log('3D model updated to reflect wall removal.');
            }
        } else {
            console.warn('Wall not found in BuildingModel. Skipping wall removal.');
        }
    }

    // Remove the selected line
    line.remove();

    // Remove the floating delete button
    button.remove();

    console.log('Wall line removed.');
  }

  refreshDimensions() {
    // Clear all existing dimensions
    const existingDimensions = this.planElement.querySelectorAll('.dimension, .dimension-label');
    existingDimensions.forEach(dim => dim.remove());

    // Re-draw dimensions for all remaining walls
    this.drawWallDimensions();
    console.log('Refreshed all dimensions for remaining walls.');
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
}