import {DirectionalLight, HemisphereLight, AmbientLight, SpotLight} from "three";

function createLights() {
  const ambientLight = new HemisphereLight(
    0xFFEEBB,
    0x134050,
    3,
  );

  const light = new DirectionalLight(0xFFFFEE, 4);
  light.position.set(100, 100, -100);
  light.castShadow = true;


  const L1 = new DirectionalLight(0xFF3040, 4);
  L1.position.set(2, 1, -1);
  L1.castShadow = true;

  const L2 = new DirectionalLight(0x3030FF, 3);
  L2.position.set(-1, 1, 1);
  L2.castShadow = true;

  const L3 = new SpotLight(0xffa95c,10);
  L3.position.set(-100,100,-100);
  L3.castShadow = true;

  return [ambientLight, light, L1, L2];
}

export { createLights };
