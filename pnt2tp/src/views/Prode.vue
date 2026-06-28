<script setup>
import { computed, onMounted, ref } from 'vue'

import { obtenerPartidos } from '../services/partidosService'
import {guardarPredicciones, obtenerPredicciones } from '../services/prediccionesService'
import { obtenerEstadoPartido } from '../utils/estadoPartido.js'

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
  partidos.value = await obtenerPartidos()
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

function cargarDesdeLocalStorage() {
  predicciones.value = obtenerPredicciones()
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

  guardarPredicciones(predicciones.value)
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
}

function eliminarPrediccion(prediccion) {
  const partido = obtenerPartidoPorId(prediccion.partidoId)

  if (!partidoDisponible(partido)) {
    mensaje.value = 'No se puede eliminar una predicción de un partido ya iniciado o finalizado.'
    return
  }

  predicciones.value = predicciones.value.filter((item) => item.id !== prediccion.id)
  guardarPredicciones(predicciones.value)
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
    <h1>Prode</h1>

    <p class="descripcion">
      Cargá tus predicciones para los partidos disponibles.
    </p>

    <form class="formulario" @submit.prevent="guardarPrediccion">
      <label for="partido">Partido</label>
      <select id="partido" v-model="prediccionForm.partidoId">
        <option value="">Seleccione un partido</option>

        <option
          v-for="partido in partidosDisponibles"
          :key="partido.id"
          :value="partido.id"
        >
          {{ partido.equipoLocal }} vs {{ partido.equipoVisitante }} -
          {{ formatearFecha(partido.fecha) }}
        </option>
      </select>

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

      <button type="submit">
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
    </form>

    <p v-if="mensaje" class="mensaje">
      {{ mensaje }}
    </p>

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
          <h3>
            {{ obtenerPartidoPorId(prediccion.partidoId).equipoLocal }}
            vs
            {{ obtenerPartidoPorId(prediccion.partidoId).equipoVisitante }}
          </h3>

          <p>
            Fecha:
            {{ formatearFecha(obtenerPartidoPorId(prediccion.partidoId).fecha) }}
          </p>

          <p>
            Predicción:
            {{ prediccion.golesLocal }} - {{ prediccion.golesVisitante }}
          </p>

          <div class="acciones">
            <button type="button" @click="editarPrediccion(prediccion)">
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
</template>

<style scoped>
.prode {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.descripcion {
  margin-bottom: 1rem;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.formulario label {
  font-weight: bold;
}

.formulario input,
.formulario select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.goles {
  display: flex;
  gap: 1rem;
}

.goles div {
  display: flex;
  flex-direction: column;
  flex: 1;
}

button {
  padding: 0.6rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background-color: #1e90ff;
  color: white;
}

button:hover {
  opacity: 0.9;
}

.secundario {
  background-color: #777;
}

.eliminar {
  background-color: #c0392b;
}

.mensaje {
  padding: 0.75rem;
  border-radius: 8px;
  background-color: #f1f1f1;
}

.sin-predicciones {
  padding: 1rem;
  border: 1px dashed #ccc;
  border-radius: 12px;
}

.lista {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 12px;
}

.acciones {
  display: flex;
  gap: 0.5rem;
}
</style>
