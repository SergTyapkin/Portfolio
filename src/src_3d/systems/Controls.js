import {MathUtils, Vector2, Vector3} from "three";
import {BOX_HEIGHT, BOX_WIDTH, CAMERA_Z, CONTROLS_SAFE_ZONE_FACTOR} from "../constants.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";


const Y_MOVEMENT_AMPLITUDE = 20;
const SCROLL_SENSITIVE = 0.1;
const DAMPING_FACTOR = 0.1;

class MyControls {

  camera = undefined;
  canvas = undefined;
  target = new Vector3();

  visibleScreenHeight = undefined;
  visibleScreenWidth = undefined;

  maxX = BOX_WIDTH / 2;
  minX = -BOX_WIDTH / 2;
  maxY = BOX_HEIGHT / 2;
  minY = -BOX_HEIGHT / 2;
  centerX = (this.maxX + this.minX) / 2;
  centerY = (this.maxY + this.minY) / 2;

  scrollPos = new Vector2(this.centerX, 0);
  movementPos = new Vector2(this.centerX, this.centerY);
  targetCameraPos = new Vector3(this.centerX, this.centerY, CAMERA_Z);

  _dampingFactorDecreasingFactor = 1;


  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
  }

  init() {
    this.camera.lookAt(this.target);

    window.addEventListener('mousemove', this._onMouseMove());
    window.addEventListener('wheel', this._onScroll());
    window.addEventListener('mouseout', this._onMouseOver());
    window.removeEventListener('deviceorientation', this._onDeviceOrientation());

    this.camera.position.set(...this.targetCameraPos);

    const cameraVerticalFov = MathUtils.degToRad(this.camera.fov);
    this.visibleScreenHeight = 2 * Math.tan(cameraVerticalFov / 2) * Math.abs(CAMERA_Z);
    this.visibleScreenWidth = this.visibleScreenHeight * this.camera.aspect;
  }

  dispose() {
    window.removeEventListener('mousemove', this._onMouseMove());
    window.removeEventListener('wheel', this._onScroll());
    window.removeEventListener('deviceorientation', this._onDeviceOrientation());
  }

  _onScroll() {
    return (event) => {
      const newTargetCameraY = this.scrollPos.y + event.deltaY * SCROLL_SENSITIVE;
      const minY = this.minY + this.visibleScreenHeight / 2 + Y_MOVEMENT_AMPLITUDE / 2;
      const maxY = this.maxY - this.visibleScreenHeight / 2 - Y_MOVEMENT_AMPLITUDE / 2;
      if (newTargetCameraY > minY && newTargetCameraY < maxY) {
        this.scrollPos.y = newTargetCameraY;
      }
      this._updateTargetCameraPos();
    }
  }

  _setMovementPos(percentX, percentY) {
    this.movementPos.x =
      this.minX + this.visibleScreenWidth / 2 +
      (this.maxX - this.minX - this.visibleScreenWidth) * percentX;
    this.movementPos.y =
      this.centerY - Y_MOVEMENT_AMPLITUDE / 2 +
      Y_MOVEMENT_AMPLITUDE * percentY;
    // this.movementPos.y =
    //   this.minY + this.visibleScreenHeight / 2 +
    //   (this.maxY - this.minY - this.visibleScreenHeight) * percentY;

    this._dampingFactorDecreasingFactor = 1;

    this._updateTargetCameraPos();
  }

  _updateTargetCameraPos() {
    this.targetCameraPos.x = this.movementPos.x;
    this.targetCameraPos.y = this.movementPos.y + this.scrollPos.y;
  }

  _onMouseMove() {
    return (event) => {
      let totalWidth = visualViewport.width;
      let totalHeight = visualViewport.height;
      let safeZoneX = totalWidth * CONTROLS_SAFE_ZONE_FACTOR;
      let safeZoneY = totalHeight * CONTROLS_SAFE_ZONE_FACTOR;
      totalWidth -= safeZoneX * 2;
      totalHeight -= safeZoneY * 2;
      const curPosX = totalWidth - Math.max(event.offsetX - safeZoneX, 0);
      const curPosY = totalHeight - Math.max(event.offsetY - safeZoneY, 0);
      const percentX = Math.max(curPosX / totalWidth, 0);
      const percentY = Math.max(curPosY / totalHeight, 0);

      this._setMovementPos(percentX, percentY);
    }
  }

  _onMouseOver() {
    return (event) => {
      this.targetCameraPos.set(this.centerX, this.centerY, CAMERA_Z);
      this._dampingFactorDecreasingFactor = 0.2;
    }
  }

  _onDeviceOrientation() {
    return (event) => {
      let {absolute: alphaAbs, alpha: alphaX, beta: alphaY, gamma: alphaZ} = event;
      alphaX = 90 + Math.min(Math.max(alphaX, -90), 90); // constrain the x rotation value to the range [0,180]
      alphaY = 90 + Math.min(Math.max(alphaY, -90), 90); // constrain the y rotation value to the range [0,180]

      this._setMovementPos(alphaX / 180, alphaY / 180);
    }
  }


  tick() {
    const currentPos = new Vector3(...this.camera.position);
    const targetPos = new Vector3(...this.targetCameraPos);
    const diffToTarget = targetPos.sub(currentPos);
    const displacement = diffToTarget.multiplyScalar(DAMPING_FACTOR * this._dampingFactorDecreasingFactor);
    const resultPos = currentPos.add(displacement);
    this.camera.position.set(...resultPos);
  }
}

function createControls(camera, canvas) {
  const controls = new MyControls(camera, canvas);
  controls.init();
  // const controls = new OrbitControls(camera, canvas);
  // controls.tick = () => {
  //   controls.update();
  // }
  // controls.enableDamping = true;
  return controls;
}

export {createControls};
