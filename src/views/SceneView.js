import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';

export default class SceneView {
  constructor() {
    this.scene = new THREE.Scene();
    // Add Axes Helper for debugging
    const axesHelper = new THREE.AxesHelper(10); // Size of the axes
    this.scene.add(axesHelper);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 0, 0);
    this.walls = [];

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Add a grid for visualization
    const gridHelper = new THREE.GridHelper(50, 50);
    this.scene.add(gridHelper);

    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    this.scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  attachToContainer(containerId) {
    const container = document.getElementById(containerId);
  
    if (!container) {
      console.error(`Container with ID '${containerId}' not found.`);
      return;
    }
  
    // Prevent redundant attachment
    if (this.currentParent === container) {
      console.log(`Renderer already attached to: ${containerId}`);
      return;
    }
  
    if (this.currentParent) {
      this.currentParent.removeChild(this.renderer.domElement); // Remove from previous parent
      console.log(`Renderer detached from: ${this.currentParent.id}`);
    }
  
    container.appendChild(this.renderer.domElement); // Attach to new parent
    this.currentParent = container;
  
    console.log(`Renderer attached to: ${containerId}`);
    this.resizeRenderer(); // Adjust size
  }

onWindowResize() {
  if (this.currentParent) {
    this.renderer.setSize(this.currentParent.clientWidth, this.currentParent.clientHeight);
    this.camera.aspect = this.currentParent.clientWidth / this.currentParent.clientHeight;
    this.camera.updateProjectionMatrix();
  }
}

  animateCamera(targetPosition, lookAtPosition) {
    gsap.to(this.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 2,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.lookAt(lookAtPosition.x, lookAtPosition.y, lookAtPosition.z);
      },
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }

  resizeRenderer() {
    if (!this.currentParent) return;

    // Update renderer size based on the current container dimensions
    this.renderer.setSize(this.currentParent.clientWidth, this.currentParent.clientHeight);
    this.camera.aspect = this.currentParent.clientWidth / this.currentParent.clientHeight;
    this.camera.updateProjectionMatrix();
  }
}