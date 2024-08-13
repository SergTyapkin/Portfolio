import { loadModels } from './components/models/models.js';
import { createCamera } from './components/camera.js';
import { createLights } from './components/lights.js';
import { createScene } from './components/scene.js';
import { createObjects } from './components/objects/objects.js';

import { createControls } from './systems/Controls.js';
import { createRenderer } from './systems/Renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import {BoxGeometry, BoxHelper, Mesh, SpotLightHelper} from "three";
import {updateSize} from "./components/models/setupModel.js";
import {createSkybox} from "./components/skybox.js";


let camera;
let controls;
let renderer;
let scene;
let loop;
let lights;
let models;
let skybox;
let objects;
let resizer;

class World {
  constructor(container) {
    camera = createCamera();
    renderer = createRenderer();
    scene = createScene();
    controls = createControls(camera, renderer.domElement);
    loop = new Loop(camera, scene, renderer);
    lights = createLights();

    container.append(renderer.domElement);
    loop.updatables.push(controls);
    scene.add(...lights);
    // scene.add(new SpotLightHelper(lights[0]));

    resizer = new Resizer(container, camera, renderer);
  }

  async init() {
    // models = await loadModels();
    // //scene.add(new BoxHelper(models[0]));
    // const minY = models.reduce((min, cur) => {
    //   updateSize(cur);
    //   return Math.min(min, -cur.size.y / 2);
    // }, -models[0].size.y / 2);
    objects = await createObjects();
    // skybox = await createSkybox();

    // scene.add(...models);
    scene.add(...objects);
    // scene.add(skybox);
  }

  render() {
    renderer.render(scene, camera);
  }

  start() {
    loop.start();
  }

  stop() {
    loop.stop();
  }
}

export { World };
