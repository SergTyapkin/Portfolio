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


class _LoadableObject {
  object = undefined
  total = DEFAULT_SIZE;
  loader = undefined;
  url = undefined;
  loaded = 0;
  progress = 0;
  isLoaded = false;
  resolvePromise = undefined;
  rejectPromise = undefined;

  constructor(loader, url, resolvePromise, rejectPromise, object = undefined, total = DEFAULT_SIZE) {
    this.loader = loader;
    this.url = url;
    this.resolvePromise = resolvePromise;
    this.rejectPromise = rejectPromise;
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
    this.isLoaded = (this.loaded >= this.total);
    this.progress = this.loaded / this.total;
  }
  setFullyLoaded() {
    this.setLoaded(this.total);
  }
}

class _AssetsTrackerLoaderClass extends Singleton {
  loadableObjects = new Set(); // [_Object]
  trackedObjects = new Set(); // [any disposable objects]
  totalSize = 0;
  totalLoaded = 0;
  totalProgress = 0;
  allLoadsPromise = undefined;
  _resolveAllLoadsPromise = undefined;
  _rejectAllLoadsPromise = undefined;

  constructor() {
    super();
    this.allLoadsPromise = new Promise((resolve, reject) => {
      this._resolveAllLoadsPromise = resolve;
      this._rejectAllLoadsPromise = reject;
    });
  }

  async addLoad(loaderClass, url, loadingManager = undefined, _permanently = false) {
    if (loaderClass === TextureLoader) {
      loaderClass = AjaxTextureLoader;
    }

    const loaderInstance = new loaderClass(loadingManager);
    return new Promise( (resolve, reject) => {
      const newObject = new _LoadableObject(loaderInstance, url, resolve, reject);
      this.loadableObjects.add(newObject);
      if (_permanently) {
        this._loadObject(newObject);
      }
    });
  }

  async loadAsync(loaderClass, url, loadingManager = undefined) {
    return this.addLoad(loaderClass, url, loadingManager, true);
  }

  async _loadObject(obj) {
    obj.loader.load(
      obj.url,
      (value) => { // on load successfully finished
        obj.setFullyLoaded();
        obj.object = value;
        obj.resolvePromise(value);

        let isAllLoaded = true;
        this.loadableObjects.forEach(obj => {
          isAllLoaded = isAllLoaded && obj.isLoaded;
        });
        if (isAllLoaded) {
          this._resolveAllLoadsPromise();
        }
      },
      ({loaded, total}) => { // on load process
        obj.setLoaded(loaded, total);
        this._updateTotalLoadedProgress();
      },
      (value) => { // on load error
        console.error(`Loader: Error when loading asset (url = ${url}, loader = ${typeof obj.loader}, error = ${value}`)
        obj.rejectPromise(value);
        this._rejectAllLoadsPromise();
      },
    );
  }

  async startAllLoads() {
    console.log("START ALL", this.loadableObjects);
    this.loadableObjects.forEach((obj) => {
      this._loadObject(obj);
    });
    return this.allLoadsPromise;
  }

  addLoadArray(loader, urls, loadingManager = undefined) {
    return Promise.all(urls.map(url => this.addLoad(loader, url, loadingManager)));
  }

  loadAsyncArray(loader, urls, loadingManager = undefined) {
    return Promise.all(urls.map(url => this.addLoad(loader, url, loadingManager, true)));
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
    this.loadableObjects.forEach(obj => obj?.object?.dispose ? obj.object.dispose() : null);
    this.loadableObjects.clear();

    this.trackedObjects.forEach(obj => obj?.dispose ? obj.dispose() : null);
    this.trackedObjects.clear();

    this.totalLoaded = 0;
    this.totalSize = 0;
    this.totalProgress = 1;
  }

  getObjects() {
    const objects = new Set();
    this.loadableObjects.forEach(obj => objects.add(obj.object));
    return objects;
  }

  _updateTotalLoadedProgress() {
    this.totalSize = 0;
    this.totalLoaded = 0;
    this.loadableObjects.forEach(obj => {
      this.totalSize += obj.total;
      this.totalLoaded += obj.loaded;
    });
    this.totalProgress = this.totalLoaded / this.totalSize;
  }
}

const AssetsTrackerLoader = new _AssetsTrackerLoaderClass();
export default AssetsTrackerLoader;
export const TrackAsset = (...args) => AssetsTrackerLoader.track.call(AssetsTrackerLoader, ...args);
export const AddLoad = (...args) => AssetsTrackerLoader.addLoad.call(AssetsTrackerLoader, ...args);
export const Load = (...args) => AssetsTrackerLoader.loadAsync.call(AssetsTrackerLoader, ...args);
