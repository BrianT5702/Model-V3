export default class PlanController {
  constructor(sceneController, buildingModel) {
    this.sceneController = sceneController; // Store SceneController
    this.buildingModel = buildingModel; // Store BuildingModel
    this.activePlan = 'wall'; // Default to wall plan
    this.planElement = document.getElementById('wall-plan'); // Reference wall-plan SVG
    this.initializePlanToggle();
}

  initializePlanToggle() {
    const wallPlanButton = document.getElementById('show-wall-plan');
    const floorPlanButton = document.getElementById('show-floor-plan');
    const ceilingPlanButton = document.getElementById('show-ceiling-plan');

    const wallPlan = document.getElementById('wall-plan');
    const floorPlan = document.getElementById('floor-plan');
    const ceilingPlan = document.getElementById('ceiling-plan');

    wallPlanButton.addEventListener('click', () => {
        if (!this.length || !this.width) {
            const lengthInput = parseFloat(document.getElementById('length').value);
            const widthInput = parseFloat(document.getElementById('width').value);
            if (!lengthInput || !widthInput || lengthInput <= 0 || widthInput <= 0) {
                alert('Please provide valid dimensions first.');
                return;
            }

            // Explicitly set dimensions
            this.setDimensions(lengthInput, widthInput);
            console.log('Dimensions set before displaying Wall Plan.');
        }
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

setDimensions(length, width) {
  if (!length || !width || length <= 0 || width <= 0) {
      console.error('Invalid Length or Width provided.');
      return;
  }
  this.length = length;
  this.width = width;
  console.log(`Dimensions set: Length = ${length}, Width = ${width}`);
}

switchPlan(planType, activePlanElement, otherPlanElements) {
  console.log(`Displaying ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`);
  this.activePlan = planType;

  // Prevent unnecessary errors
  if (!this.length || !this.width) {
      console.warn('Length and Width are not set. Cannot display the plan.');
      return;
  }

  // Hide all other plans
  otherPlanElements.forEach((element) => element.classList.add('hidden'));

  // Show the active plan
  activePlanElement.classList.remove('hidden');

  // Render the specific plan
  if (planType === 'wall') {
      this.drawWallPlan(activePlanElement);
  } else if (planType === 'floor') {
      this.drawFloorPlan(activePlanElement);
  } else if (planType === 'ceiling') {
      this.drawCeilingPlan(activePlanElement);
  }
}

drawWallPlan(svgElement) {
  // Clear existing SVG elements
  while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
  }

  const scale = 25; // Scale factor for visualization
  const offset = 50; // Offset for dimensions outside the plan

  if (!this.length || !this.width) {
      console.error('Length and Width are not set for the plan.');
      return;
  }

  this.planWidth = this.length * scale;
  this.planHeight = this.width * scale;

  const planWidth = this.planWidth;
  const planHeight = this.planHeight;

  // Set the SVG viewBox with extra padding for dimensions
  svgElement.setAttribute("viewBox", `0 0 ${planWidth + offset * 2} ${planHeight + offset * 2}`);

  // Draw the walls (rectangle)
  const walls = [
      { x1: offset, y1: offset, x2: offset + planWidth, y2: offset }, // Top wall
      { x1: offset + planWidth, y1: offset, x2: offset + planWidth, y2: offset + planHeight }, // Right wall
      { x1: offset + planWidth, y1: offset + planHeight, x2: offset, y2: offset + planHeight }, // Bottom wall
      { x1: offset, y1: offset + planHeight, x2: offset, y2: offset } // Left wall
  ];

  walls.forEach((wall) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", wall.x1);
      line.setAttribute("y1", wall.y1);
      line.setAttribute("x2", wall.x2);
      line.setAttribute("y2", wall.y2);
      line.setAttribute("stroke", "black");
      line.setAttribute("stroke-width", 2);
      svgElement.appendChild(line);
  });

  // Draw dimensions
  const drawDimension = (x1, y1, x2, y2, label, isVertical = false) => {
      const dimLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      dimLine.setAttribute("x1", x1);
      dimLine.setAttribute("y1", y1);
      dimLine.setAttribute("x2", x2);
      dimLine.setAttribute("y2", y2);
      dimLine.setAttribute("stroke", "gray");
      dimLine.setAttribute("stroke-dasharray", "5,5");
      svgElement.appendChild(dimLine);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.textContent = label;
      text.setAttribute("fill", "blue");
      text.setAttribute("font-size", "14");
      text.setAttribute("text-anchor", "middle");

      if (isVertical) {
          text.setAttribute("x", x1 - 10);
          text.setAttribute("y", (y1 + y2) / 2);
          text.setAttribute("transform", `rotate(-90, ${x1 - 10}, ${(y1 + y2) / 2})`);
      } else {
          text.setAttribute("x", (x1 + x2) / 2);
          text.setAttribute("y", y1 - 10);
      }

      svgElement.appendChild(text);
  };

  // Top dimension
  drawDimension(offset, offset - 20, offset + planWidth, offset - 20, `${this.length.toFixed(2)} m`);
  // Left dimension
  drawDimension(offset - 20, offset, offset - 20, offset + planHeight, `${this.width.toFixed(2)} m`, true);
}

drawFloorPlan(svgElement) {
  // Clear existing SVG elements
  while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
  }

  // Draw the floor boundary (edges of the 3D model's base)
  const boundary = this.buildingModel.getFloorBoundary();
  this.drawEdges(svgElement, boundary);
  console.log('Floor plan rendered.');
}

drawCeilingPlan(svgElement) {
  // Clear existing SVG elements
  while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
  }

  // Draw the ceiling boundary (edges of the 3D model's top)
  const boundary = this.buildingModel.getCeilingBoundary();
  this.drawEdges(svgElement, boundary);
  console.log('Ceiling plan rendered.');
}

