export default class WallModel {
  constructor(startX, startZ, endX, endZ, width, height, startY = 0, endY = 0) {
      this.startX = startX;
      this.startY = startY;
      this.startZ = startZ;
      this.endX = endX;
      this.endY = endY;
      this.endZ = endZ;
      this.width = width;
      this.height = height;
  }
}