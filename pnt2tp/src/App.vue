<script setup>
</script>

<template>
  <h1>Bua</h1>
  <nav>
    <router-link to="/home">Inicio</router-link>
    <router-link to="/partidos">Partidos</router-link>
    <router-link to="/ranking">Ranking</router-link>
  </nav>

  <main>
    <router-view />
  </main>
</template>

<style scoped>
nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}
</style>