drawEdges(svgElement, boundary) {
  // Draw the boundary as four lines (edges of a rectangle)
  const { x, y, width, height } = boundary;

  const points = [
      { x1: x, y1: y, x2: x + width, y2: y },
      { x1: x + width, y1: y, x2: x + width, y2: y + height },
      { x1: x + width, y1: y + height, x2: x, y2: y + height },
      { x1: x, y1: y + height, x2: x, y2: y },
  ];

  points.forEach((edge) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', edge.x1 * 10);
      line.setAttribute('y1', edge.y1 * 10);
      line.setAttribute('x2', edge.x2 * 10);
      line.setAttribute('y2', edge.y2 * 10);
      line.setAttribute('stroke', 'black');
      line.setAttribute('stroke-width', 2);
      svgElement.appendChild(line);
  });
}

enableEditMode() {
  this.isEditMode = true;
  this.currentAction = null;
  this.newWalls = [];
  console.log('Edit mode enabled.');
}

disableEditMode() {
  this.isEditMode = false;
  this.currentAction = null;
  console.log('Edit mode disabled.');
}

startDrawingWall() {
  this.currentAction = 'draw-wall';
  this.tempWall = null;

  const svg = this.planElement;
  let startX = null;
  let startY = null;
  let tempLine = null;

  // Helper function to get mouse position in SVG coordinates
  const getMousePosition = (event) => {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
      return { x: svgPoint.x, y: svgPoint.y };
  };

  // MouseDown callback
  const onMouseDown = (event) => {
      const { x, y } = getMousePosition(event);

      if (startX === null && startY === null) {
          // First click: set the start point
          startX = x;
          startY = y;

          // Create a temporary line for visual feedback
          tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          tempLine.setAttribute('x1', startX);
          tempLine.setAttribute('y1', startY);
          tempLine.setAttribute('x2', startX); // Initial end point matches start point
          tempLine.setAttribute('y2', startY);
          tempLine.setAttribute('stroke', 'gray');
          tempLine.setAttribute('stroke-dasharray', '5,5');
          tempLine.setAttribute('stroke-width', 2);
          svg.appendChild(tempLine);

          console.log(`Wall start point: (${startX}, ${startY})`);
      } else {
          // Second click: set the end point and complete the wall
          const endX = x;
          const endY = y;

          console.log(`Wall end point: (${endX}, ${endY})`);

          // Add the wall to the plan and 3D model
          this.addWall(startX, startY, endX, endY);

          // Remove the temporary line
          if (tempLine) {
              svg.removeChild(tempLine);
          }

          // Reset for the next wall
          startX = null;
          startY = null;
          tempLine = null;
      }
  };

  // MouseMove callback
  const onMouseMove = (event) => {
      if (startX !== null && startY !== null && tempLine) {
          const { x, y } = getMousePosition(event);

          // Update the temporary line's endpoint to follow the mouse
          tempLine.setAttribute('x2', x);
          tempLine.setAttribute('y2', y);
      }
  };

  // Add event listeners
  svg.addEventListener('mousedown', onMouseDown);
  svg.addEventListener('mousemove', onMouseMove);

  // Cleanup function to remove event listeners and temporary lines
  const cleanup = () => {
      svg.removeEventListener('mousedown', onMouseDown);
      svg.removeEventListener('mousemove', onMouseMove);

      // Remove any leftover temporary lines
      if (tempLine && svg.contains(tempLine)) {
          svg.removeChild(tempLine);
      }
  };

  // Save cleanup function for future use
  this.exitDrawingWall = cleanup;
}

addWallToScene(wall) {
  // Calculate wall length using 2D coordinates
  const wallLength = Math.sqrt(
      Math.pow(wall.endX - wall.startX, 2) + Math.pow(wall.endY - wall.startY, 2)
  );

  const wallGeometry = new THREE.BoxGeometry(
      wallLength, // Length of the wall
      3,          // Wall height (fixed)
      0.2         // Wall thickness
  );

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

  // Map 2D start and end points to 3D
  const centerX = (wall.startX + wall.endX) / 2; // Midpoint X
  const centerZ = (wall.startY + wall.endY) / 2; // Midpoint Z
  const wallHeight = 1.5; // Half of the wall height for Y positioning

  wallMesh.position.set(centerX, wallHeight, centerZ);

  // Rotate wall if not horizontal
  const angle = Math.atan2(wall.endY - wall.startY, wall.endX - wall.startX);
  wallMesh.rotation.y = -angle;

  // Tag wall for future updates
  wallMesh.userData.type = 'wall';

  // Add wall to scene
  this.sceneView.scene.add(wallMesh);
  console.log(`Wall added to 3D scene at (${centerX}, ${wallHeight}, ${centerZ})`);
}

