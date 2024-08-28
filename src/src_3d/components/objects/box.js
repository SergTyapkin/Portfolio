import {
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  TextureLoader,
  PlaneGeometry,
} from "three";
import {BOX_DEPTH, BOX_HEIGHT, BOX_WIDTH} from "~/src_3d/constants";


export async function createBox() {
  // Create materials
  const mat1 = new MeshPhongMaterial({
    color: 0x333,
    shininess: 10,
  });

  // Create meshes
  const planeSideHorizontalGeo = new PlaneGeometry(BOX_WIDTH, BOX_DEPTH)
  const planeSideVerticalGeo = new PlaneGeometry(BOX_DEPTH, BOX_HEIGHT)
  const planeBackGeo = new PlaneGeometry(BOX_WIDTH, BOX_HEIGHT)

  // Create objects
  const planeTop = new Mesh(planeSideHorizontalGeo, mat1);
  planeTop.rotation.x = Math.PI / 2;
  planeTop.position.y = BOX_HEIGHT / 2;
  planeTop.position.z = BOX_DEPTH / 2;

  const planeRight = new Mesh(planeSideVerticalGeo, mat1);
  planeRight.rotation.y = -Math.PI / 2;
  planeRight.position.x = BOX_WIDTH / 2;
  planeRight.position.z = BOX_DEPTH / 2;

  const planeBottom = new Mesh(planeSideHorizontalGeo, mat1);
  planeBottom.rotation.x = -Math.PI / 2;
  planeBottom.position.y = -BOX_HEIGHT / 2;
  planeBottom.position.z = BOX_DEPTH / 2;

  const planeLeft = new Mesh(planeSideVerticalGeo, mat1);
  planeLeft.rotation.y = Math.PI / 2;
  planeLeft.position.x = -BOX_WIDTH / 2;
  planeLeft.position.z = BOX_DEPTH / 2;

  const planeBack = new Mesh(planeBackGeo, mat1);
  planeBack.rotation.y = Math.PI;
  // planeLeft.position.x = -BOX_WIDTH / 2;
  planeBack.position.z = BOX_DEPTH;

  return [planeTop, planeLeft, planeRight, planeBottom, planeBack];
}
