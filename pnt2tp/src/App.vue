<script setup>
</script>

<template>
  <nav>
    <router-link to="/home">Inicio</router-link>
    <router-link to="/partidos">Partidos</router-link>
    <router-link to="/ranking">Ranking</router-link>
    <router-link to="/prode">Prode</router-link>
  </nav>

  <main>
    <router-view />
  </main>
</template>

<style scoped>
nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: white;
  border-radius: 20px;
  text-align: center;
  font-size: 0.875rem;
}

nav a {
  color: #87CEEB;
  padding: 2px 6px;
  border-radius: 10px;
}
nav a:hover {
  color: #1E90FF;
  background-color: rgb(252, 252, 109);
}
</style>
