<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/storeAuth'
import { useEstaticoStore } from '../stores/storeEstaticos'

// --- 🛠️ 1. INICIALIZACIÓN DE STORES ---
const authStore = useAuthStore()       // Store de autenticación (valida roles como "Admin")
const estaticoStore = useEstaticoStore() // Store global de datos del mundial

// --- 📍 2. ESTADOS REACTIVOS LOCALES ---
const mensaje = ref('')              // Mensaje de éxito o error para las acciones de grupos
const finalizandoGrupos = ref(false) // Bandera visual para deshabilitar botones durante procesos asíncronos

// --- 📊 3. PROPIEDADES COMPUTADAS (REACTIVAS) ---

// cargando: Determina si el sistema está trayendo los datos y la lista de partidos todavía está vacía
const cargando = computed(() => estaticoStore.loading && estaticoStore.partidos.length === 0)

// error: Captura y expone cualquier error que ocurra al intentar cargar los partidos desde el Store
const error = computed(() => estaticoStore.errores.partidos || '')

// --- ⚙️ 4. FUNCIONES DE NEGOCIO (FASE DE GRUPOS) ---

/**
 * Cierra de golpe toda la Fase de Grupos. 
 * Fuerza que todos los partidos de grupos pasen a estado "finalizado" y calcula las llaves de eliminatorias.
 */
async function finalizarFaseGrupos() {
  mensaje.value = ''
  if (!authStore.isAdmin) {
    mensaje.value = 'Solo los administradores pueden finalizar la fase de grupos.'
    return
  }
  
  finalizandoGrupos.value = true // Deshabilita el botón mientras procesa
  try {
    // Mandamos la orden al store para simular la finalización masiva
    await estaticoStore.finalizarPartidosFaseGrupos()
    mensaje.value = 'Fase de grupos finalizada. Ya se muestran los partidos eliminatorios.'
  } catch {
    mensaje.value = 'La fase de grupos se finalizó, pero no se pudieron cargar las eliminatorias.'
  } finally {
    finalizandoGrupos.value = false // Liberamos el botón
  }
}

/**
 * Restablece los partidos a la fase de grupos inicial, borrando las llaves y reabriendo los grupos
 */
function restablecerFaseGrupos() {
  mensaje.value = ''
  if (!authStore.isAdmin) {
    mensaje.value = 'Solo los administradores pueden restablecer la fase de grupos.'
    return
  }
  
  estaticoStore.restablecerFaseGrupos()
  mensaje.value = 'Fase de grupos restablecida correctamente.'
}

// --- 🚀 5. CICLOS DE VIDA (LIFECYCLE HOOKS) ---
onMounted(async () => {
  // Aseguramos la carga de los partidos y estadios al montar la pantalla
  await estaticoStore.cargarDatosMundial()
})
</script>

<template>
  <!-- 
    ========================================================================
    🛠️ SECCIÓN 1: PANEL DE FECHA VIRTUAL (MÁQUINA DEL TIEMPO)
    ========================================================================
  -->
  <div class="panel-admin" style="background: #0f172a; color: white; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1.5px solid #10b981;">
    <h3 style="margin-top: 0; color: #10b981; display: flex; align-items: center; gap: 8px;">
      ⚙️ Panel de Control - Admin
    </h3>
    <p style="font-size: 14px; margin: 4px 0 12px 0; color: #94a3b8;">
      Mové la fecha del sistema para simular qué partidos están programados, jugándose o finalizados.
    </p>

    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
      <div>
        <label style="display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px;">FECHA VIRTUAL ACTUAL</label>
        <input 
          type="datetime-local" 
          :value="new Date(estaticoStore.fechaAdmin.getTime() - estaticoStore.fechaAdmin.getTimezoneOffset() * 60000).toISOString().slice(0, 16)"
          @input="e => estaticoStore.actualizarFechaAdmin(e.target.value)"
          style="padding: 8px 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold;" 
        />
      </div>

      <div style="align-self: flex-end; display: flex; gap: 8px;">
        <button @click="estaticoStore.actualizarFechaAdmin(new Date())" style="padding: 8px 14px; border-radius: 8px; background: #334155; color: white; border: none; cursor: pointer; font-weight: 500;" >
          ⏰ Resetear a Hoy
        </button>
        <button @click="estaticoStore.actualizarFechaAdmin('2026-06-11T16:00')" style="padding: 8px 14px; border-radius: 8px; background: #2563eb; color: white; border: none; cursor: pointer; font-weight: 500;" >
          ⚽ Fase de Grupos
        </button>
      </div>
    </div>
  </div>

  <!-- 
    ========================================================================
    📅 SECCIÓN 2: CONTROL GLOBAL DE LA FASE DE GRUPOS
    ========================================================================
  -->
  <main class="admin-page">
    <section v-if="authStore.isAdmin" class="encabezado">
      <div>
        <p class="subtitulo">Administración</p>
        <h1>Calendario de partidos</h1>
        <p>
          Simulá el avance del torneo finalizando de golpe los grupos o restableciendo el fixture para comenzar de cero.
        </p>
      </div>
    </section>

    <!-- 🛡️ Bloqueo si el usuario logueado no es administrador -->
    <section v-if="!authStore.isAdmin" class="mensaje error">
      Esta sección está disponible solo para administradores.
    </section>

    <!-- Estados de carga y error tradicionales -->
    <section v-else-if="cargando" class="mensaje">
      Cargando partidos...
    </section>
    <section v-else-if="error" class="mensaje error">
      {{ error }}
    </section>

    <!-- Panel de administración principal -->
    <section v-else class="panel-admin">
      
      <!-- Bloque para finalizar la Fase de Grupos de golpe -->
      <div v-if="!estaticoStore.faseGruposFinalizada" class="accion-fase">
        <div>
          <h2>Finalizar fase de grupos</h2>
          <p>
            Marca todos los partidos de grupos como finalizados y habilita las eliminatorias.
          </p>
        </div>
        <button type="button" class="finalizar-fase" :disabled="finalizandoGrupos" @click="finalizarFaseGrupos" >
          {{ finalizandoGrupos ? 'Finalizando...' : 'Finalizar todos los partidos' }}
        </button>
      </div>

      <!-- Bloque para restablecer todo a fase de grupos de nuevo (Solo si ya se finalizó) -->
      <div v-if="estaticoStore.gruposFinalizadosPorAdmin" class="accion-fase accion-fase--restablecer">
        <div>
          <h2>Restablecer fase de grupos</h2>
          <p>
            Recupera los estados originales y vuelve a mostrar los partidos de grupos.
          </p>
        </div>
        <button type="button" class="restablecer-fase" @click="restablecerFaseGrupos" >
          Restablecer fase de grupos
        </button>
      </div>

      <!-- Cartelera para reportar el feedback del resultado de las acciones del Administrador -->
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
}
</style>