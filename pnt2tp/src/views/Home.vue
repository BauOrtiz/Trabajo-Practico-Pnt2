<script setup>
import imagenInicio from '@/assets/img/prode-mundial-2026.png'
import { useProximosPartidos } from '../composables/Composable-Home.js'
import { obtenerBanderaUrl } from '../utils/banderas.js'
import { useRouter } from 'vue-router'

// --- 📦 1. DESESTRUCTURACIÓN DEL COMPOSABLE ---
// useProximosPartidos: Extraemos de este composable las variables y funciones necesarias 
// para manejar el estado de carga, errores y el procesamiento de los próximos partidos de la semana.
const { 
  cargando, 
  error, 
  proximosPartidos, 
  partidosPorDia, 
  formatearHora 
} = useProximosPartidos()

// --- 🧭 2. CONFIGURACIÓN DEL ENRUTADOR ---
const router = useRouter() 

/**
 * Redirige de forma segura al usuario a la pantalla detallada de un partido
 * @param {string|number} id - El identificador del partido que se quiere visualizar
 */
function irAlDetalle(id) {
  router.push(`/partido/${id}`)
}
</script>

<template>
  <main class="home">
    <!-- 🏟️ SECCIÓN 1: HERO / BANNER DE BIENVENIDA -->
    <section class="hero">
      <img
        :src="imagenInicio"
        alt="Prode Mundial 2026"
        class="hero-img"
      />
    </section>

    <!-- 📅 SECCIÓN 2: GRILLA DINÁMICA DE PRÓXIMOS PARTIDOS -->
    <section class="proximos-partidos">
      <h2>Próximos partidos</h2>

      <!-- ⏳ CASO A: Los datos del Mundial todavía se están recuperando de Pinia/API -->
      <div v-if="cargando" class="sin-partidos">
        Cargando partidos...
      </div>

      <!-- ⚠️ CASO B: Ocurrió algún inconveniente durante la carga del fixture -->
      <div v-else-if="error" class="sin-partidos">
        {{ error }}
      </div>

      <!-- 📭 CASO C: Todo cargó bien pero no hay partidos programados en la semana actual simulada -->
      <div v-else-if="proximosPartidos.length === 0" class="sin-partidos">
        No hay partidos programados para esta semana.
      </div>

      <!-- ✅ CASO D: Se cargaron partidos. Se recorren agrupados por día de la semana -->
      <template v-else>
        <!-- 
          Iteramos sobre el objeto 'partidosPorDia' (ej: {"Lunes 15 de Junio": [partido1, partido2]}). 
          'partidosDia' es la lista de partidos de esa fecha y 'dia' es el título formateado de la fecha.
        -->
        <div v-for="(partidosDia, dia) in partidosPorDia" :key="dia" class="grupo-dia">
          <!-- Título que separa y encabeza el día (ej: "Lunes 15 de Junio") -->
          <div class="fecha-header"> {{ dia }}</div>

          <!-- Tarjetas individuales de partidos pertenecientes a este día específico -->
          <article 
            v-for="partido in partidosDia" 
            :key="partido.id" 
            class="card" 
            @click="irAlDetalle(partido.id)"
          >
            <!-- 🕐 Bloque indicador de la hora del encuentro (ej: "18:00") -->
            <div class="hora">
              <span>🕐</span>
              <span>{{ formatearHora(partido.fecha) }}</span>
            </div>

            <!-- 🏠 Equipo Local: Bandera y nombre de la selección -->
            <div class="equipo local">
              <img :src="obtenerBanderaUrl(partido.equipoLocal)" :alt="partido.equipoLocal" class="bandera-img" />
              <span class="nombre">{{ partido.equipoLocal.toUpperCase() }}</span>
            </div>

            <!-- Separador central clásico para el enfrentamiento -->
            <div class="separador">-</div>

            <!-- ✈️ Equipo Visitante: Nombre de la selección y bandera -->
            <div class="equipo visitante">
              <span class="nombre">{{ partido.equipoVisitante.toUpperCase() }}</span>
              <img :src="obtenerBanderaUrl(partido.equipoVisitante)" :alt="partido.equipoVisitante" class="bandera-img" />
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