renderTemporaryWall(x1, y1, x2, y2) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', 'red');
  line.setAttribute('stroke-width', 2);

  this.planElement.appendChild(line);
}

update3DModel() {
  console.log('Updating 3D model with new walls...');
  this.sceneController.updateScene(this.buildingModel.getWalls());
}

addWall(startX, startY, endX, endY) {
    // Convert 2D coordinates to 3D
    const { startX3D, startZ3D, endX3D, endZ3D } = this.convertTo3DCoordinates(
        startX, startY, endX, endY
    );

    console.log('Adding wall with 3D coordinates:', {
        startX: startX3D,
        startZ: startZ3D,
        endX: endX3D,
        endZ: endZ3D,
    });

    // Retrieve wall height and thickness
    const wallHeight = parseFloat(document.getElementById('height').value) || 3;
    const wallThickness = parseFloat(document.getElementById('wall-thickness').value) || 0.2;

    // Add the wall to the building model
    this.buildingModel.addWall(startX3D, startZ3D, endX3D, endZ3D, wallThickness, wallHeight);

    // Add permanent line to the 2D plan
    this.addPermanentLine(startX, startY, endX, endY);

    // Update the 3D model
    this.update3DModel();
}

convertTo3DCoordinates(startX, startY, endX, endY) {
    // Use defined plan dimensions in meters
    const planWidth = this.planWidth;   // Real-world plan width (e.g., 10m)
    const planHeight = this.planHeight; // Real-world plan height (e.g., 10m)

    // Get SVG container dimensions in pixels
    const svgWidth = this.planElement.clientWidth;   // Width in pixels
    const svgHeight = this.planElement.clientHeight; // Height in pixels

    // Scaling factors to map pixels to meters
    const scaleX = planWidth / svgWidth;   // Conversion for X-axis
    const scaleY = planHeight / svgHeight; // Conversion for Y-axis

    // Centering the coordinates
    const startX3D = (startX * scaleX) - (planWidth / 2);   // Adjust X to center
    const startZ3D = -((startY * scaleY) - (planHeight / 2)); // Adjust Z and invert Y-axis
    const endX3D = (endX * scaleX) - (planWidth / 2);
    const endZ3D = -((endY * scaleY) - (planHeight / 2));

    console.log('Converted 3D Coordinates:', { startX3D, startZ3D, endX3D, endZ3D });
    return { startX3D, startZ3D, endX3D, endZ3D };
}

addPermanentLine(startX, startY, endX, endY) {
    console.log('Drawing permanent line:', { startX, startY, endX, endY });

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", startX);
    line.setAttribute("y1", startY);
    line.setAttribute("x2", endX);
    line.setAttribute("y2", endY);
    line.setAttribute("stroke", "black");
    line.setAttribute("stroke-width", "2");
    this.planElement.appendChild(line);
}

startDrawingWall() {
    this.currentAction = 'draw-wall';
    this.tempWall = null;

    const svg = this.planElement;
    let tempLine = null;

    const getMousePosition = (event) => {
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
        return { x: svgPoint.x, y: svgPoint.y };
    };

    const onMouseDown = (event) => {
        const { x, y } = getMousePosition(event);

        if (!this.startPoint) {
            // First click: Start point
            this.startPoint = { x, y };

            // Temporary line for preview
            tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tempLine.setAttribute('x1', x);
            tempLine.setAttribute('y1', y);
            tempLine.setAttribute('x2', x);
            tempLine.setAttribute('y2', y);
            tempLine.setAttribute('stroke', 'gray');
            tempLine.setAttribute('stroke-dasharray', '5,5');
            tempLine.setAttribute('stroke-width', 2);
            svg.appendChild(tempLine);

            console.log(`Wall start point: (${x}, ${y})`);
        } else {
            // Second click: End point
            const endX = x;
            const endY = y;

            console.log(`Wall end point: (${endX}, ${endY})`);

            // Add permanent wall and line
            this.addWall(this.startPoint.x, this.startPoint.y, endX, endY);

            // Clean up temporary line
            if (tempLine) {
                svg.removeChild(tempLine);
            }
        }
    };

    const onMouseMove = (event) => {
        if (this.startPoint && tempLine) {
            const { x, y } = getMousePosition(event);

            // Update temporary line
            tempLine.setAttribute('x2', x);
            tempLine.setAttribute('y2', y);
        }
    };

    svg.addEventListener('mousedown', onMouseDown);
    svg.addEventListener('mousemove', onMouseMove);

    this.exitDrawingWall = () => {
        svg.removeEventListener('mousedown', onMouseDown);
        svg.removeEventListener('mousemove', onMouseMove);
        if (tempLine && svg.contains(tempLine)) {
            svg.removeChild(tempLine);
        }
    };
}
}