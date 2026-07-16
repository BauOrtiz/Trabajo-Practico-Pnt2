<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEstaticoStore } from '../stores/storeEstaticos'

// --- 🧭 1. CONEXIÓN CON ENRUTADOR Y STORE ---
const router = useRouter()               // Enrutador de Vue para navegar entre vistas programáticamente
const estaticoStore = useEstaticoStore() // Store global de Pinia con la información de las selecciones en memoria

// --- 🧭 2. NAVEGACIÓN ---
/**
 * Redirige al usuario a la pantalla detallada de la selección haciendo clic en su tarjeta
 * @param {string|number} id - Código identificador único del país (ej: 'ARG', 'BRA')
 */
function irDetalle(id) {
  router.push(`/paises/${id}`)
}

// --- 📊 3. PROPIEDADES COMPUTADAS (REACTIVAS) ---

// cargando: Evalúa si los datos de la API se están solicitando y la lista local en el store sigue vacía
const cargando = computed(() => estaticoStore.loading && estaticoStore.selecciones.length === 0)

// error: Captura de manera reactiva cualquier fallo de conexión al traer las selecciones
const error = computed(() => estaticoStore.errores.selecciones || '')

// --- 🚀 4. INICIALIZACIÓN ---
onMounted(async () => {
  // Al montar la pantalla, aseguramos que los datos estáticos del mundial (las selecciones incluidas) estén en memoria
  await estaticoStore.cargarDatosMundial()
})
</script>

<template>
  <div class="paises-page">
    <h1>Selecciones</h1>

    <!-- ⏳ CASO 1: Los datos todavía se están cargando desde la API -->
    <section v-if="cargando" class="mensaje">
      Cargando equipos...
    </section>

    <!-- ⚠️ CASO 2: Error al intentar cargar los equipos desde el servidor de Mockachino -->
    <section v-else-if="error" class="mensaje mensaje--error">
      {{ error }}
    </section>

    <!-- ✅ CASO 3: Todo perfecto, renderiza el listado general de selecciones -->
    <section v-else class="listado">
      <!-- 
        Itera sobre el array de selecciones guardado en Pinia.
        Por cada elemento (seleccion), dibuja una tarjeta interactiva con su evento @click
      -->
      <article
        v-for="seleccion in estaticoStore.selecciones"
        :key="seleccion.id"
        class="card"
        @click="irDetalle(seleccion.id)"
      >
        <!-- Indica el grupo de la fase de clasificación al que pertenece la selección -->
        <div class="grupo">Grupo {{ seleccion.grupo }}</div>

        <!-- Renderiza de forma dinámica la bandera del país -->
        <img
          :src="seleccion.bandera"
          :alt="seleccion.nombre"
          class="bandera"
        />

        <!-- Nombre de la selección nacional -->
        <h3>{{ seleccion.nombre }}</h3>
      </article>
    </section>
  </div>
</template>

<style scoped>
.paises-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 40px;
  color: white;
}

.paises-page h1 {
  margin: 0 0 24px;
}

.mensaje {
  padding: 24px;
  text-align: center;
  border-radius: 12px;
  background-color: #1f2937;
  color: #e5e7eb;
}

.mensaje--error {
  background-color: #7f1d1d;
  color: white;
}

.listado {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.card {
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 8px;
  width: 150px;
  text-align: center;
  background: white;
  color: #111827;
  cursor: pointer;
}

.grupo {
  font-weight: bold;
  margin-bottom: 10px;
}

.bandera {
  width: 60px;
  height: auto;
  border: 1px solid #eee;
}

.card h3 {
  margin: 10px 0 5px;
}
</style>
