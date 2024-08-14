import {MathUtils, Vector2, Vector3} from "three";
import {
  BOX_HEIGHT,
  BOX_WIDTH,
  CAMERA_Z,
  CONTROLS_SAFE_ZONE_ANGLE_HORIZONTAL,
  CONTROLS_SAFE_ZONE_ANGLE_VERTICAL,
  CONTROLS_SAFE_ZONE_FACTOR,
  CONTROLS_VERTICAL_ANGLE_CENTER
} from "../constants.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {isMobile} from "~/utils/utils";


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

  cameraVerticalFov = undefined;

  _dampingFactorDecreasingFactor = 1;

  isMobile = isMobile();


  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
  }

  init() {
    this.camera.lookAt(this.target);

    window.addEventListener('mousemove', this._onMouseMove());
    window.addEventListener('wheel', this._onScroll(), {passive: false});
    window.addEventListener('mouseout', this._onMouseOver());
    window.addEventListener('deviceorientation', this._onDeviceOrientation());

    this.camera.position.set(...this.targetCameraPos);

    this.cameraVerticalFov = MathUtils.degToRad(this.camera.fov);
  }

  dispose() {
    window.removeEventListener('mousemove', this._onMouseMove());
    window.removeEventListener('wheel', this._onScroll());
    window.removeEventListener('deviceorientation', this._onDeviceOrientation());
  }

  _onScroll() {
    return (event) => {
      if (this.isMobile) {
        return;
      }
      event.preventDefault();

      const newTargetCameraY = this.scrollPos.y + -event.deltaY * SCROLL_SENSITIVE;
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

    if (!this.isMobile) {
      // With scrolling control
      this.movementPos.y =
        this.centerY - Y_MOVEMENT_AMPLITUDE / 2 +
        Y_MOVEMENT_AMPLITUDE * percentY;
    } else {
      // Without scrolling control
      this.movementPos.y =
        this.minY + this.visibleScreenHeight / 2 +
        (this.maxY - this.minY - this.visibleScreenHeight) * percentY;
    }

    this._dampingFactorDecreasingFactor = 1;

    this._updateTargetCameraPos();
  }

  _updateTargetCameraPos() {
    this.visibleScreenHeight = 2 * Math.tan(this.cameraVerticalFov / 2) * Math.abs(CAMERA_Z);
    this.visibleScreenWidth = this.visibleScreenHeight * this.camera.aspect;

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
      let {absolute: alphaAbs, gamma: alphaX, beta: alphaY} = event;
      const rangeY = 180 - CONTROLS_SAFE_ZONE_ANGLE_VERTICAL * 2;
      const rangeX = 180 - CONTROLS_SAFE_ZONE_ANGLE_HORIZONTAL * 2;
      alphaY -= CONTROLS_VERTICAL_ANGLE_CENTER;
      alphaX = rangeY / 2 - Math.min(Math.max(alphaX, -90 + CONTROLS_SAFE_ZONE_ANGLE_HORIZONTAL), 90 - CONTROLS_SAFE_ZONE_ANGLE_HORIZONTAL); // constrain the x rotation value to the range [0,range]
      alphaY = rangeX / 2 - Math.min(Math.max(alphaY, -90 + CONTROLS_SAFE_ZONE_ANGLE_VERTICAL), 90 - CONTROLS_SAFE_ZONE_ANGLE_VERTICAL); // constrain the y rotation value to the range [0,range]

      this._setMovementPos(alphaX / rangeX, alphaY / rangeY);
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
