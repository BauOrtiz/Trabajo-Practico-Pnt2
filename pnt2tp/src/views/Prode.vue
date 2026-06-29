<script setup>
import { computed, onMounted, ref } from 'vue'

import { obtenerPartidos } from '../services/partidosService'
import { obtenerEstadoPartido } from '../utils/estadoPartido.js'
import { obtenerBanderaUrl } from '../utils/banderas.js'

const partidos = ref([])
const predicciones = ref([])

const prediccionForm = ref({
  partidoId: '',
  golesLocal: 0,
  golesVisitante: 0
})

const prediccionEditandoId = ref(null)
const mensaje = ref('')

async function cargarPartidos() {
  const partidosData = await obtenerPartidos()

  partidos.value = partidosData.map((partido, index) => ({
    ...partido,
    id: partido.id || index + 1
  }))
}

const partidosDisponibles = computed(() => {
  return partidos.value.filter((partido) => partidoDisponible(partido))
})

function partidoDisponible(partido) {
  return obtenerEstadoPartido(partido) === 'programado'
}

function obtenerPartidoPorId(partidoId) {
  return partidos.value.find((partido) => String(partido.id) === String(partidoId))
}

function obtenerNombreLocal(partido) {
  return partido.equipoLocal || partido.local || partido.localId || ''
}

function obtenerNombreVisitante(partido) {
  return partido.equipoVisitante || partido.visitante || partido.visitanteId || ''
}

function seleccionarPartido(partido) {
  prediccionForm.value.partidoId = partido.id
}

function guardarEnLocalStorage() {
  localStorage.setItem('predicciones', JSON.stringify(predicciones.value))
}

function cargarDesdeLocalStorage() {
  const prediccionesGuardadas = localStorage.getItem('predicciones')

  if (prediccionesGuardadas) {
    predicciones.value = JSON.parse(prediccionesGuardadas)
  }
}

function limpiarFormulario() {
  prediccionForm.value = {
    partidoId: '',
    golesLocal: 0,
    golesVisitante: 0
  }

  prediccionEditandoId.value = null
}

function guardarPrediccion() {
  mensaje.value = ''

  const partido = obtenerPartidoPorId(prediccionForm.value.partidoId)

  if (!partido) {
    mensaje.value = 'Debe seleccionar un partido.'
    return
  }

  if (!partidoDisponible(partido)) {
    mensaje.value = 'No se puede predecir un partido ya iniciado o finalizado.'
    return
  }

  if (prediccionForm.value.golesLocal < 0 || prediccionForm.value.golesVisitante < 0) {
    mensaje.value = 'Los goles no pueden ser negativos.'
    return
  }

  if (prediccionEditandoId.value) {
    const prediccion = predicciones.value.find(
      (item) => item.id === prediccionEditandoId.value
    )

    if (prediccion) {
      prediccion.partidoId = prediccionForm.value.partidoId
      prediccion.golesLocal = Number(prediccionForm.value.golesLocal)
      prediccion.golesVisitante = Number(prediccionForm.value.golesVisitante)
    }

    mensaje.value = 'Predicción editada correctamente.'
  } else {
    const yaExistePrediccion = predicciones.value.some(
      (item) => String(item.partidoId) === String(prediccionForm.value.partidoId)
    )

    if (yaExistePrediccion) {
      mensaje.value = 'Ya existe una predicción para este partido.'
      return
    }

    const nuevaPrediccion = {
      id: Date.now(),
      partidoId: prediccionForm.value.partidoId,
      golesLocal: Number(prediccionForm.value.golesLocal),
      golesVisitante: Number(prediccionForm.value.golesVisitante)
    }

    predicciones.value.push(nuevaPrediccion)
    mensaje.value = 'Predicción guardada correctamente.'
  }

  guardarEnLocalStorage()
  limpiarFormulario()
}

function editarPrediccion(prediccion) {
  const partido = obtenerPartidoPorId(prediccion.partidoId)

  if (!partidoDisponible(partido)) {
    mensaje.value = 'No se puede editar una predicción de un partido ya iniciado o finalizado.'
    return
  }

  prediccionEditandoId.value = prediccion.id

  prediccionForm.value = {
    partidoId: prediccion.partidoId,
    golesLocal: prediccion.golesLocal,
    golesVisitante: prediccion.golesVisitante
  }

  mensaje.value = 'Editando predicción.'
}

