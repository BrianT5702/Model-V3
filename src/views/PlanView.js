export default class PlanView {
  constructor() {
    this.svgElement = document.getElementById('wall-plan');

    if (!this.svgElement) {
      throw new Error('SVG element for wall plan not found.');
    }
  }

  drawBuildingOutline(length, width) {
    this.clearSVG();

    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    outline.setAttribute('x', 50);
    outline.setAttribute('y', 50);
    outline.setAttribute('width', length * 10); // Scale for visualization
    outline.setAttribute('height', width * 10);
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke', 'black');
    outline.setAttribute('stroke-width', 2);

    this.svgElement.appendChild(outline);
  }

  drawWall(wall) {
    if (!wall || isNaN(wall.startX) || isNaN(wall.startY) || isNaN(wall.endX) || isNaN(wall.endY)) {
      console.error('Invalid wall data:', wall);
      return;
    }
    const wallElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    wallElement.setAttribute('x1', wall.startX * 10 + 50); // Scale for visualization
    wallElement.setAttribute('y1', wall.startY * 10 + 50);
    wallElement.setAttribute('x2', wall.endX * 10 + 50);
    wallElement.setAttribute('y2', wall.endY * 10 + 50);
    wallElement.setAttribute('stroke', 'gray');
    wallElement.setAttribute('stroke-width', 2);

    this.svgElement.appendChild(wallElement);
  }

  clearSVG() {
    while (this.svgElement.firstChild) {
      this.svgElement.removeChild(this.svgElement.firstChild);
    }
  }
}
