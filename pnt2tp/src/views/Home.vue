<script setup>
import imagenInicio from '@/assets/img/prode-mundial-2026.png'
import { useProximosPartidos } from '../composables/Composable-Home.js'
import { obtenerBanderaUrl } from '../utils/banderas.js'

const { cargando, error, proximosPartidos, partidosPorDia, formatearHora } = useProximosPartidos()

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

    <section class="proximos-partidos">
      <h2>Próximos partidos</h2>

      <div v-if="cargando" class="sin-partidos">
        Cargando partidos...
      </div>

      <div v-else-if="error" class="sin-partidos">
        {{ error }}
      </div>

      <div v-else-if="proximosPartidos.length === 0" class="sin-partidos">
        No hay partidos programados para esta semana.
      </div>

      <template v-else>
        <div v-for="(partidosDia, dia) in partidosPorDia" :key="dia" class="grupo-dia">
          <div class="fecha-header">📅 {{ dia }}</div>

          <article v-for="partido in partidosDia" :key="partido.id" class="card">
            <div class="hora">
              <span>🕐</span>
              <span>{{ formatearHora(partido.fechaHora) }}</span>
            </div>

            <div class="equipo local">
              <img :src="obtenerBanderaUrl(partido.localId)" :alt="partido.localId" class="bandera-img" />
              <span class="nombre">{{ partido.localId.toUpperCase() }}</span>
            </div>

            <div class="separador">-</div>

            <div class="equipo visitante">
              <span class="nombre">{{ partido.visitanteId.toUpperCase() }}</span>
              <img :src="obtenerBanderaUrl(partido.visitanteId)" :alt="partido.visitanteId" class="bandera-img" />
            </div>
          </article>
        </div>
      </template>
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

.proximos-partidos {
  padding: 2rem 1.5rem;
}

.proximos-partidos h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 1.5rem;
}

.sin-partidos {
  color: #aaa;
  font-style: italic;
}

.grupo-dia {
  margin-bottom: 1.5rem;
}

.fecha-header {
  text-align: center;
  font-weight: bold;
  font-size: 0.95rem;
  color: #f0b429;
  margin-bottom: 0.6rem;
}

.card {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background-color: #ffffff;
  border-radius: 50px;
  color: #111;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.card:hover {
  background-color: #f0f0f0;
}

.hora {
  display: flex;
  position: absolute;
  left: 1.25rem;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #666;
  min-width: 85px;
}

.equipo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 96px;
}

.equipo.local {
  justify-content: flex-end;
}

.equipo.visitante {
  justify-content: flex-start;
}

.bandera-img {
  width: 32px;
  height: auto;
  border-radius: 3px;
}

.nombre {
  font-weight: bold;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  color: #111;
}

.separador {
  font-weight: bold;
  font-size: 1.2rem;
  color: #999;
  padding: 0 0.25rem;
}
</style>
