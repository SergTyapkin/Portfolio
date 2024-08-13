<style scoped lang="stylus">
@require '../styles/constants.styl'
@require '../styles/buttons.styl'
@require '../styles/fonts.styl'

</style>

<template>
  <div class="root-page">
    <div ref="rootThree3d"></div>
  </div>
</template>


<script>
import {World} from "~/src_3d/World";

export default {
  components: {},

  data() {
    return {
    }
  },

  async mounted() {
    // Get a reference to the container element
    const container = this.$refs.rootThree3d;

    // create a new world
    const world = new World(container);

    // complete async tasks
    await world.init();

    // start the animation loop
    world.start();
  },

  methods: {
  }
}
</script>
