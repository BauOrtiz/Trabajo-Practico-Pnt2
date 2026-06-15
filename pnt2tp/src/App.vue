<script setup>
</script>

<template>
  <div class="app-layout">
    <header class="header">
      <nav class="navbar">
        <router-link to="/home">Inicio</router-link>
        <router-link to="/partidos">Partidos</router-link>
        <router-link to="/ranking">Ranking</router-link>
        <router-link to="/prode">Prode</router-link>
        <router-link to="/login">LogIn</router-link>
        <router-link to="/grupos">Grupos</router-link>
      </nav>
    </header>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #111827;
}

.header {
  width: 100%;
  padding: 18px 20px 8px;
}

.navbar {
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px 18px;
  display: flex;
  justify-content: center;
  gap: 24px;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.navbar a {
  color: #93c5fd;
  padding: 6px 10px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.navbar a:hover {
  color: white;
  background-color: #2563eb;
}

.navbar a.router-link-active {
  color: white;
  background-color: #2563eb;
}

.main-content {
  width: 100%;
}

@media (max-width: 600px) {
  .navbar {
    flex-wrap: wrap;
    gap: 10px;
  }
}
</style>