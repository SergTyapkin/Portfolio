import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial, MeshNormalMaterial,
  MeshPhongMaterial,
  Shape, ShapeGeometry, SphereGeometry,
  TextureLoader, Vector2,
} from "three";
import {BLOCK_DEPTH, BLOCK_SIDE, BOX_DEPTH} from "~/src_3d/constants";


const BEVEL_HEIGHT = 10;
const BEVEL_SIZE = 10;
const BEVEL_QUALITY = 10;
const ROUNDNESS_RADIUS = 15;
const ROUNDNESS_QUALITY = 5;
const THICKNESS = 3;


function transformFacesToGeometry(facesCoordinates) {
  // Transform faces to geometry
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(facesCoordinates, 3));
  geo.computeVertexNormals();
  return geo;
}

function fillContourGetFaces(contour, startZ = 0, invertNormals = false) {
  const faceRimShape = new Shape(contour);
  const faceGeo = new ShapeGeometry(faceRimShape, ROUNDNESS_QUALITY);
  const faceGeoVertices = faceGeo.attributes.position.array;
  const faceGeoFacesIndexes = faceGeo.index.array;
  const faceGeoFaces = [];
  for (let i = 0; i < faceGeoFacesIndexes.length; i += 3) {
    const idx1 = faceGeoFacesIndexes[i];
    const idx2 = faceGeoFacesIndexes[i+1];
    const idx3 = faceGeoFacesIndexes[i+2];
    if (!invertNormals) {
      faceGeoFaces.push(
        faceGeoVertices[idx1 * 3], faceGeoVertices[idx1 * 3 + 1], startZ,
        faceGeoVertices[idx2 * 3], faceGeoVertices[idx2 * 3 + 1], startZ,
        faceGeoVertices[idx3 * 3], faceGeoVertices[idx3 * 3 + 1], startZ,
      );
    } else {
      faceGeoFaces.push(
        faceGeoVertices[idx3 * 3], faceGeoVertices[idx3 * 3 + 1], startZ,
        faceGeoVertices[idx2 * 3], faceGeoVertices[idx2 * 3 + 1], startZ,
        faceGeoVertices[idx1 * 3], faceGeoVertices[idx1 * 3 + 1], startZ,
      );
    }
  }
  return faceGeoFaces;
}

function generateBevel(contour, bevelSize, bevelHeight, segments, startZ = 0, invertNormals = false, toOut = false, invertSide = false) {
  // Generate bevel vertices
  const contourExt = contour.concat(contour[0], contour[1]);
  const dz = bevelHeight / (segments - 1);
  const vertices = []
  for (let iter = 0; iter < segments; iter++) {
    vertices.push([]);
    for (let i = 1; i < contourExt.length-1; i++) {
      let x = contourExt[i].x;
      let y = contourExt[i].y;
      let z = startZ + dz * iter;

      let x1 = contourExt[i-1].x;
      let y1 = contourExt[i-1].y;

      let x2 = contourExt[i+1].x;
      let y2 = contourExt[i+1].y;

      // Find the normal in vertex
      const toPrev = new Vector2(x1-x, y1-y);
      const toNext = new Vector2(x2-x, y2-y);
      toPrev.normalize();
      toNext.normalize();
      const normal = toPrev.add(toNext);
      normal.normalize();
      // Find the bevel displacement for vertex
      let bevelFunc;
      const x0to1 = iter/(segments-1);
      if (toOut) {
        if (invertSide) {
          bevelFunc = Math.sqrt(1 - (x0to1-1) ** 2); // /-
        } else {
          bevelFunc = 1 - Math.sqrt(1 - x0to1 ** 2); //  _/
        }
      } else {
        if (invertSide) {
          bevelFunc = -Math.sqrt(1 - (x0to1-1) ** 2); // \_
        } else {
          bevelFunc = Math.sqrt(1 - x0to1 ** 2) - 1; // -\
        }
      }
      const displacement = bevelFunc * bevelSize;
      normal.multiplyScalar(displacement);
      x -= normal.x;
      y -= normal.y;
      vertices[iter].push({x, y, z});
    }
  }

  // Generate bevel faces
  const faces = [];
  vertices[0].push(vertices[0][0]);
  for (let iter = 1; iter < segments; iter++) {
    vertices[iter].push(vertices[iter][0]);
    for (let i = 1; i < vertices[iter].length; i++) {
      let x11 = vertices[iter][i - 1].x;
      let y11 = vertices[iter][i - 1].y;
      let z11 = vertices[iter][i - 1].z;

      let x12 = vertices[iter][i].x;
      let y12 = vertices[iter][i].y;
      let z12 = vertices[iter][i].z;

      let x21 = vertices[iter - 1][i - 1].x;
      let y21 = vertices[iter - 1][i - 1].y;
      let z21 = vertices[iter - 1][i - 1].z;

      let x22 = vertices[iter - 1][i].x;
      let y22 = vertices[iter - 1][i].y;
      let z22 = vertices[iter - 1][i].z;

      if (!invertNormals) {
        faces.push(
          x12, y12, z12,
          x22, y22, z22,
          x11, y11, z11,

          x22, y22, z22,
          x21, y21, z21,
          x11, y11, z11,
        );
      } else {
        faces.push(
          x11, y11, z11,
          x22, y22, z22,
          x12, y12, z12,

          x11, y11, z11,
          x21, y21, z21,
          x22, y22, z22,
        );
      }
    }
  }
  const lastContour = vertices[vertices.length - 1];
  return {faces, contour: lastContour.slice(0, lastContour.length-1)};
}

