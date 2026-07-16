<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEstaticoStore } from '../stores/storeEstaticos'

// --- 🧭 1. ENRUTADOR Y STORES ---
const route = useRoute()                 // Permite capturar los parámetros variables de la URL actual
const estaticoStore = useEstaticoStore() // Store de Pinia con la info cargada del Mundial

// paisId: Extrae de forma reactiva el código del país (ej: 'ARG', 'BRA') que viene en la ruta de navegación
const paisId = computed(() => route.params.id)

// --- 🚀 2. CICLO DE VIDA (INICIALIZACIÓN) ---
onMounted(async () => {
  // Asegura que los datos globales del mundial se encuentren en memoria al cargar este componente
  await estaticoStore.cargarDatosMundial()
})

// --- 📊 3. PROPIEDADES COMPUTADAS (REACTIVAS) ---

// cargando: Evalúa si se están pidiendo los datos al servidor y el listado de selecciones en el store sigue vacío
const cargando = computed(() => estaticoStore.loading && estaticoStore.selecciones.length === 0)

// pais: Busca y retorna la selección que coincida con el ID de la ruta
const pais = computed(() => {
  // Protección: si el store aún no tiene datos cargados, frena la búsqueda para evitar errores
  if (!estaticoStore.selecciones || estaticoStore.selecciones.length === 0) {
    return null
  }
  // Utiliza el método del store para recuperar los datos específicos del país seleccionado
  return estaticoStore.obtenerSeleccionPorId(paisId.value)
})

// error: Controla y expone fallas del servicio o si el ID de la URL es inexistente en el JSON de Mockachino
const error = computed(() => {
  // Caso A: El store reporta un error de conexión al traer la información de las selecciones
  if (estaticoStore.errores.selecciones) {
    return estaticoStore.errores.selecciones
  }
  // Caso B: El sistema terminó de cargar de manera exitosa pero la ID no existe en la base de datos
  if (estaticoStore.cargado && !pais.value) {
    return 'No se encontró el país en la base de datos.'
  }
  return ''
})
</script>

<template>
  <section class="detalle-pais">
    <!-- ⚠️ CASO A: Ocurrió un error y mostramos el mensaje de advertencia -->
    <p v-if="error" class="mensaje">{{ error }}</p>

    <!-- ⏳ CASO B: El componente está esperando la respuesta del store/API -->
    <p v-else-if="cargando || !pais" class="mensaje">Cargando país...</p>

    <!-- ✅ CASO C: Datos del país listos y listos para mostrar -->
    <template v-else>
      
      <!-- 🏳️ ENCABEZADO: Información principal del País y su bandera -->
      <div class="encabezado">
        <!-- Renderiza la bandera del país solo si la URL de la imagen existe -->
        <img 
          v-if="pais.bandera" 
          :src="pais.bandera" 
          :alt="`Bandera de ${pais.nombre}`"
          class="bandera"
        >

        <div>
          <!-- Muestra el nombre del país. Si viene vacío, usa como plan de contingencia el ID -->
          <h1>{{ pais.nombre ?? pais.id }}</h1>
          <p><strong>Código:</strong> {{ pais.id }}</p>
          <p v-if="pais.grupo"><strong>Grupo:</strong> {{ pais.grupo }}</p>
        </div>
      </div>

      <hr>

      <!-- 👔 CUERPO TÉCNICO: Información del Entrenador -->
      <h2>Director técnico</h2>

      <!-- Si el país tiene cargada información del entrenador, la renderiza -->
      <div v-if="pais.entrenador" class="card">
        <p><strong>Nombre:</strong> {{ pais.entrenador.nombre }}</p>
        <p v-if="pais.entrenador.nacionalidad">
          <strong>Nacionalidad:</strong> {{ pais.entrenador.nacionalidad }}
        </p>
      </div>

      <!-- Plan B: Si no hay cuerpo técnico en el JSON -->
      <p v-else>
        No hay director técnico cargado.
      </p>

      <hr>

      <!-- 🏃 PLANTEL: Lista completa de jugadores -->
      <h2>Jugadores</h2>

      <!-- Recorre e itera en tarjetas individuales cada uno de los jugadores registrados -->
      <div v-if="pais.jugadores && pais.jugadores.length > 0" class="jugadores">
        <div 
          v-for="jugador in pais.jugadores" 
          :key="jugador.nombre"
          class="card"
        >
          <h3>{{ jugador.nombre }}</h3>
          <p v-if="jugador.posicion">
            <strong>Posición:</strong> {{ jugador.posicion }}
          </p>
          <p v-if="jugador.club">
            <strong>Club:</strong> {{ jugador.club }}
          </p>
        </div>
      </div>

      <!-- Plan B: Si no hay jugadores registrados en el plantel -->
      <p v-else>
        No hay jugadores cargados.
      </p>
    </template>
  </section>
</template>

<style scoped>
.detalle-pais {
  padding: 24px;
}

.mensaje {
  color: #e5e7eb;
  text-align: center;
}

.encabezado {
  display: flex;
  align-items: center;
  gap: 24px;
}

.bandera {
  width: 120px;
  height: auto;
  border: 1px solid #ccc;
}

h1 {
  margin-bottom: 12px;
}

h2 {
  margin-top: 24px;
  margin-bottom: 12px;
}

hr {
  margin: 24px 0;
}

.jugadores {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  min-width: 220px;
}

.card h3 {
  margin-top: 0;
  margin-bottom: 12px;
}
</style>
