import {Vector2, WebGLRenderer} from "three";
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {FilmPass} from "three/examples/jsm/postprocessing/FilmPass";
import {FXAAShader} from "three/examples/jsm/shaders/FXAAShader";
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
// import {TAARenderPass} from "three/examples/jsm/postprocessing/TAARenderPass";
// import {SSAARenderPass} from "three/examples/jsm/postprocessing/SSAARenderPass";


function isWebGL2Available() {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) {
    if (typeof WebGL2RenderingContext !== 'undefined') {
      console.log('your browser appears to support WebGL2 but it might be disabled. Try updating your OS and/or video card drivers');
    } else {
      console.log('your browser has no WebGL2 support at all');
    }
    return false;
  }
  console.log('webgl2 works!');
  return true;
}

export function createComposer(scene, camera) {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x555555);
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;

  const renderPass = new RenderPass(scene, camera);
  // const renderPass = new TAARenderPass(scene, camera);
  // const renderPass = new SSAARenderPass(scene, camera);
  const FXAAPass = new ShaderPass(FXAAShader);
  const bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    0.5,
    0.33,
    0.9,
  );
  const filmPass = new FilmPass(
    0.1,
    0,
    0,
    false
  );

  let target;
  // if (isWebGL2Available()) {
  //   target = new WebGLMultisampleRenderTarget(window.innerWidth, window.innerHeight, {
  //     format: RGBAFormat,
  //     encoding: sRGBEncoding,
  //   });
  //   target.samples = 8;
  // }
  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(FXAAPass);
  composer.addPass(bloomPass);
  // composer.addPass(filmPass);

  return {composer, renderer};
}