function generateExtrudedFaces(contour, extrudeHeight, startZ=0, invertNormals=false) {
  const contourExt = contour.concat(contour[0]);
  const faces = [];
  for (let i = 1; i < contourExt.length; i++) {
    let x1 = contourExt[i-1].x;
    let y1 = contourExt[i-1].y;
    let z1 = startZ;

    let x2 = contourExt[i].x;
    let y2 = contourExt[i].y;
    let z2 = startZ + extrudeHeight;

    if (!invertNormals) {
      faces.push(
        x1, y1, z1,
        x2, y2, z1,
        x2, y2, z2,

        x1, y1, z1,
        x2, y2, z2,
        x1, y1, z2,
      );
    } else {
      faces.push(
        x2, y2, z2,
        x2, y2, z1,
        x1, y1, z1,

        x1, y1, z2,
        x2, y2, z2,
        x1, y1, z1,
      );
    }
  }
  return faces;
}

function generateBeveledShape(shape) {
  const contour = shape.extractPoints(ROUNDNESS_QUALITY).shape;
  const faces = [];

  // Inner back bevel
  const {faces: innerBackBevelFaces, contour: innerBackFaceVertices} = generateBevel(contour, BEVEL_SIZE, BEVEL_HEIGHT, BEVEL_QUALITY, 0);
  faces.push(...innerBackBevelFaces);
  // // Inner back face
  // faces.push(...fillContourGetFaces(innerBackFaceVertices, BEVEL_HEIGHT, true));
  // // Inner side faces
  // faces.push(...generateExtrudedFaces(contour, -BLOCK_DEPTH + BEVEL_HEIGHT * 2));
  // // Inner front bevel
  // const {faces: innerFrontBevelFaces, contour: innerFrontFaceVertices} = generateBevel(contour, BEVEL_SIZE, -BEVEL_HEIGHT, BEVEL_QUALITY, -BLOCK_DEPTH + BEVEL_HEIGHT * 2, true);
  // faces.push(...innerFrontBevelFaces);
  // // Inner front side faces
  // faces.push(...generateExtrudedFaces(innerFrontFaceVertices, -THICKNESS, -BLOCK_DEPTH + BEVEL_HEIGHT));
  // // Outer front bevel
  // const {faces: outerFrontBevelFaces, contour: outerFrontFaceVertices} = generateBevel(innerFrontFaceVertices, BEVEL_SIZE + THICKNESS, BEVEL_HEIGHT + THICKNESS, BEVEL_QUALITY, -BLOCK_DEPTH + BEVEL_HEIGHT - THICKNESS, true, true, true);
  // faces.push(...outerFrontBevelFaces);
  // // Outer side faces
  // faces.push(...generateExtrudedFaces(outerFrontFaceVertices, BLOCK_DEPTH - BEVEL_HEIGHT * 2, -BLOCK_DEPTH + BEVEL_HEIGHT * 2));
  // // Outer back bevel
  // const {faces: outerBackBevelFaces, contour: outerBackFaceVertices} = generateBevel(outerFrontFaceVertices, BEVEL_SIZE + THICKNESS, BEVEL_HEIGHT + THICKNESS, BEVEL_QUALITY, 0, true);
  // faces.push(...outerBackBevelFaces);
  // // Outer back face
  // faces.push(...fillContourGetFaces(outerBackFaceVertices, BEVEL_HEIGHT + THICKNESS));

  return transformFacesToGeometry(faces);
}

