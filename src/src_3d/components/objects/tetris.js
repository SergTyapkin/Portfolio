import {
  BufferGeometry, EquirectangularReflectionMapping,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial, MeshNormalMaterial,
  MeshPhongMaterial, MeshPhysicalMaterial, RepeatWrapping,
  Shape, ShapeGeometry, SphereGeometry,
  TextureLoader, Vector2,
} from "three";
import {
  BLOCK_DEPTH,
  BLOCK_SIDE,
  BOX_DEPTH,
  BOX_HEIGHT,
  BOX_WIDTH,
  BEVEL_HEIGHT,
  BEVEL_SIZE,
  BEVEL_QUALITY,
  ROUNDNESS_RADIUS,
  ROUNDNESS_QUALITY,
  THICKNESS,
} from "~/src_3d/constants";
import TEXTURE_NORMAL_MAP_ROUGH_MATERIAL_URL from '/res/images/normal_maps/rough_material.jpg';
import TEXTURE_ENV_MAP_EMPTY_WAREHOUSE_URL from '/res/images/environment_maps/empty_warehouse.hdr';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader';


const WIREFRAMED = false;

const TETRIS_CONFIG = [
  { // left bottom Z
    name: 'Some site 1',
    contour: [[0, 0], [0, 2], [1, 2], [1, 3], [2, 3], [2, 1], [1, 1], [1, 0]],
    color: 0xFF0055,
    lightness: 2,
  },
  { // left Г
    name: 'Some site 2',
    contour: [[1, 0], [1, 1], [3, 1], [3, 2], [4, 2], [4, 0]],
    color: 0xFF0055,
    lightness: 2,
  },
  { // left square
    name: 'Some site 3',
    contour: [[2, 2], [2, 4], [4, 4], [4, 2]],
    color: 0xFF0055,
    lightness: 2,
  },
  { // left T
    name: 'Some site 4',
    contour: [[5, 0], [5, 3], [6, 3], [6, 2], [7, 2], [7, 1], [6, 1], [6, 0]],
    color: 0xFF0055,
    lightness: 2,
  },
  { // right L
    name: 'Some site 5',
    contour: [[6, 2], [6, 5], [7, 5], [7, 3], [8, 3], [8, 2]],
    color: 0xFF0055,
    lightness: 2,
  },
  { // right |
    name: 'Some site 6',
    contour: [[4, 0], [4, 4], [5, 4], [5, 0]],
    color: 0xFF0055,
    lightness: 2,
  },
  { // left top Z
    name: 'Some site 7',
    contour: [[0, 3], [0, 4], [1, 4], [1, 5], [3, 5], [3, 4], [2, 4], [2, 3]],
    color: 0xFF0055,
    lightness: 2,
  },
]


