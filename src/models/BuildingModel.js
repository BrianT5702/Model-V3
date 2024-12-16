import WallModel from './WallModel.js';

export default class BuildingModel {
  constructor(length = 0, width = 0, height = 0, thickness = 0) {
    this.length = length;
    this.width = width;
    this.height = height;
    this.thickness = thickness;
    this.walls = []; // Store wall data
  }

  // Add a wall to the building
  addWall(startX, startZ, endX, endZ, width, height) {
    console.log('Wall added to BuildingModel:', { startX, startZ, endX, endZ, width, height });
    const wall = new WallModel(startX, startZ, endX, endZ, width, height);
    this.walls.push(wall);
  }

  // Get all walls
  getWalls() {
    return this.walls; // Return actual stored wall data
  }

  // Get the floor boundary (used for floor generation)
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
}
