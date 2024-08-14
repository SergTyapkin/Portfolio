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
import World from "~/src_3d/World";

export default {
  components: {},

  data() {
    return {
      world: undefined,
    }
  },

  async mounted() {
    // create a new world
    this.world = new World(this.$refs.rootThree3d);

    // complete async tasks
    await this.world.init();

    // start the animation loop
    this.world.start();
  },

  unmounted() {
    this.world.dispose();
  },

  methods: {
  }
}
</script>
