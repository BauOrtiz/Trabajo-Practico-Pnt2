<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/storeAuth'
import { obtenerPredicciones } from '../services/prediccionesService'
import { calcularTablaGrupo, obtenerGruposDisponibles } from '../services/grupoService'
import { calcularUsuariosConPuntos } from '../services/puntosService'
import { useEstaticoStore } from '../stores/storeEstaticos'
import { obtenerBanderaUrl } from '../utils/banderas.js'

const authStore = useAuthStore()
const estaticoStore = useEstaticoStore()

const predicciones = ref([])
const grupoSeleccionado = ref('A')
const usuarios = ref([])
const cargandoAmigos = ref(true)
const errorAmigos = ref('')
const API_USUARIOS = 'https://6a2b1b9ab687a7d5cbc4de36.mockapi.io/prode/Usuarios'

const partidos = computed(() => estaticoStore.partidos)
const cargando = computed(() => estaticoStore.loading && partidos.value.length === 0)
const error = computed(() => estaticoStore.errores.partidos || '')

const usuariosOrdenados = computed(() => {
  const usuariosConPuntos = calcularUsuariosConPuntos(usuarios.value, partidos.value)
  return [...usuariosConPuntos].sort((a, b) => (b.puntosTotales || 0) - (a.puntosTotales || 0))
})

function esUsuarioActual(usuario) {
  return authStore.user && authStore.user.id === usuario.id
}

function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').map((parte) => parte[0]).join('').toUpperCase().slice(0, 2)
}

function medallaColor(pos) {
  if (pos === 0) return '#f0b429'
  if (pos === 1) return '#aaaaaa'
  if (pos === 2) return '#cd7f32'
  return '#555'
}

function cargarPredicciones() {
  predicciones.value = obtenerPredicciones(authStore.user?.id)
}

watch(
  () => authStore.user?.id,
  cargarPredicciones
)

const grupos = computed(() => obtenerGruposDisponibles(partidos.value))

const rankingReal = computed(() =>
  calcularTablaGrupo(partidos.value, grupoSeleccionado.value)
)

const rankingApostado = computed(() =>
  calcularTablaGrupo(partidos.value, grupoSeleccionado.value, predicciones.value)
)

onMounted(async () => {
  await cargarPredicciones()
  await estaticoStore.cargarDatosMundial()

  try {
    const res = await fetch(API_USUARIOS)
    if (!res.ok) {
      throw new Error('No se pudo cargar la lista de usuarios.')
    }

    const data = await res.json()
    usuarios.value = Array.isArray(data) ? data : []
  } catch (errorUsuarios) {
    errorAmigos.value = 'No se pudo cargar el ranking de amigos.'
  } finally {
    cargandoAmigos.value = false
  }
})
</script>

