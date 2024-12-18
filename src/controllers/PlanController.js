import { SCALING_FACTOR } from '../utils/Utils.js';

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
      }

  // Set the dimensions of the plan
  setDimensions(length, width) {
    this.buildingModel.length = length;
    this.buildingModel.width = width;
    console.log(`Plan dimensions set: Length = ${length}, Width = ${width}`);
  }

  updateWallDimensions() {
    const svgElement = this.planElement; // Reference to the wall-plan SVG
    if (!svgElement) return;
  
    // Clear existing dimensions
    const existingDimensions = svgElement.querySelectorAll('.dimension');
    existingDimensions.forEach(dim => dim.remove());
  
    // Iterate over all walls and calculate dimensions
    this.buildingModel.getWalls().forEach((wall) => {
      const { startX, startZ, endX, endZ } = wall;
  
      // Calculate wall length
      const length = Math.sqrt((endX - startX) ** 2 + (endZ - startZ) ** 2).toFixed(2);
  
      // Calculate midpoint for placing the dimension text
      const midX = (startX + endX) / 2;
      const midY = (startZ + endZ) / 2;
  
      // Create a line for the dimension
      const dimensionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      dimensionLine.setAttribute('x1', startX);
      dimensionLine.setAttribute('y1', startZ);
      dimensionLine.setAttribute('x2', endX);
      dimensionLine.setAttribute('y2', endZ);
      dimensionLine.setAttribute('stroke', 'gray');
      dimensionLine.setAttribute('stroke-dasharray', '4,2');
      dimensionLine.classList.add('dimension');
      svgElement.appendChild(dimensionLine);
  
      // Add text for the dimension length
      const dimensionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      dimensionText.setAttribute('x', midX);
      dimensionText.setAttribute('y', midY - 5); // Adjust position slightly above the wall
      dimensionText.setAttribute('fill', 'black');
      dimensionText.setAttribute('font-size', '12');
      dimensionText.classList.add('dimension');
      dimensionText.textContent = `${length} mm`;
      svgElement.appendChild(dimensionText);
    });
  }

  // Draw the wall plan (initial outline)
  drawWallPlan() {
    while (this.planElement.firstChild) {
      this.planElement.removeChild(this.planElement.firstChild);
    }

    const offset = 50; // Padding around the plan
    const planWidth = this.buildingModel.length * SCALING_FACTOR;
    const planHeight = this.buildingModel.width * SCALING_FACTOR;

    this.planElement.setAttribute(
      'viewBox',
      `0 0 ${planWidth + offset * 2} ${planHeight + offset * 2}`
    );

    const outline = [
      { x1: offset, y1: offset, x2: offset + planWidth, y2: offset },
      { x1: offset + planWidth, y1: offset, x2: offset + planWidth, y2: offset + planHeight },
      { x1: offset + planWidth, y1: offset + planHeight, x2: offset, y2: offset + planHeight },
      { x1: offset, y1: offset + planHeight, x2: offset, y2: offset }
    ];

    outline.forEach((line) => {
      const wallLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      wallLine.setAttribute('x1', line.x1);
      wallLine.setAttribute('y1', line.y1);
      wallLine.setAttribute('x2', line.x2);
      wallLine.setAttribute('y2', line.y2);
      wallLine.setAttribute('stroke', 'black');
      wallLine.setAttribute('stroke-width', 2);
      this.planElement.appendChild(wallLine);
    });

    console.log('Wall plan drawn.');
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

    this.currentAction = 'draw-wall';
    let startX = null;
    let startY = null;
    let tempLine = null;

    const getMousePosition = (event) => {
      const point = this.planElement.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const svgPoint = point.matrixTransform(this.planElement.getScreenCTM().inverse());
      return { x: svgPoint.x, y: svgPoint.y };
    };

    const onMouseDown = (event) => {
      const { x, y } = getMousePosition(event);

      if (startX === null && startY === null) {
        startX = x;
        startY = y;

        tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tempLine.setAttribute('x1', x);
        tempLine.setAttribute('y1', y);
        tempLine.setAttribute('x2', x);
        tempLine.setAttribute('y2', y);
        tempLine.setAttribute('stroke', 'gray');
        tempLine.setAttribute('stroke-dasharray', '5,5');
        this.planElement.appendChild(tempLine);
      } else {
        const endX = x;
        const endY = y;

        this.addWall(startX, startY, endX, endY);

        if (tempLine) this.planElement.removeChild(tempLine);
        startX = null;
        startY = null;
      }
    };

    const onMouseMove = (event) => {
      if (startX !== null && startY !== null && tempLine) {
        const { x, y } = getMousePosition(event);
        tempLine.setAttribute('x2', x);
        tempLine.setAttribute('y2', y);
      }
    };

    this.planElement.addEventListener('mousedown', onMouseDown);
    this.planElement.addEventListener('mousemove', onMouseMove);

    this.exitDrawingWall = () => {
      this.planElement.removeEventListener('mousedown', onMouseDown);
      this.planElement.removeEventListener('mousemove', onMouseMove);
      if (tempLine) this.planElement.removeChild(tempLine);
    };
  }

  // Add a permanent wall to the plan and sync with 3D
  addWall(startX, startY, endX, endY) {
    const wallThickness = parseFloat(this.wallThicknessInput.value) || 0.2;
    const wallHeight = parseFloat(this.wallHeightInput.value) || 3;
  
    const startCoords = this.convertTo3DCoordinates(startX, startY);
    const endCoords = this.convertTo3DCoordinates(endX, endY);
  
    this.buildingModel.addWall(
      startCoords.x, startCoords.z,
      endCoords.x, endCoords.z,
      wallThickness, wallHeight
    );
  
    // Update 3D Scene
    this.sceneController.updateScene(this.buildingModel.getWalls());
  
    // Update 2D Plan
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', 2);
    this.planElement.appendChild(line);
  
    console.log('Wall added to 2D plan and synced with 3D.');
  
    // Update dimensions
    this.updateWallDimensions();
    this.splitWallOnIntersection(newWall);
    this.walls.push(newWall);

  }

  // Convert 2D coordinates to 3D space
  convertTo3DCoordinates(x, y) {
    const viewBox = this.planElement.getAttribute('viewBox').split(' ').map(Number);
    const offsetX = x - viewBox[0] - viewBox[2] / 2;
    const offsetY = y - viewBox[1] - viewBox[3] / 2;
    return { x: offsetX / SCALING_FACTOR, z: -offsetY / SCALING_FACTOR };
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
  
    const offset = 50; // Add padding around the plan
    const planWidth = this.buildingModel.length * SCALING_FACTOR;
    const planHeight = this.buildingModel.width * SCALING_FACTOR;
  
    // Set the viewBox to fit the content and center it
    svgElement.setAttribute(
      'viewBox',
      `-${offset} -${offset} ${planWidth + offset * 2} ${planHeight + offset * 2}`
    );
  
    // Draw the building outline
    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    outline.setAttribute('x', 0);
    outline.setAttribute('y', 0);
    outline.setAttribute('width', planWidth);
    outline.setAttribute('height', planHeight);
    outline.setAttribute('stroke', 'black');
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke-width', 2);
  
    svgElement.appendChild(outline);
  }  
  
  drawFloorPlan(svgElement) {
    console.log('Rendering floor plan...');
    // Clear the SVG element
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }
  
    // Draw a simple grid for the floor plan
    const floorGrid = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    floorGrid.setAttribute('x', 50);
    floorGrid.setAttribute('y', 50);
    floorGrid.setAttribute('width', this.buildingModel.length * SCALING_FACTOR);
    floorGrid.setAttribute('height', this.buildingModel.width * SCALING_FACTOR);
    floorGrid.setAttribute('fill', '#f0f0f0');
    floorGrid.setAttribute('stroke', 'gray');
    floorGrid.setAttribute('stroke-width', 1);
  
    svgElement.appendChild(floorGrid);
  }
  
  drawCeilingPlan(svgElement) {
    console.log('Rendering ceiling plan...');
    // Clear the SVG element
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }
  
    // Draw a basic ceiling outline (similar to the wall outline for now)
    const ceilingOutline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ceilingOutline.setAttribute('x', 50);
    ceilingOutline.setAttribute('y', 50);
    ceilingOutline.setAttribute('width', this.buildingModel.length * SCALING_FACTOR);
    ceilingOutline.setAttribute('height', this.buildingModel.width * SCALING_FACTOR);
    ceilingOutline.setAttribute('stroke', 'blue');
    ceilingOutline.setAttribute('fill', 'none');
    ceilingOutline.setAttribute('stroke-width', 2);
  
    svgElement.appendChild(ceilingOutline);
  }
  resizeAndCenter(svgElement) {
    if (!svgElement || !this.buildingModel.length || !this.buildingModel.width) {
      console.error('Cannot resize and center SVG. Missing element or dimensions.');
      return;
    }
  
    const offset = 50; // Add padding
    const planWidth = this.buildingModel.length * SCALING_FACTOR;
    const planHeight = this.buildingModel.width * SCALING_FACTOR;
  
    // Update viewBox to center the content
    svgElement.setAttribute(
      'viewBox',
      `-${offset} -${offset} ${planWidth + offset * 2} ${planHeight + offset * 2}`
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
      if (activePlan) {
        this.resizeAndCenter(activePlan);
      }
    });
  
    resizeObserver.observe(planViewer);
  }
}