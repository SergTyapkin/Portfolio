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
    window.addEventListener('resize', this.onResize());
    this.onResize()();
  }

  dispose() {
    window.removeEventListener('resize', this.onResize());
  }

  onResize() {
    return (event) => {
      // set the size again if a resize occurs
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
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
