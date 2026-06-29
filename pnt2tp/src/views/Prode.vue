<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/storeAuth'
import { guardarPredicciones, obtenerPredicciones } from '../services/prediccionesService'
import { useEstaticoStore } from '../stores/storeEstaticos'
import { obtenerEstadoPartido } from '../utils/estadoPartido.js'

const estaticoStore = useEstaticoStore()
const predicciones = ref([])
const authStore = useAuthStore()

const prediccionForm = ref({
  partidoId: '',
  golesLocal: 0,
  golesVisitante: 0
})

const prediccionEditandoId = ref(null)
const mensaje = ref('')

const partidos = computed(() => estaticoStore.partidos)
const cargando = computed(() => estaticoStore.loading && partidos.value.length === 0)
const errorCarga = computed(() => estaticoStore.errores.partidos || '')

const partidosDisponibles = computed(() => {
  return partidos.value.filter((partido) => partidoDisponible(partido))
})

function partidoDisponible(partido) {
  return obtenerEstadoPartido(partido) === 'programado'
}

function obtenerPartidoPorId(partidoId) {
  return estaticoStore.obtenerPartidoPorId(partidoId)
}

function cargarDesdeLocalStorage() {
  predicciones.value = obtenerPredicciones(authStore.user?.id)
}

watch(
  () => authStore.user?.id,
  () => {
    cargarDesdeLocalStorage()
    limpiarFormulario()
    mensaje.value = ''
  }
)

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

  if (!authStore.user?.id) {
    mensaje.value = 'Debe iniciar sesion para guardar una prediccion.'
    return
  }

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

    mensaje.value = 'Prediccion editada correctamente.'
  } else {
    const yaExistePrediccion = predicciones.value.some(
      (item) => String(item.partidoId) === String(prediccionForm.value.partidoId)
    )

    if (yaExistePrediccion) {
      mensaje.value = 'Ya existe una prediccion para este partido.'
      return
    }

    predicciones.value.push({
      id: Date.now(),
      partidoId: prediccionForm.value.partidoId,
      golesLocal: Number(prediccionForm.value.golesLocal),
      golesVisitante: Number(prediccionForm.value.golesVisitante)
    })

    mensaje.value = 'Prediccion guardada correctamente.'
  }

  guardarPredicciones(predicciones.value, authStore.user.id)
  limpiarFormulario()
}

function editarPrediccion(prediccion) {
  const partido = obtenerPartidoPorId(prediccion.partidoId)

  if (!partido || !partidoDisponible(partido)) {
    mensaje.value = 'No se puede editar una prediccion de un partido ya iniciado o finalizado.'
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

  if (!partido || !partidoDisponible(partido)) {
    mensaje.value = 'No se puede eliminar una prediccion de un partido ya iniciado o finalizado.'
    return
  }

  predicciones.value = predicciones.value.filter((item) => item.id !== prediccion.id)
  guardarPredicciones(predicciones.value, authStore.user.id)
  mensaje.value = 'Prediccion eliminada correctamente.'
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

onMounted(() => {
  cargarDesdeLocalStorage()
  estaticoStore.cargarDatosMundial()
})
</script>

<template>
  <section class="prode">
    <h1>Prode</h1>

    <p class="descripcion">
      Carga tus predicciones para los partidos disponibles.
    </p>

    <div v-if="cargando" class="estado-vista">
      Cargando partidos...
    </div>

    <div v-else-if="errorCarga" class="estado-vista estado-vista--error">
      {{ errorCarga }}
    </div>

    <template v-else>
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
          {{ prediccionEditandoId ? 'Guardar cambios' : 'Guardar prediccion' }}
        </button>

        <button
          v-if="prediccionEditandoId"
          type="button"
          class="secundario"
          @click="limpiarFormulario"
        >
          Cancelar edicion
        </button>
      </form>

      <p v-if="mensaje" class="mensaje">
        {{ mensaje }}
      </p>

      <h2>Mis predicciones</h2>

      <div v-if="predicciones.length === 0" class="sin-predicciones">
        Todavia no cargaste predicciones.
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
              Prediccion:
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
    </template>
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

.estado-vista {
  padding: 1rem;
  border-radius: 12px;
  background: #1f2937;
  color: #e5e7eb;
  text-align: center;
}

.estado-vista--error {
  background: #7f1d1d;
  color: white;
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
