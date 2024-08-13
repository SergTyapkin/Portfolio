import { WebGLRenderer } from "three";

export function createRenderer() {
  const renderer = new WebGLRenderer({ antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.physicallyCorrectLights = true;
  //renderer.shadowMap.enabled = true;

  return renderer;
}
