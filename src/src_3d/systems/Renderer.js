import {Vector2, WebGLRenderer} from "three";
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";


export function createComposer(scene, camera) {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x1f1e1c, 1)

  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.physicallyCorrectLights = true;
  // renderer.shadowMap.enabled = true;

  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    0.5,
    0.33,
    0.85,
  );
  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  return {composer, renderer};
}
