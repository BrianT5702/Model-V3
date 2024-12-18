import * as THREE from 'three';
import SceneView from '../views/SceneView.js';
import { SCALING_FACTOR } from '../utils/Utils.js';

export default class SceneController {
  constructor() {
    this.sceneView = new SceneView();
  }

  // Create a 3D representation of the building
  createBuilding(length, width, height, thickness) {
    // Reset the scene and the building model
    this.sceneView.scene.clear();

    // Add grid and lighting
    this.addGrid();
    this.addLighting();

    // Add the floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(length, width),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
    );
    floor.rotation.x = -Math.PI / 2;
    this.sceneView.scene.add(floor);

    // Add walls
    this.createDefaultWalls(length, width, height, thickness);

    // Add the ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(length, width),
      new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    ceiling.name = 'ceiling'; // Name it for toggling
    this.sceneView.scene.add(ceiling);
  }

  // Add grid helper for visualization
  addGrid() {
    const gridHelper = new THREE.GridHelper(50, 50);
    this.sceneView.scene.add(gridHelper);
  }

  // Add lighting to the scene
  addLighting() {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    this.sceneView.scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.sceneView.scene.add(ambientLight);
  }

  // Create default walls around the perimeter of the building
  createDefaultWalls(length, width, height, thickness) {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });

    // Front Wall
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(length, height, thickness),
      wallMaterial
    );
    frontWall.position.set(0, height / 2, width / 2 - thickness / 2);
    this.sceneView.scene.add(frontWall);

    // Back Wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(length, height, thickness),
      wallMaterial
    );
    backWall.position.set(0, height / 2, -width / 2 + thickness / 2);
    this.sceneView.scene.add(backWall);

    // Left Wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(thickness, height, width),
      wallMaterial
    );
    leftWall.position.set(-length / 2 + thickness / 2, height / 2, 0);
    this.sceneView.scene.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(thickness, height, width),
      wallMaterial
    );
    rightWall.position.set(length / 2 - thickness / 2, height / 2, 0);
    this.sceneView.scene.add(rightWall);
  }

  // Update the scene with walls from the 2D plan
  updateScene(walls) {
    // Remove previous wall objects
    this.sceneView.scene.children = this.sceneView.scene.children.filter(
      (child) => child.userData.type !== 'wall'
    );

    // Add new walls
    walls.forEach((wall) => this.addWallToScene(wall));
  }

  // Add an individual wall to the 3D scene
  addWallToScene(wall) {
    const { startX, startZ, endX, endZ, width, height } = wall;

    // Calculate wall length and rotation
    const wallLength = Math.sqrt((endX - startX) ** 2 + (endZ - startZ) ** 2);
    const centerX = (startX + endX) / 2;
    const centerZ = (startZ + endZ) / 2;
    const angle = Math.atan2(endZ - startZ, endX - startX);

    // Create the wall geometry and material
    const wallGeometry = new THREE.BoxGeometry(wallLength, height, width);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

    // Set position and rotation
    wallMesh.position.set(centerX, height / 2, centerZ);
    wallMesh.rotation.y = -angle;
    wallMesh.userData.type = 'wall'; // Mark it as a wall for future updates

    this.sceneView.scene.add(wallMesh);
    console.log(`Wall added at (${centerX}, ${height / 2}, ${centerZ})`);
  }

  // Toggle between interior and exterior views
  toggleInteriorView() {
    const ceiling = this.sceneView.scene.getObjectByName('ceiling');
    if (!ceiling) return;

    ceiling.visible = false; // Hide the ceiling
    this.sceneView.animateCamera(
      { x: 15, y: 25, z: 15 }, // Position above the building
      { x: 0, y: 2.5, z: 0 }   // Focus on the center
    );
  }

  toggleExteriorView() {
    const ceiling = this.sceneView.scene.getObjectByName('ceiling');
    if (!ceiling) return;

    ceiling.visible = true; // Show the ceiling
    this.sceneView.animateCamera(
      { x: 20, y: 20, z: 20 }, // Exterior camera position
      { x: 0, y: this.sceneView.buildingHeight / 2, z: 0 }
    );
  }
}
