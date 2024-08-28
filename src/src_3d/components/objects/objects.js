import {updateSize} from "~/src_3d/components/models/setupModel";
import {createBox} from "./box.js";
import {createTetris} from "./tetris.js";

export async function createObjects() {
  return (
    await createBox()
  ).concat(
    await createTetris()
  ).map((obj) => {
    // obj.receiveShadow = true;
    // obj.castShadow = true;
    if (obj.tick === undefined) {
      obj.tick = () => {};
    }
    return updateSize(obj);
  });
}