<template>
  <main class="ranking-page">
    <section class="encabezado">
      <div>
        <h1>Ranking</h1>
        <p>Posiciones reales y posiciones segun tus predicciones.</p>
      </div>

      <label class="selector">
        Grupo
        <select v-model="grupoSeleccionado">
          <option v-for="grupo in grupos" :key="grupo" :value="grupo">
            Grupo {{ grupo }}
          </option>
        </select>
      </label>
    </section>

    <section v-if="cargando" class="mensaje">
      Cargando ranking...
    </section>

    <section v-else-if="error" class="mensaje error">
      {{ error }}
    </section>

    <section v-else class="tablas-ranking">
      <article class="tabla-card">
        <div class="tabla-header">
          <h2>Ranking real</h2>
          <span>Grupo {{ grupoSeleccionado }}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>DG</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fila, index) in rankingReal" :key="fila.nombre">
              <td>{{ index + 1 }}</td>
              <td class="equipo">
                <img :src="obtenerBanderaUrl(fila.nombre)" :alt="fila.nombre" />
                <span>{{ fila.nombre }}</span>
              </td>
              <td>{{ fila.jugados }}</td>
              <td>{{ fila.ganados }}</td>
              <td>{{ fila.empatados }}</td>
              <td>{{ fila.perdidos }}</td>
              <td>{{ fila.diferenciaGol }}</td>
              <td class="puntos">{{ fila.puntos }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="tabla-card">
        <div class="tabla-header">
          <h2>Mi ranking apostado</h2>
          <span>{{ predicciones.length }} predicciones</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>DG</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fila, index) in rankingApostado" :key="fila.nombre">
              <td>{{ index + 1 }}</td>
              <td class="equipo">
                <img :src="obtenerBanderaUrl(fila.nombre)" :alt="fila.nombre" />
                <span>{{ fila.nombre }}</span>
              </td>
              <td>{{ fila.jugados }}</td>
              <td>{{ fila.ganados }}</td>
              <td>{{ fila.empatados }}</td>
              <td>{{ fila.perdidos }}</td>
              <td>{{ fila.diferenciaGol }}</td>
              <td class="puntos">{{ fila.puntos }}</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>

    <section class="ranking-amigos">
      <h2 class="amigos-titulo">Ranking de amigos</h2>

      <div v-if="cargandoAmigos" class="mensaje">Cargando amigos...</div>

      <div v-else-if="errorAmigos" class="mensaje error">
        {{ errorAmigos }}
      </div>

      <div v-else-if="usuariosOrdenados.length === 0" class="mensaje">
        No hay usuarios registrados todavia.
      </div>

      <template v-else>
        <div
          v-for="(usuario, idx) in usuariosOrdenados"
          :key="usuario.id"
          :class="['amigo-card', esUsuarioActual(usuario) ? 'amigo-card--propio' : '']"
        >
          <span class="amigo-pos" :style="{ color: medallaColor(idx) }">{{ idx + 1 }}</span>
          <div class="amigo-avatar">{{ iniciales(usuario.nombre) }}</div>
          <div class="amigo-info">
            <span class="amigo-nombre">
              {{ usuario.nombre }}
              <span v-if="esUsuarioActual(usuario)" class="vos-tag">vos</span>
            </span>
            <span class="amigo-pts">{{ usuario.puntosTotales || 0 }} puntos</span>
          </div>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.ranking-page {
  min-height: calc(100vh - 80px);
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px;
  color: white;
}

.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.encabezado h1,
.tabla-header h2 {
  margin: 0;
}

.encabezado p {
  margin: 6px 0 0;
  color: #9ca3af;
}

.selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #d1d5db;
  font-weight: 600;
}

.selector select {
  min-width: 160px;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background-color: white;
  color: #111827;
  font-size: 15px;
}

.mensaje {
  padding: 24px;
  text-align: center;
  border-radius: 12px;
  background-color: #1f2937;
  color: #e5e7eb;
}

.error {
  background-color: #7f1d1d;
}

.tablas-ranking {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.tabla-card {
  overflow: hidden;
  border: 1px solid #243044;
  border-radius: 8px;
  background-color: #ffffff;
  color: #111827;
}

.tabla-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 18px;
  border-bottom: 1px solid #e5e7eb;
}

.tabla-header span {
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
  font-size: 14px;
}

th {
  background-color: #f3f4f6;
  color: #374151;
  font-size: 12px;
  text-transform: uppercase;
}

tr:last-child td {
  border-bottom: 0;
}

.equipo {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
  text-align: left;
  font-weight: 700;
}

.equipo img {
  width: 28px;
  height: 20px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
}

.puntos {
  font-weight: 800;
  color: #2563eb;
}

@media (max-width: 900px) {
  .encabezado {
    flex-direction: column;
    align-items: flex-start;
  }

  .selector,
  .selector select {
    width: 100%;
  }

  .tablas-ranking {
    grid-template-columns: 1fr;
  }

  .tabla-card {
    overflow-x: auto;
  }
}

.ranking-amigos {
  margin-top: 2.5rem;
}

.amigos-titulo {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 1rem;
}

.amigo-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background-color: #fff;
  border-radius: 50px;
  padding: 0.6rem 1.2rem;
  margin-bottom: 0.5rem;
  color: #111;
}

.amigo-card--propio {
  background-color: #fef3d0;
}

.amigo-pos {
  font-size: 1rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.amigo-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #1a2340;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  color: #f0b429;
  flex-shrink: 0;
}

.amigo-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.amigo-nombre {
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.amigo-pts {
  font-size: 0.78rem;
  color: #666;
}

.vos-tag {
  font-size: 0.7rem;
  background-color: #f0b429;
  color: #050914;
  border-radius: 50px;
  padding: 1px 8px;
  font-weight: bold;
}
</style>
