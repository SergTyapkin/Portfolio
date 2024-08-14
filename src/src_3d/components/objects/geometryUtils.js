import {BufferGeometry, Float32BufferAttribute, Shape, ShapeGeometry, Vector2, Vector3} from "three";
import {ROUNDNESS_QUALITY} from "~/src_3d/constants";


export function computeUVs(geometry) {
  const faceVertices = geometry.attributes.position.array;
  const uvs = [];
  geometry.computeBoundingBox();
  const min = geometry.boundingBox.min;
  const max = geometry.boundingBox.max;
  const range = max.clone().sub(min);

  for (let i = 0; i < faceVertices.length; i += 3) {
    const u = min.x + faceVertices[i+0] / range.x;
    const v = min.y + faceVertices[i+1] / range.y;

    uvs.push(u, v);
  }

  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.uvsNeedsUpdate = true;

  const minRange = Math.min(range.x, range.y);
  return [range.x / minRange, range.y / minRange];
}

export function transformFacesToGeometry(facesCoordinates) {
  // Transform faces to geometry
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(facesCoordinates, 3));
  geo.computeVertexNormals();
  // geo.computeBoundingBox();
  // geo.computeBoundingSphere();
  // geo.computeTangents();
  return geo;
}

export function fillContourGetFaces(contour, startZ = 0, invertNormals = false) {
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

export function generateBevel(contour, bevelSize, bevelHeight, segments, startZ = 0, invertNormals = false, toOut = false, invertSide = false) {
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

export function generateExtrudedFaces(contour, extrudeHeight, startZ = 0, invertNormals = false) {
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