function transformFacesToGeometry(facesCoordinates) {
  // Transform faces to geometry
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(facesCoordinates, 3));
  geo.computeVertexNormals();
  // geo.computeBoundingBox();
  // geo.computeBoundingSphere();
  // geo.computeTangents();
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
      const fromPrev = new Vector2(x-x1, y-y1);
      const toNext = new Vector2(x2-x, y2-y);
      const average = fromPrev.add(toNext).multiplyScalar(0.5);
      const normal = new Vector2(-average.y, average.x)
      normal.normalize();
      // Find the bevel displacement for vertex
      let bevelFunc;
      const x0to1 = iter/(segments-1);
      if (toOut) {
        if (invertSide) {
          bevelFunc = Math.sqrt(1 - (x0to1-1) ** 2); // /-  (This is bevel form)
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
      // if (y === 150) {
      //   continue
      // }
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

function generateExtrudedFaces(contour, extrudeHeight, startZ = 0, invertNormals = false) {
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

function generateBeveledGeometry(shape) {
  const contour = shape.extractPoints(ROUNDNESS_QUALITY).shape;
  const faces = [];

  // Outer back bevel
  const {faces: outerBackBevelFaces, contour: outerBackFaceVertices} = generateBevel(contour, BEVEL_SIZE, BEVEL_HEIGHT, BEVEL_QUALITY, 0, true);
  faces.push(...outerBackBevelFaces);
  // Outer back face
  faces.push(...fillContourGetFaces(outerBackFaceVertices, BEVEL_HEIGHT, false));
  // Outer side faces
  faces.push(...generateExtrudedFaces(contour, -BLOCK_DEPTH + BEVEL_HEIGHT * 2, 0, true));
  // Outer front bevel
  const {faces: outerFrontBevelFaces, contour: outerFrontFaceVertices} = generateBevel(contour, BEVEL_SIZE, -BEVEL_HEIGHT, BEVEL_QUALITY, -BLOCK_DEPTH + BEVEL_HEIGHT * 2, false, false, false);
  faces.push(...outerFrontBevelFaces);
  // Inner front side faces
  faces.push(...generateExtrudedFaces(outerFrontFaceVertices, THICKNESS, -BLOCK_DEPTH + BEVEL_HEIGHT, true));
  // Inner front bevel
  const {faces: innerFrontBevelFaces, contour: innerFrontFaceVertices} = generateBevel(outerFrontFaceVertices, BEVEL_SIZE - THICKNESS, BEVEL_HEIGHT - THICKNESS, BEVEL_QUALITY, -BLOCK_DEPTH + BEVEL_HEIGHT + THICKNESS, false, true, true);
  faces.push(...innerFrontBevelFaces);
  // Inner side faces
  faces.push(...generateExtrudedFaces(innerFrontFaceVertices, BLOCK_DEPTH - BEVEL_HEIGHT * 2, -BLOCK_DEPTH + BEVEL_HEIGHT * 2, true));
  // Inner back bevel
  const {faces: innerBackBevelFaces, contour: innerBackFaceVertices} = generateBevel(innerFrontFaceVertices, BEVEL_SIZE - THICKNESS, BEVEL_HEIGHT - THICKNESS, BEVEL_QUALITY, 0, false);
  faces.push(...innerBackBevelFaces);
  // Inner back face
  faces.push(...fillContourGetFaces(innerBackFaceVertices, BEVEL_HEIGHT - THICKNESS, true));

  return {box: transformFacesToGeometry(faces), frontFace: generateExtrudedGeometry(outerFrontFaceVertices, THICKNESS)};
}

function generateShape(contour) {
  const shape = new Shape();
  const radius = ROUNDNESS_RADIUS;
  const contourExt = contour.concat([contour[0], contour[1]]);
  for (let i = 1; i < contourExt.length-1; i++) {
    const pointPrev = contourExt[i-1];
    const point = contourExt[i];
    const pointNext = contourExt[i+1];
    const pX = -point[0] * BLOCK_SIDE;
    const pY = point[1] * BLOCK_SIDE;
    if (pointPrev[1] < point[1]) { // from Top
      if (pointNext[0] > point[0]) { // to right
        shape.absarc(pX - radius, pY - radius, radius,  0, Math.PI / 2, false);
      } else if (pointNext[0] < point[0]) { // to left
        shape.absarc(pX + radius, pY - radius, radius, Math.PI / 2, 0, true);
      }
    } else if (pointPrev[0] < point[0]) { // from Right
      if (pointNext[1] > point[1]) { // to top
        shape.absarc(pX + radius, pY + radius, radius, Math.PI / 2 * 3, Math.PI, true);
      } else if (pointNext[1] < point[1]) { // to bottom
        shape.absarc(pX + radius, pY - radius, radius, Math.PI / 2, Math.PI, false);
      }
    } else if (pointPrev[1] > point[1]) { // from Bottom
      if (pointNext[0] > point[0]) { // to right
        shape.absarc(pX - radius, pY + radius, radius, Math.PI / 2 * 4, Math.PI / 2 * 3, true);
      } else if (pointNext[0] < point[0]) { // to left
        shape.absarc(pX + radius, pY + radius, radius, Math.PI, Math.PI / 2 * 3, false);
      }
    } else if (pointPrev[0] > point[0]) { // from Left
      if (pointNext[1] > point[1]) { // to top
        shape.absarc(pX - radius, pY + radius, radius, Math.PI / 2 * 3, Math.PI / 2 * 4, false);
      } else if (pointNext[1] < point[1]) { // to bottom
        shape.absarc(pX - radius, pY - radius, radius, Math.PI / 2, 0, true);
      }
    }
  }
  return shape;
}

function generateExtrudedGeometry(contour, extrudeHeight) {
  const faces = [];

  // Back face
  faces.push(...fillContourGetFaces(contour, 0, true));
  // Side faces
  faces.push(...generateExtrudedFaces(contour, extrudeHeight, 0, false));
  // Front face
  faces.push(...fillContourGetFaces(contour, extrudeHeight, false));

  return transformFacesToGeometry(faces);
}

export async function createTetris() {
  // Create materials
  const loaderTexture = new TextureLoader();
  const loaderRGBE = new RGBELoader();
  const textureNormalMapRoughMaterial = await loaderTexture.loadAsync(TEXTURE_NORMAL_MAP_ROUGH_MATERIAL_URL);
  textureNormalMapRoughMaterial.wrapS = RepeatWrapping;
  textureNormalMapRoughMaterial.wrapT = RepeatWrapping;
  textureNormalMapRoughMaterial.repeat.set(2, 2);
  const textureEnvMapEmptyWarehouse = await loaderRGBE.loadAsync(TEXTURE_ENV_MAP_EMPTY_WAREHOUSE_URL);
  textureEnvMapEmptyWarehouse.mapping = EquirectangularReflectionMapping;

  const mat1 = new MeshBasicMaterial({
    color: 0x000000,
  });
  const mat2 = new MeshPhongMaterial({
    color: 0x105942,
    shininess: 100,
  });
  const mat3 = new MeshPhysicalMaterial({
    color: 0xFF8888,
    transmission: 1,
    roughness: 0.2,
    // thickness: 7,
    clearcoat: true,
    // clearcoatRoughness: 0.1,
    // ior: 1.5,
    // envMap: textureEnvMapEmptyWarehouse,
    // envMapIntensity: 1,
    normalMap: textureNormalMapRoughMaterial,
    clearcoatNormalMap: textureNormalMapRoughMaterial,
    normalScale: new Vector2(10, 10),
    clearcoatNormalScale: new Vector2(10, 10),
  });


  const mat4 = new MeshNormalMaterial({
    // color: 0xF05942,
    wireframe: WIREFRAMED,
  });

  // Calculate all meshes coordinates by config
  const totalMeshes = [];
  TETRIS_CONFIG.forEach((blockConfig) => {
    const shape = generateShape(blockConfig.contour);
    const {box: boxGeometry, frontFace: frontFaceGeometry} = generateBeveledGeometry(shape);
    const beveledMesh = new Mesh(boxGeometry, mat4);
    // beveledMesh.position.z = -BEVEL_HEIGHT - THICKNESS + BLOCK_DEPTH + 50;
    beveledMesh.position.z = -BEVEL_HEIGHT + BOX_DEPTH;
    beveledMesh.position.y = -BOX_HEIGHT / 2 + THICKNESS;
    beveledMesh.position.x = BOX_WIDTH / 2 - THICKNESS;
    totalMeshes.push(beveledMesh);

    const frontFaceMesh = new Mesh(frontFaceGeometry, mat3);
    frontFaceMesh.position.z = 0;
    frontFaceMesh.position.y = -BOX_HEIGHT / 2 + THICKNESS;
    frontFaceMesh.position.x = BOX_WIDTH / 2 - THICKNESS;
    totalMeshes.push(frontFaceMesh);
  });

  const sphereGeo = new SphereGeometry(1, 5, 5);
  const centerSphere = new Mesh(sphereGeo, mat1);

  return [centerSphere, ...totalMeshes];
}