function eliminarPrediccion(prediccion) {
  const partido = obtenerPartidoPorId(prediccion.partidoId)

  if (!partidoDisponible(partido)) {
    mensaje.value = 'No se puede eliminar una predicción de un partido ya iniciado o finalizado.'
    return
  }

  predicciones.value = predicciones.value.filter((item) => item.id !== prediccion.id)
  guardarEnLocalStorage()
  mensaje.value = 'Predicción eliminada correctamente.'
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

onMounted(async () => {
  cargarDesdeLocalStorage()
  await cargarPartidos()
})
</script>

<template>
  <section class="prode">
    <div class="encabezado">
      <div>
        <p class="subtitulo">Mundial 2026</p>
        <h1>Prode</h1>
        <p class="descripcion">
          Elegí un partido, cargá tu resultado y guardá tu predicción.
        </p>
      </div>
    </div>

    <form class="formulario" @submit.prevent="guardarPrediccion">
      <div class="bloque">
        <h2>Partidos disponibles</h2>

        <div v-if="partidosDisponibles.length === 0" class="sin-predicciones">
          No hay partidos disponibles para predecir.
        </div>

        <div v-else class="partidos-grid">
          <button
            v-for="partido in partidosDisponibles"
            :key="partido.id"
            type="button"
            class="partido-card"
            :class="{ seleccionado: String(prediccionForm.partidoId) === String(partido.id) }"
            @click="seleccionarPartido(partido)"
          >
            <div class="equipos">
              <div class="equipo">
                <img
                  class="bandera"
                  :src="obtenerBanderaUrl(obtenerNombreLocal(partido))"
                  :alt="obtenerNombreLocal(partido)"
                />
                <span>{{ obtenerNombreLocal(partido) }}</span>
              </div>

              <span class="versus">vs</span>

              <div class="equipo derecha">
                <span>{{ obtenerNombreVisitante(partido) }}</span>
                <img
                  class="bandera"
                  :src="obtenerBanderaUrl(obtenerNombreVisitante(partido))"
                  :alt="obtenerNombreVisitante(partido)"
                />
              </div>
            </div>

            <p class="fecha">
              {{ formatearFecha(partido.fecha) }}
            </p>
          </button>
        </div>
      </div>

      <div class="bloque resultado">
        <h2>Tu resultado</h2>

        <div class="goles">
          <div>
            <label for="golesLocal">Goles local</label>
            <input
              id="golesLocal"
              v-model.number="prediccionForm.golesLocal"
              type="number"
              min="0"
            />
          </div>

          <div>
            <label for="golesVisitante">Goles visitante</label>
            <input
              id="golesVisitante"
              v-model.number="prediccionForm.golesVisitante"
              type="number"
              min="0"
            />
          </div>
        </div>

        <div class="botones-formulario">
          <button type="submit" class="principal">
            {{ prediccionEditandoId ? 'Guardar cambios' : 'Guardar predicción' }}
          </button>

          <button
            v-if="prediccionEditandoId"
            type="button"
            class="secundario"
            @click="limpiarFormulario"
          >
            Cancelar edición
          </button>
        </div>
      </div>
    </form>

    <p v-if="mensaje" class="mensaje">
      {{ mensaje }}
    </p>

    <section class="mis-predicciones">
      <h2>Mis predicciones</h2>

      <div v-if="predicciones.length === 0" class="sin-predicciones">
        Todavía no cargaste predicciones.
      </div>

      <div v-else class="lista">
        <article
          v-for="prediccion in predicciones"
          :key="prediccion.id"
          class="card"
        >
          <template v-if="obtenerPartidoPorId(prediccion.partidoId)">
            <div class="card-header">
              <div class="equipos">
                <div class="equipo">
                  <img
                    class="bandera"
                    :src="obtenerBanderaUrl(obtenerNombreLocal(obtenerPartidoPorId(prediccion.partidoId)))"
                    :alt="obtenerNombreLocal(obtenerPartidoPorId(prediccion.partidoId))"
                  />
                  <span>
                    {{ obtenerNombreLocal(obtenerPartidoPorId(prediccion.partidoId)) }}
                  </span>
                </div>

                <span class="resultado-prediccion">
                  {{ prediccion.golesLocal }} - {{ prediccion.golesVisitante }}
                </span>

                <div class="equipo derecha">
                  <span>
                    {{ obtenerNombreVisitante(obtenerPartidoPorId(prediccion.partidoId)) }}
                  </span>
                  <img
                    class="bandera"
                    :src="obtenerBanderaUrl(obtenerNombreVisitante(obtenerPartidoPorId(prediccion.partidoId)))"
                    :alt="obtenerNombreVisitante(obtenerPartidoPorId(prediccion.partidoId))"
                  />
                </div>
              </div>

              <p class="fecha">
                {{ formatearFecha(obtenerPartidoPorId(prediccion.partidoId).fecha) }}
              </p>
            </div>

            <div class="acciones">
              <button type="button" class="editar" @click="editarPrediccion(prediccion)">
                Editar
              </button>

              <button type="button" class="eliminar" @click="eliminarPrediccion(prediccion)">
                Eliminar
              </button>
            </div>
          </template>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.prode {
  max-width: 980px;
  margin: 0 auto;
  padding: 2rem 1rem;
  color: #e5e7eb;
}

.encabezado {
  margin-bottom: 1.5rem;
}

.subtitulo {
  margin: 0 0 0.25rem;
  color: #60a5fa;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1 {
  margin: 0;
  font-size: 2.2rem;
  color: #f8fafc;
}

h2 {
  margin: 0 0 1rem;
  font-size: 1.2rem;
  color: #f8fafc;
}

.descripcion {
  margin: 0.5rem 0 0;
  color: #cbd5e1;
}

.formulario {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.bloque {
  padding: 1.25rem;
  border: 1px solid #334155;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.85);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.partidos-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.partido-card {
  width: 100%;
  padding: 0.9rem;
  border: 1px solid #334155;
  border-radius: 14px;
  background: #111827;
  color: #e5e7eb;
  cursor: pointer;
  text-align: left;
  transition: 0.2s ease;
}

.partido-card:hover {
  border-color: #60a5fa;
  transform: translateY(-1px);
}

.partido-card.seleccionado {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.18);
}

.equipos {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.equipo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
  font-weight: 700;
}

.equipo span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equipo.derecha {
  justify-content: flex-end;
  text-align: right;
}

.bandera {
  width: 32px;
  height: 22px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #475569;
  background-color: #f8fafc;
}

.versus {
  color: #93c5fd;
  font-weight: 800;
  font-size: 0.85rem;
}

.fecha {
  margin: 0.65rem 0 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.resultado {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.goles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.goles div {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

label {
  color: #cbd5e1;
  font-weight: 700;
  font-size: 0.9rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #475569;
  border-radius: 12px;
  background: #020617;
  color: #f8fafc;
  font-size: 1rem;
  outline: none;
}

input:focus {
  border-color: #60a5fa;
}

.botones-formulario {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

button {
  font-family: inherit;
}

.principal,
.secundario,
.editar,
.eliminar {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: white;
  font-weight: 700;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #64748b;
}

.editar {
  background: #2563eb;
}

.eliminar {
  background: #dc2626;
}

.principal:hover,
.secundario:hover,
.editar:hover,
.eliminar:hover {
  opacity: 0.9;
}

.mensaje {
  padding: 0.85rem 1rem;
  border: 1px solid #334155;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.9);
  color: #dbeafe;
}

.mis-predicciones {
  margin-top: 2rem;
}

.sin-predicciones {
  padding: 1rem;
  border: 1px dashed #475569;
  border-radius: 14px;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.65);
}

.lista {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  padding: 1rem;
  border: 1px solid #334155;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.9);
}

.card-header {
  margin-bottom: 1rem;
}

.resultado-prediccion {
  min-width: 70px;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: #2563eb;
  color: white;
  font-weight: 800;
  text-align: center;
}

.acciones {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

@media (max-width: 800px) {
  .formulario {
    grid-template-columns: 1fr;
  }

  .equipos {
    align-items: stretch;
  }

  .goles {
    grid-template-columns: 1fr;
  }
}
</style>