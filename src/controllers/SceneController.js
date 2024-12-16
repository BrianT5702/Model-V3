import * as THREE from 'three';
import SceneView from '../views/SceneView.js';
import BuildingModel from '../models/BuildingModel.js';
import { gsap } from 'gsap';

export default class SceneController {
  constructor() {
    this.sceneView = new SceneView();
    this.buildingModel = new BuildingModel();
    this.isTogglingView = false; // Prevent simultaneous toggles
  }

  createBuilding(length, width, height, thickness) {
    this.buildingModel = new BuildingModel(length, width, height, thickness);
    this.create3DModel();
  }

  create3DModel() {
    const { length, width, height, thickness } = this.buildingModel;

    // Clear the scene
    this.sceneView.scene.clear();

    // Add grid and lighting
    const gridHelper = new THREE.GridHelper(50, 50);
    this.sceneView.scene.add(gridHelper);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    this.sceneView.scene.add(light);
    this.sceneView.scene.add(new THREE.AmbientLight(0x404040, 0.5));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(length, width),
      new THREE.MeshStandardMaterial({ color: 0xfffff })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0); // Place the floor at ground level
    this.sceneView.scene.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xfffff });

    // Front Wall
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(length, height, thickness),
      wallMaterial
    );
    frontWall.position.set(0, height / 2, width / 2 - thickness / 2); // Correct alignment
    this.sceneView.scene.add(frontWall);

    // Back Wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(length, height, thickness),
      wallMaterial
    );
    backWall.position.set(0, height / 2, -width / 2 + thickness / 2); // Correct alignment
    this.sceneView.scene.add(backWall);

    // Left Wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(thickness, height, width),
      wallMaterial
    );
    leftWall.position.set(-length / 2 + thickness / 2, height / 2, 0); // Correct alignment
    this.sceneView.scene.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(thickness, height, width),
      wallMaterial
    );
    rightWall.position.set(length / 2 - thickness / 2, height / 2, 0); // Correct alignment
    this.sceneView.scene.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(length, width),
      new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, height, 0);
    ceiling.name = 'ceiling'; // Assign a name for targeting the ceiling
    this.sceneView.scene.add(ceiling);
  }

  toggleInteriorView() {
    // Find the ceiling object by name
    const ceiling = this.sceneView.scene.getObjectByName('ceiling');
  
    if (!ceiling) {
      console.error('Ceiling not found in the scene');
      return;
    }
  
    // Animate the ceiling moving upwards
    gsap.to(ceiling.position, {
      y: ceiling.position.y + 15, // Lift ceiling by 10 units
      duration: 2, // Duration of animation
      ease: 'power2.out',
      onComplete: () => {
        console.log('Ceiling lifted');
        // Hide the ceiling after lifting
        ceiling.visible = false;
      },
    });
  
    // Adjust the camera position for an angled interior view
    this.sceneView.animateCamera(
      { x: 15, y: 25, z: 15 }, // Angled position above the interior
      { x: 0, y: 2.5, z: 0 }   // Focus on the center of the building
    );
  }

  toggleExteriorView() {
    // Find the ceiling object by name
    const ceiling = this.sceneView.scene.getObjectByName('ceiling');
  
    if (ceiling) {
      // Show the ceiling
      ceiling.visible = true;
  
      // Reset its position if necessary
      gsap.to(ceiling.position, {
        y: this.buildingModel.height, // Reset to original height
        duration: 2,
        ease: 'power2.out',
        onComplete: () => {
          console.log('Ceiling repositioned for exterior view');
        },
      });
    }
  
    // Adjust the camera position for an exterior view
    this.sceneView.animateCamera(
      { x: 20, y: 20, z: 20 }, // Exterior camera position
      { x: 0, y: this.buildingModel.height / 2, z: 0 } // Focus on the center of the building
    );
  }
  
  setupInteriorView() {
    if (this.isTogglingView) return;
    this.isTogglingView = true;
  
    gsap.to(this.sceneView.camera.position, {
      y: 5, duration: 2,
      onComplete: () => { this.isTogglingView = false; }
    });
  }

  setupExteriorView() {
    if (this.isTogglingView) return;
    this.isTogglingView = true;
  
    gsap.to(this.sceneView.camera.position, {
      y: 20, duration: 2,
      onComplete: () => { this.isTogglingView = false; }
    });
  }

  render() {
    this.sceneView.render();
  }

  updateScene(walls) {
    console.log('Updating 3D Scene...');

    // Remove old walls from the scene
    this.sceneView.scene.children = this.sceneView.scene.children.filter(
        (child) => child.userData.type !== 'wall'
    );

    // Add each wall to the 3D scene
    walls.forEach((wall) => this.addWallToScene(wall));

    console.log('3D Scene updated successfully with all walls.');
  }

  addWallToScene(wall) {
    const { startX, startY, endX, endY, width, height } = wall;
  
    // Calculate wall length and center position
    const wallLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    const wallCenterX = (startX + endX) / 2;
    const wallCenterZ = (startY + endY) / 2;
    const angle = Math.atan2(endY - startY, endX - startX);
  
    console.log('Wall Data for 3D Scene:', wall);
  
    // Create wall geometry
    const wallGeometry = new THREE.BoxGeometry(wallLength, height, width);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White color
  
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.set(wallCenterX, height / 2, wallCenterZ); // Position the wall
    wallMesh.rotation.y = -angle; // Rotate the wall to align properly
  
    wallMesh.userData.type = 'wall'; // Mark as wall for easy removal
    this.sceneView.scene.add(wallMesh);
  }
}