import {MathUtils, Vector3} from "three";
import {BOX_HEIGHT, BOX_WIDTH, CAMERA_Z} from "../constants.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";


// const Y_AMPLITUDE = 100;

class MyControls {
  DAMPING_FACTOR = 0.1;

  camera = undefined
  canvas = undefined
  target = new Vector3();

  maxX = BOX_WIDTH / 2;
  minX = -BOX_WIDTH / 2;
  maxY = BOX_HEIGHT / 2;
  minY = -BOX_HEIGHT / 2;
  centerX = (this.maxX + this.minX) / 2;
  centerY = (this.maxY + this.minY) / 2;

  targetCameraPos = new Vector3(this.centerX, this.centerY, CAMERA_Z);

  _dampingFactorDecreasingFactor = 1;


  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
  }

  init() {
    this.camera.lookAt(this.target);

    window.addEventListener('mousemove', this._onMouseMove());
    window.addEventListener('mouseout', this._onMouseOver());
    window.removeEventListener('deviceorientation', this._onDeviceOrientation());

    this.camera.position.set(...this.targetCameraPos);
  }

  dispose() {
    window.removeEventListener('mousemove', this._onMouseMove());
    window.removeEventListener('deviceorientation', this._onDeviceOrientation());
  }

  _setTargetCameraPos(percentX, percentY) {
    const cameraVerticalFov = MathUtils.degToRad(this.camera.fov);
    const visibleScreenHeight = 2 * Math.tan(cameraVerticalFov / 2) * Math.abs(CAMERA_Z);
    const visibleScreenWidth = visibleScreenHeight * this.camera.aspect;

    this.targetCameraPos.x =
      this.minX + visibleScreenWidth / 2 +
      (this.maxX - this.minX - visibleScreenWidth) * percentX;
    // this.targetCameraPos.y =
    //   this.centerY - Y_AMPLITUDE / 2 +
    //   Y_AMPLITUDE * (curPosY / totalHeight);
    this.targetCameraPos.y =
      this.minY + visibleScreenHeight / 2 +
      (this.maxY - this.minY - visibleScreenHeight) * percentY;

    this._dampingFactorDecreasingFactor = 1;
  }

  _onMouseMove() {
    return (event) => {
      const totalWidth = visualViewport.width;
      const totalHeight = visualViewport.height;
      const curPosX = totalWidth - event.offsetX;
      const curPosY = totalHeight - event.offsetY;

      this._setTargetCameraPos(curPosX / totalWidth, curPosY / totalHeight);
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

      this._setTargetCameraPos(alphaX / 180, alphaY / 180);
    }
  }


  tick() {
    const currentPos = new Vector3(...this.camera.position);
    const targetPos = new Vector3(...this.targetCameraPos);
    const diffToTarget = targetPos.sub(currentPos);
    const displacement = diffToTarget.multiplyScalar(this.DAMPING_FACTOR * this._dampingFactorDecreasingFactor);
    const resultPos = currentPos.add(displacement);
    this.camera.position.set(...resultPos);
  }
}

function createControls(camera, canvas) {
  // const controls = new MyControls(camera, canvas);
  // controls.init();
  const controls = new OrbitControls(camera, canvas);
  controls.tick = () => {
    controls.update();
  }
  controls.enableDamping = true;
  return controls;
}

export {createControls};
