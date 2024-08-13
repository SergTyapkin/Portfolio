import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {setupModel, updateSize} from './setupModel.js';

async function loadModels() {
  const loader = new GLTFLoader();

  const models = await Promise.all([
    loader.loadAsync('./assets/models/Model.glb'),
  ]);
  const positions = [[0, 0, 0]];
  const rotations = [Math.PI];

  return models.map((data, idx) => {
    const model = setupModel(data);
    updateSize(model);
    model.position.sub(model.center);
    return model;
  });
}

export { loadModels };
