const setSize = (container, camera, renderer) => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
};

class Resizer {
  constructor(container, camera, renderer) {
    // set initial size
    setSize(container, camera, renderer);

    window.addEventListener('resize', () => {
      // set the size again if a resize occurs
      setSize(container, camera, renderer);
      // perform any custom actions
      this.onResize();
    });
  }

  onResize({ canvas, pixelRatio, viewportWidth, viewportHeight }) {
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
  }
}

export { Resizer };