function generateShape(contour) {
  const shape = new Shape();
  const radius = ROUNDNESS_RADIUS;
  const contourExt = contour.concat([contour[0], contour[1]]);
  for (let i = 1; i < contourExt.length-1; i++) {
    const pointPrev = contourExt[i-1];
    const point = contourExt[i];
    const pointNext = contourExt[i+1];
    console.log(pointPrev, point, pointNext);
    const pX = -point[0] * BLOCK_SIDE;
    const pY = point[1] * BLOCK_SIDE;
    if (pointPrev[1] < point[1]) { // to Top
      if (pointNext[0] > point[0]) {
        console.log("top To Right")
        shape.absarc(pX - radius, pY - radius, radius,  0, Math.PI / 2, false);
      } else if (pointNext[0] < point[0]) {
        console.log("top To Left")
        shape.absarc(pX + radius, pY - radius, radius, Math.PI / 2, 0, true);
      }
    } else if (pointPrev[0] < point[0]) { // to Right
      if (pointNext[1] > point[1]) {
        console.log("right To Top")
        shape.absarc(pX + radius, pY + radius, radius, Math.PI / 2 * 3, Math.PI, true);
      } else if (pointNext[1] < point[1]) {
        console.log("right To Bottom")
        shape.absarc(pX + radius, pY - radius, radius, Math.PI / 2, Math.PI, false);
      }
    } else if (pointPrev[1] > point[1]) { // to Bottom
      if (pointNext[0] > point[0]) {
        console.log("bottom To Right")
        shape.absarc(pX - radius, pY + radius, radius, Math.PI / 2 * 4, Math.PI / 2 * 3, true);
      } else if (pointNext[0] < point[0]) {
        console.log("bottom To Left")
        shape.absarc(pX + radius, pY + radius, radius, Math.PI, Math.PI / 2 * 3, false);
      }
    } else if (pointPrev[0] > point[0]) { // to Left
      if (pointNext[1] > point[1]) {
        console.log("left To Top")
        shape.absarc(pX - radius, pY + radius, radius, Math.PI / 2 * 3, Math.PI / 2 * 4, false);
      } else if (pointNext[1] < point[1]) {
        console.log("left To Bottom")
        shape.absarc(pX - radius, pY - radius, radius, Math.PI / 2, 0, true);
      }
    }
  }
  return shape;
}

export async function createTetris() {
  const tetrisConfig = [
    {
      name: 'Some site 1',
      contour: [[0, 0], [0, 2], [1, 2], [1, 3], [2, 3], [2, 1], [1, 1], [1, 0]],
      color: 0xFF0055,
      lightness: 2,
    }
  ]

  // Create materials
  // const loader = new TextureLoader();
  // const textures = await Promise.all([
  //   loader.loadAsync( './assets/skyboxes/lava/dn.jpg'),
  // ]);

  const mat1 = new MeshBasicMaterial({
    color: 0x000000,
  });
  const mat2 = new MeshPhongMaterial({
    color: 0x105942,
    shininess: 100,
  });
  const mat3 = new MeshPhongMaterial({
    color: 0xF05942,
    shininess: 100,
  });
  const mat4 = new MeshNormalMaterial({
    // color: 0xF05942,
    // wireframe: true,
  });

  // Calculate all meshes coordinates by config
  const shape = generateShape(tetrisConfig[0].contour);
  const boxGeometry = generateBeveledShape(shape);

  const beveledCube = new Mesh(boxGeometry, mat4);
  beveledCube.position.z = -BEVEL_HEIGHT - THICKNESS + BLOCK_DEPTH + 50;

  const sphereGeo = new SphereGeometry(1, 5, 5);
  const centerSphere = new Mesh(sphereGeo, mat1);

  return [centerSphere, beveledCube];
}
