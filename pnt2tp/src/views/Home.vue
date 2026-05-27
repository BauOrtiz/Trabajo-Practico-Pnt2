<script setup>
import imagenInicio from '@/assets/img/prode-mundial-2026.png'
</script>

<template>
  <main class="home">
    <section class="hero">
      <img
        :src="imagenInicio"
        alt="Prode Mundial 2026"
        class="hero-img"
      />
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background-color: #050914;
}

.hero {
  width: 100%;
  overflow: hidden;
}

.hero-img {
  width: 100%;
  height: auto;
  display: block;
}
</style>