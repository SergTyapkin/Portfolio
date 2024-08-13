import { PerspectiveCamera } from "three";
import {CAMERA_Z} from "~/src_3d/constants";

function createCamera() {
  const camera = new PerspectiveCamera(60, 1, 0.01, 20000);

  camera.position.set(0, 0, CAMERA_Z);

  return camera;
}

export { createCamera };
