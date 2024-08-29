<style lang="stylus" scoped>
color = white

.root-progress
  overflow visible
  height var(--size)
  width var(--size)
  .circle
  .circle-shadow
    stroke-linecap round
    stroke-width 3
    stroke color
    stroke-dasharray calc(var(--progress) * var(--math-pi) * 2 * 50) 1000
    transform rotate(-90deg)
    transform-origin 50% 50%
    animation rotating 15s linear running infinite
    fill none
    transition stroke-dasharray 0.2s ease
    @keyframes rotating {
      from {
        transform rotate(-90deg)
      }
      to {
        transform rotate(270deg)
      }
    }
  .circle-shadow
    filter blur(10px)

  .text
    fill color
    font-family monospace
</style>

<template>
  <svg class="root-progress" viewBox="0 0 100 100" :style="{'--progress': progress, '--math-pi': MATH_PI, '--size': size}">
    <circle class="circle" r="50" cx="50" cy="50"></circle>
    <circle class="circle-shadow" r="50" cx="50" cy="50"></circle>
    <text class="text" x="50" y="50" font-size="10" text-anchor="middle" dominant-baseline="middle">{{ Math.round(progress * 1000) / 10 }} %</text>
  </svg>
</template>

<script>
export default {
  props: {
    progress: 0,
    size: {
      default: '60px'
    },
  },

  data() {
    return {
      MATH_PI: Math.PI,
    }
  },

  computed: {
    isLoaded() {
      return this.progress >= 1;
    }
  }
};
</script>
