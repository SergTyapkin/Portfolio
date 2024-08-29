import Singleton from "~/utils/Singleton";
import {Cache, FileLoader, TextureLoader} from "three";

const DEFAULT_SIZE = 1024 * 1024; // 1 Mb

function AjaxTextureLoader(manager) {
  const cache = Cache;

  // Turn on shared caching for FileLoader, ImageLoader and TextureLoader
  cache.enabled = true;

  const textureLoader = new TextureLoader(manager);
  const fileLoader = new FileLoader();
  fileLoader.setResponseType('blob');

  function load(url, onLoad, onProgress, onError) {
    const cached = cache.get(url);
    if (cached) {
      fileLoader.load(url, loadImageAsTexture, onProgress, onError);
    } else {
      fileLoader.load(url, cacheImage, onProgress, onError);
    }

    /**
     * The cache is currently storing a Blob, but we need to cast it to an
     * Image or else it won't work as a texture. TextureLoader won't do this
     * automatically.
     */
    function cacheImage(blob) {
      // ObjectURLs should be released as soon as is safe, to free memory
      const objUrl = URL.createObjectURL(blob);
      const image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');

      image.onload = ()=> {
        cache.add(url, image);
        URL.revokeObjectURL(objUrl);
        document.body.removeChild(image);
        loadImageAsTexture();
      };

      image.src = objUrl;
      image.style.visibility = 'hidden';
      document.body.appendChild(image);
    }

    function loadImageAsTexture() {
      textureLoader.load(url, onLoad, ()=> {}, onError);
    }
  }

  return Object.assign({}, textureLoader, {load});
}


class _Object {
  object = undefined
  total = DEFAULT_SIZE;
  loaded = 0;
  progress = 0;
  isLoaded = false;

  constructor(object = undefined, total = DEFAULT_SIZE) {
    this.object = object;
    this.total = total;
  }
  setLoaded(loaded, total) {
    if (loaded !== undefined) {
      this.loaded = loaded;
    }
    if (total !== undefined) {
      this.total = total;
    }
    if (this.loaded >= this.total) {
      this.isLoaded = true;
    }
    this.progress = this.loaded / this.total;
  }
  setFullyLoaded() {
    this.setLoaded(this.total);
  }
}

class _AssetsTrackerLoaderClass extends Singleton {
  loadedObjects = new Set(); // [_Object]
  trackedObjects = new Set(); // [any disposable objects]
  totalSize = 0;
  totalLoaded = 0;
  totalProgress = 0;

  constructor() {
    super();
  }

  async load(loaderClass, url, loadingManager = undefined) {
    if (loaderClass === TextureLoader) {
      loaderClass = AjaxTextureLoader;
    }

    const loaderInstance = new loaderClass(loadingManager);
    return new Promise( (resolve, reject) => {
      const newObject = new _Object();
      this.loadedObjects.add(newObject);
      loaderInstance.load(
        url,
        (value) => {
          newObject.setFullyLoaded();
          newObject.object = value;
          resolve(value);
        },
        ({loaded, total}) => {
          newObject.setLoaded(loaded, total);
          this._updateTotalLoadedProgress();
        },
        (value) => {
          console.error(`Loader: Error when loading asset (url = ${url}, loader = ${loaderClass.name}, error = ${value}`)
          reject(value);
        },
      );
    });
  }

  loadArray(loader, urls) {
    urls.forEach(url => this.load(loader, url));
  }

  track(object) {
    this.trackedObjects.add(object);
    return object;
  }

  trackArray(objects) {
    this.trackedObjects.add(...objects);
    return objects;
  }

  disposeAll() {
    this.loadedObjects.forEach(obj => obj?.object?.dispose ? obj.object.dispose() : null);
    this.loadedObjects.clear();

    this.trackedObjects.forEach(obj => obj?.dispose ? obj.dispose() : null);
    this.trackedObjects.clear();

    this.totalLoaded = 0;
    this.totalSize = 0;
    this.totalProgress = 1;
  }

  getObjects() {
    const objects = new Set();
    this.loadedObjects.forEach(obj => objects.add(obj.object));
    return objects;
  }

  _updateTotalLoadedProgress() {
    this.totalSize = 0;
    this.totalLoaded = 0;
    this.loadedObjects.forEach(obj => {
      this.totalSize += obj.total;
      this.totalLoaded += obj.loaded;
    });
    this.totalProgress = this.totalLoaded / this.totalSize;
  }
}

const AssetsTrackerLoader = new _AssetsTrackerLoaderClass();
export default AssetsTrackerLoader;
export const Track = (...args) => AssetsTrackerLoader.track.call(AssetsTrackerLoader, ...args);
export const Load = (...args) => AssetsTrackerLoader.load.call(AssetsTrackerLoader, ...args);
