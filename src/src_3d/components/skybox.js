import {
  BackSide,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  TextureLoader
} from "three";

export async function createSkybox() {
  const loader = new TextureLoader();
  const path = "./assets/skyboxes/cliffs/";
  const extension = ".png";
  const imageNames = ["ft", "bk", "up", "dn", "rt", "lf"];

  const textures = await Promise.all(
      imageNames.map((name) => loader.loadAsync(path + name + extension))
  );

  const materialArray = textures.map((texture) => {
    const material = new MeshBasicMaterial( { map: texture });
    material.side = BackSide;
    return material;
  });

  const skyboxGeo = new BoxGeometry( 10000, 10000, 10000);

  return new Mesh(skyboxGeo, materialArray);
}
