<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/storeAuth'
import { useEstaticoStore } from '../stores/storeEstaticos'
import { obtenerBanderaUrl } from '../utils/banderas.js'
import { obtenerEstadoPartido } from '../utils/estadoPartido.js'

const authStore = useAuthStore()
const estaticoStore = useEstaticoStore()

const partidoId = ref('')
const fechaSeleccionada = ref('')
const mensaje = ref('')

const partidos = computed(() => {
  return [...estaticoStore.partidos].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  )
})

const partidoSeleccionado = computed(() => {
  return estaticoStore.obtenerPartidoPorId(partidoId.value)
})

const cargando = computed(() => estaticoStore.loading && estaticoStore.partidos.length === 0)
const error = computed(() => estaticoStore.errores.partidos || '')
const finalizandoGrupos = ref(false)

watch(
  partidos,
  (partidosDisponibles) => {
    if (!partidoId.value && partidosDisponibles.length > 0) {
      partidoId.value = partidosDisponibles[0].id
    }
  },
  { immediate: true }
)

function crearFechaConHoraActual(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const ahora = new Date()

  return new Date(
    anio,
    mes - 1,
    dia,
    ahora.getHours(),
    ahora.getMinutes(),
    ahora.getSeconds()
  ).toISOString()
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

function guardarFecha() {
  mensaje.value = ''

  if (!authStore.isAdmin) {
    mensaje.value = 'Solo los administradores pueden modificar el calendario.'
    return
  }

  if (!partidoSeleccionado.value) {
    mensaje.value = 'Seleccioná un partido.'
    return
  }

  if (!fechaSeleccionada.value) {
    mensaje.value = 'Seleccioná una fecha.'
    return
  }

  const nuevaFecha = crearFechaConHoraActual(fechaSeleccionada.value)
  estaticoStore.actualizarFechaPartido(partidoSeleccionado.value.id, nuevaFecha)

  mensaje.value = `Fecha actualizada: ${formatearFecha(nuevaFecha)}.`
  fechaSeleccionada.value = ''
}

async function restaurarCalendario() {
  if (!authStore.isAdmin) {
    mensaje.value = 'Solo los administradores pueden restaurar el calendario.'
    return
  }

  await estaticoStore.restaurarFechasPartidos()
  mensaje.value = 'Calendario restaurado a las fechas originales.'
}

function revertirPartidoSeleccionado() {
  mensaje.value = ''

  if (!authStore.isAdmin) {
    mensaje.value = 'Solo los administradores pueden revertir cambios.'
    return
  }

  if (!partidoSeleccionado.value) {
    mensaje.value = 'Seleccioná un partido.'
    return
  }

  estaticoStore.revertirFechaPartido(partidoSeleccionado.value.id)
  mensaje.value = 'Cambio revertido para el partido seleccionado.'
}

async function finalizarFaseGrupos() {
  mensaje.value = ''

  if (!authStore.isAdmin) {
    mensaje.value = 'Solo los administradores pueden finalizar la fase de grupos.'
    return
  }

  finalizandoGrupos.value = true

  try {
    await estaticoStore.finalizarPartidosFaseGrupos()
    partidoId.value = estaticoStore.partidos[0]?.id || ''
    mensaje.value = 'Fase de grupos finalizada. Ya se muestran los partidos eliminatorios.'
  } catch {
    mensaje.value = 'La fase de grupos se finalizó, pero no se pudieron cargar las eliminatorias.'
  } finally {
    finalizandoGrupos.value = false
  }
}

function restablecerFaseGrupos() {
  mensaje.value = ''

  if (!authStore.isAdmin) {
    mensaje.value = 'Solo los administradores pueden restablecer la fase de grupos.'
    return
  }

  estaticoStore.restablecerFaseGrupos()
  partidoId.value = estaticoStore.partidos[0]?.id || ''
  mensaje.value = 'Fase de grupos restablecida correctamente.'
}

onMounted(() => {
  estaticoStore.cargarDatosMundial()
})
</script>

<template>
  <main class="admin-page">
    <section class="encabezado">
      <div>
        <p class="subtitulo">Administración</p>
        <h1>Calendario de partidos</h1>
        <p>
          Adelantá o posponé un partido. La fecha la elegís vos y la hora se toma del momento actual.
        </p>
      </div>
    </section>

    <section v-if="!authStore.isAdmin" class="mensaje error">
      Esta sección está disponible solo para administradores.
    </section>

    <section v-else-if="cargando" class="mensaje">
      Cargando partidos...
    </section>

    <section v-else-if="error" class="mensaje error">
      {{ error }}
    </section>

    <section v-else class="panel-admin">
      <div v-if="!estaticoStore.faseGruposFinalizada" class="accion-fase">
        <div>
          <h2>Finalizar fase de grupos</h2>
          <p>
            Marca todos los partidos de grupos como finalizados y habilita las eliminatorias.
          </p>
        </div>

        <button
          type="button"
          class="finalizar-fase"
          :disabled="finalizandoGrupos"
          @click="finalizarFaseGrupos"
        >
          {{ finalizandoGrupos ? 'Finalizando...' : 'Finalizar todos los partidos' }}
        </button>
      </div>

      <div v-if="estaticoStore.gruposFinalizadosPorAdmin" class="accion-fase accion-fase--restablecer">
        <div>
          <h2>Restablecer fase de grupos</h2>
          <p>
            Recupera los estados originales y vuelve a mostrar los partidos de grupos.
          </p>
        </div>

        <button
          type="button"
          class="restablecer-fase"
          @click="restablecerFaseGrupos"
        >
          Restablecer fase de grupos
        </button>
      </div>

      <form class="formulario" @submit.prevent="guardarFecha">
        <label for="partido">Partido</label>
        <select id="partido" v-model="partidoId">
          <option
            v-for="partido in partidos"
            :key="partido.id"
            :value="partido.id"
          >
            {{ partido.equipoLocal }} vs {{ partido.equipoVisitante }} -
            {{ formatearFecha(partido.fecha) }}
          </option>
        </select>

        <label for="fecha">Nueva fecha</label>
        <input id="fecha" v-model="fechaSeleccionada" type="date" />

        <div v-if="partidoSeleccionado" class="partido-card">
          <div class="equipos">
            <div class="equipo">
              <img
                :src="obtenerBanderaUrl(partidoSeleccionado.equipoLocal)"
                :alt="partidoSeleccionado.equipoLocal"
              />
              <span>{{ partidoSeleccionado.equipoLocal }}</span>
            </div>

            <strong>VS</strong>

            <div class="equipo derecha">
              <span>{{ partidoSeleccionado.equipoVisitante }}</span>
              <img
                :src="obtenerBanderaUrl(partidoSeleccionado.equipoVisitante)"
                :alt="partidoSeleccionado.equipoVisitante"
              />
            </div>
          </div>

          <p>Fecha actual: {{ formatearFecha(partidoSeleccionado.fecha) }}</p>
          <p>Estado: {{ obtenerEstadoPartido(partidoSeleccionado) }}</p>
          <p v-if="partidoSeleccionado.fechaModificadaPorAdmin" class="admin-tag">
            Modificado por administrador
          </p>
        </div>

        <button type="submit" class="principal">
          Aplicar cambio
        </button>

        <button
          v-if="partidoSeleccionado?.fechaModificadaPorAdmin"
          type="button"
          class="advertencia"
          @click="revertirPartidoSeleccionado"
        >
          Revertir cambio de este partido
        </button>

        <button type="button" class="secundario" @click="restaurarCalendario">
          Restaurar calendario original
        </button>
      </form>

      <p v-if="mensaje" class="mensaje resultado">
        {{ mensaje }}
      </p>
    </section>
  </main>
</template>

<style scoped>
.admin-page {
  max-width: 920px;
  min-height: calc(100vh - 80px);
  margin: 0 auto;
  padding: 32px 20px;
  color: white;
}

.encabezado {
  margin-bottom: 24px;
}

.subtitulo {
  margin: 0 0 6px;
  color: #93c5fd;
  font-weight: 800;
  text-transform: uppercase;
}

.encabezado h1 {
  margin: 0;
  font-size: 32px;
}

.encabezado p {
  margin: 8px 0 0;
  color: #cbd5e1;
}

.panel-admin {
  display: grid;
  gap: 16px;
}

.accion-fase {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  border: 1px solid #92400e;
  border-radius: 8px;
  background: #451a03;
}

.accion-fase h2 {
  margin: 0 0 6px;
  font-size: 1.15rem;
}

.accion-fase p {
  margin: 0;
  color: #fed7aa;
}

.finalizar-fase {
  flex-shrink: 0;
  padding: 12px 14px;
  border: 0;
  border-radius: 8px;
  color: white;
  background: #c2410c;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.finalizar-fase:disabled {
  cursor: wait;
  opacity: 0.65;
}

.accion-fase--restablecer {
  border-color: #1d4ed8;
  background: #172554;
}

.accion-fase--restablecer p {
  color: #bfdbfe;
}

.restablecer-fase {
  flex-shrink: 0;
  padding: 12px 14px;
  border: 0;
  border-radius: 8px;
  color: white;
  background: #2563eb;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.formulario {
  display: grid;
  gap: 12px;
  padding: 20px;
  border: 1px solid #374151;
  border-radius: 8px;
  background: #1f2937;
}

label {
  color: #dbeafe;
  font-weight: 700;
}

select,
input {
  width: 100%;
  padding: 12px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  color: white;
  background: #111827;
  font: inherit;
}

.partido-card {
  padding: 16px;
  border: 1px solid #334155;
  border-radius: 8px;
  background: #111827;
}

.equipos {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

.equipo {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-weight: 800;
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

.equipo img {
  width: 32px;
  height: 22px;
  object-fit: cover;
  border-radius: 4px;
}

.partido-card p {
  margin: 10px 0 0;
  color: #cbd5e1;
}

.admin-tag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  color: #dbeafe;
  background: #2563eb;
  font-size: 0.8rem;
  font-weight: 800;
}

.principal,
.secundario,
.advertencia {
  padding: 12px 14px;
  border: 0;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #64748b;
}

.advertencia {
  background: #b45309;
}

.mensaje {
  padding: 16px;
  border-radius: 8px;
  background: #1f2937;
  color: #e5e7eb;
  text-align: center;
}

.mensaje.error {
  background: #7f1d1d;
}

.mensaje.resultado {
  text-align: left;
}

@media (max-width: 640px) {
  .accion-fase {
    align-items: stretch;
    flex-direction: column;
  }

  .equipos {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .equipo,
  .equipo.derecha {
    justify-content: center;
    text-align: center;
  }
}
</style>
