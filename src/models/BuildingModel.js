import WallModel from './WallModel.js';

export default class BuildingModel {
  constructor(length = 0, width = 0, height = 0, thickness = 0) {
    this.length = length; // Overall building length
    this.width = width;   // Overall building width
    this.height = height; // Building height
    this.thickness = thickness; // Wall thickness
    this.walls = []; // Array to store all walls
  }

  // Add a wall to the building
  addWall(startX, startZ, endX, endZ, width, height) {
    const wall = {
      id: `wall-${Date.now()}-${Math.random().toString(16).slice(2)}`, // Unique ID
      startX,
      startZ,
      endX,
      endZ,
      width,
      height
    };
  
    console.log('Adding wall to BuildingModel:', wall);
    this.walls.push(wall);
    console.log('Current walls after addition:', this.walls);
    return wall; // Return the created wall
  } 

  // Remove a wall by its unique identifier
  removeWall(wallId) {
    const wallIndex = this.walls.findIndex((wall) => wall.id === wallId);
    if (wallIndex !== -1) {
        const removedWall = this.walls.splice(wallIndex, 1)[0];
        console.log(`Removed wall:`, removedWall);
        return removedWall;
    } else {
        console.warn(`Wall with ID ${wallId} not found.`);
        return null;
    }
  }

  // Get all walls in the building
  getWalls() {
    console.log('Retrieving all walls:', this.walls); // Debug current walls
    return this.walls || [];
  }

  // Get a wall by its unique identifier
  getWallById(wallId) {
    const wall = this.walls.find((wall) => wall.id === wallId);
    if (!wall) {
      console.error(`Wall with ID ${wallId} not found. Current walls:`, this.walls);
    }
    return wall;
  }

  // Get the floor boundary (used for floor generation in 2D and 3D)
  getFloorBoundary() {
    return { x: 0, y: 0, width: this.length, height: this.width };
  }

  // Get the ceiling boundary (used for ceiling generation)
  getCeilingBoundary() {
    return { x: 0, y: 0, width: this.length, height: this.width };
  }

  // Reset the building model
  reset() {
    this.length = 0;
    this.width = 0;
    this.height = 0;
    this.thickness = 0;
    this.walls = [];
    console.log('BuildingModel reset.');
  }

  // Add a door to a specific wall
  addDoor(wallId, doorWidth, doorHeight, doorPosition) {
    const wall = this.walls.find(w => w.id === wallId);

    if (!wall) {
      console.error('Wall not found for door placement.');
      return;
    }

    if (!wall.doors) {
      wall.doors = [];
    }

    wall.doors.push({
      width: doorWidth,
      height: doorHeight,
      position: doorPosition, // Relative position on the wall
    });

    console.log('Door added to wall:', wallId, wall.doors);
  }

  // Add a window to a specific wall
  addWindow(wallId, windowWidth, windowHeight, windowPosition) {
    const wall = this.walls.find(w => w.id === wallId);

    if (!wall) {
      console.error('Wall not found for window placement.');
      return;
    }

    if (!wall.windows) {
      wall.windows = [];
    }

    wall.windows.push({
      width: windowWidth,
      height: windowHeight,
      position: windowPosition, // Relative position on the wall
    });

    console.log('Window added to wall:', wallId, wall.windows);
  }

  // Split a wall on intersection with another wall
  splitWallOnIntersection(newWall) {
    this.walls.forEach((existingWall) => {
      if (this.checkIntersection(existingWall, newWall)) {
        console.log('Intersection detected between walls:', existingWall, newWall);

        // Calculate intersection point
        const intersectionPoint = this.getIntersectionPoint(existingWall, newWall);

        // Split the existing wall at the intersection
        const { startX, startZ, endX, endZ } = existingWall;

        // Create two new wall segments
        const wallSegment1 = {
          id: `wall-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          startX: startX,
          startZ: startZ,
          endX: intersectionPoint.x,
          endZ: intersectionPoint.z,
          width: existingWall.width,
          height: existingWall.height,
        };

        const wallSegment2 = {
          id: `wall-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          startX: intersectionPoint.x,
          startZ: intersectionPoint.z,
          endX: endX,
          endZ: endZ,
          width: existingWall.width,
          height: existingWall.height,
        };

        // Replace existing wall with the new segments
        this.walls.splice(this.walls.indexOf(existingWall), 1, wallSegment1, wallSegment2);
        console.log('Wall split into segments:', wallSegment1, wallSegment2);
      }
    });
  }

  // Check if two walls intersect
  checkIntersection(wall1, wall2) {
    const { startX: x1, startZ: y1, endX: x2, endZ: y2 } = wall1;
    const { startX: x3, startZ: y3, endX: x4, endZ: y4 } = wall2;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    return denominator !== 0; // True if lines are not parallel
  }

  // Calculate intersection point between two walls
  getIntersectionPoint(wall1, wall2) {
    const { startX: x1, startZ: y1, endX: x2, endZ: y2 } = wall1;
    const { startX: x3, startZ: y3, endX: x4, endZ: y4 } = wall2;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (denominator === 0) {
      console.error('Walls are parallel, no intersection point.');
      return null;
    }

    const px =
      ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denominator;
    const py =
      ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denominator;

    return { x: px, z: py };
  }

  logAllWalls() {
    if (this.walls.length === 0) {
      console.log("No walls have been added to the building model.");
      return;
    }
  
    console.log("All walls in the BuildingModel:");
    this.walls.forEach((wall, index) => {
      console.log(`Wall ${index + 1}:`, wall);
    });
  }
}
