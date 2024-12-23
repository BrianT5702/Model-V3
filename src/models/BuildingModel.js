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

    this.walls.push(wall);
    console.log('Wall added to BuildingModel:', wall);
    return wall; // Return the created wall
  }

  // Remove a wall by its unique identifier
  removeWall(wallId) {
    this.walls = this.walls.filter(wall => wall.id !== wallId);
    console.log(`Wall with ID ${wallId} removed.`);
  }

  // Get all walls in the building
  getWalls() {
    return this.walls || [];
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
      position: doorPosition // Relative position on the wall
    });

    console.log('Door added to wall:', wallId, wall.doors);
  }

  // Retrieve a specific wall by ID
  getWallById(wallId) {
    return this.walls.find(wall => wall.id === wallId) || null;
  }

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
          startX: startX,
          startZ: startZ,
          endX: intersectionPoint.x,
          endZ: intersectionPoint.z,
        };
  
        const wallSegment2 = {
          startX: intersectionPoint.x,
          startZ: intersectionPoint.z,
          endX: endX,
          endZ: endZ,
        };
  
        // Replace existing wall with the new segments
        this.walls.splice(this.walls.indexOf(existingWall), 1, wallSegment1, wallSegment2);
      }
    });
  }
  
  getIntersectionPoint(wall1, wall2) {
    const { startX: x1, startZ: y1, endX: x2, endZ: y2 } = wall1;
    const { startX: x3, startZ: y3, endX: x4, endZ: y4 } = wall2;
  
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
    const px =
      ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denominator;
    const py =
      ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denominator;
  
    return { x: px, z: py };
  }
}
