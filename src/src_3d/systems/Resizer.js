class Resizer {
  container = undefined;
  camera = undefined;
  renderer = undefined;
  composer = undefined;

  constructor(container, camera, renderer, composer) {
    this.container = container;
    this.camera = camera;
    this.renderer = renderer;
    this.composer = composer;
    window.addEventListener('resize', this._onResize());
    this.update();
  }

  dispose() {
    window.removeEventListener('resize', this._onResize());
  }

  update() {
    this._onResize()();
  }

  _onResize() {
    return (event) => {
      // set the size again if a resize occurs
      // const width = this.container.clientWidth;
      // const height = this.container.clientHeight;
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      this.composer.setSize(width, height);
      this.composer.setPixelRatio(window.devicePixelRatio);
    }
  }

  // onResize({ canvas, pixelRatio, viewportWidth, viewportHeight }) {
    // const dpr = Math.min(pixelRatio, 2); // Cap DPR scaling to 2x
    //
    // canvas.width = viewportWidth * dpr;
    // canvas.height = viewportHeight * dpr;
    // canvas.style.width = viewportWidth + "px";
    // canvas.style.height = viewportHeight + "px";
    //
    // bloomPass.resolution.set(viewportWidth, viewportHeight);
    //
    // renderer.setPixelRatio(dpr);
    // renderer.setSize(viewportWidth, viewportHeight);
    //
    // composer.setPixelRatio(dpr);
    // composer.setSize(viewportWidth, viewportHeight);
    //
    // camera.aspect = viewportWidth / viewportHeight;
    // camera.updateProjectionMatrix();
  // }
}

export { Resizer };
