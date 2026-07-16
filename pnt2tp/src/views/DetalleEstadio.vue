<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEstaticoStore } from '../stores/storeEstaticos'

// --- ⚙️ 1. NAVEGACIÓN Y CONFIGURACIÓN ---
const route = useRoute()   // Permite acceder a los parámetros de la URL actual (ej: route.params.id)
const router = useRouter() // Permite forzar la navegación programada (ej: redirigir a otra pestaña)
const estaticoStore = useEstaticoStore() // Store global de Pinia para consultar estadios cargados

// estadioId: Computada reactiva que extrae el ID del estadio directamente de la URL actual
const estadioId = computed(() => route.params.id)

// --- 🚀 2. CICLO DE VIDA ---
onMounted(async () => {
  // Garantiza que la información estática del mundial (incluidos los estadios) esté en memoria al abrir la página
  await estaticoStore.cargarDatosMundial()
})

// --- 📊 3. PROPIEDADES COMPUTADAS (REACTIVAS) ---

// cargando: Determina si el backend está trayendo datos del servidor y la lista local de estadios sigue vacía
const cargando = computed(() => estaticoStore.loading && estaticoStore.estadios.length === 0)

// estadio: Busca el objeto del estadio que coincide con el ID de la URL
const estadio = computed(() => {
  // Seguridad básica: si no hay estadios en el store, no intenta buscar nada para evitar errores en consola
  if (!estaticoStore.estadios || estaticoStore.estadios.length === 0) {
    return null
  }
  // Invoca el helper del store para obtener el objeto limpio del estadio seleccionado
  return estaticoStore.obtenerEstadioPorId(estadioId.value)
})

// error: Gestiona la visualización de fallas. Captura errores de red del store o reacciona 
// si el id del estadio de la url no existe en la base de datos de Mockachino.
const error = computed(() => {
  if (estaticoStore.errores.estadios) {
    return estaticoStore.errores.estadios
  }
  if (estaticoStore.cargado && !estadio.value) {
    return 'No se encontró el estadio en la base de datos.'
  }
  return ''
})

// --- 🧭 4. RUTAS Y REDIRECCIÓN ---
/**
 * Redirige de forma segura al usuario de vuelta a la grilla general de sedes/estadios
 */
function volverAEstadios() {
  router.push('/estadios')
}
</script>

<template>
  <section class="detalle-page">
    
    <!-- ⚠️ CASO 1: SE DETECTÓ UN ERROR (Ej: Código de estadio inválido en la URL) -->
    <div v-if="error" class="mensaje-error">
      <h1>{{ error }}</h1>
      <button @click="volverAEstadios">Volver a estadios</button>
    </div>

    <!-- ⏳ CASO 2: LOS DATOS TODAVÍA SE ESTÁN CARGANDO DE LA API -->
    <div v-else-if="cargando || !estadio" class="mensaje-cargando">
      <h1>Cargando estadio...</h1>
    </div>

    <!-- ✅ CASO 3: TODO PERFECTO, DIBUJA LA TARJETA CON LA INFORMACIÓN DEL ESTADIO -->
    <article v-else class="detalle-card">
      <div class="imagen-container">
        <!-- Renderiza de forma dinámica la foto del estadio y su país -->
        <img :src="estadio.imagen" :alt="estadio.nombre" />
        <span class="badge-pais">{{ estadio.pais }}</span>
      </div>

      <div class="detalle-info">
        <h1>{{ estadio.nombre }}</h1>
        
        <!-- Grilla estructurada con datos técnicos del estadio -->
        <div class="info-grid">
          <div class="info-item">
            <span class="label">País</span>
            <strong>{{ estadio.pais }}</strong>
          </div>
          
          <div class="info-item">
            <span class="label">Ciudad</span>
            <strong>{{ estadio.ciudad }}</strong>
          </div>
          
          <div class="info-item">
            <span class="label">Capacidad</span>
            <strong>{{ estadio.capacidad }} espectadores</strong>
          </div>
          
          <!-- Muestra el código del estadio únicamente si el objeto contiene un ID válido -->
          <div v-if="estadio.id" class="info-item">
            <span class="label">Código</span>
            <strong>{{ estadio.id }}</strong>
          </div>
        </div>

        <!-- Descripción autogenerada usando interpolation de Vue -->
        <p class="descripcion">
          Este estadio será una de las sedes del Mundial 2026. Está ubicado en {{ estadio.ciudad }}, {{ estadio.pais }}, y cuenta con una capacidad aproximada de {{ estadio.capacidad }} espectadores.
        </p>

        <!-- Botón para regresar -->
        <button class="btn-volver" @click="volverAEstadios">
          Volver a estadios
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.detalle-page {
  width: 90%;
  max-width: 850px;
  margin: 32px auto;
}

.mensaje-cargando,
.mensaje-error {
  text-align: center;
  margin-top: 40px;
  color: #e5e7eb;
}

.detalle-card {
  background: #0d131f;
  border-radius: 16px;
  padding-top: 24px;
  overflow: hidden;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
}

.imagen-container {
  position: relative;
  width: 90%;
  max-width: 620px;
  height: 210px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 14px;
}

.imagen-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.badge-pais {
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 6px 12px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: bold;
}

.detalle-info {
  padding: 28px;
}

.detalle-info h1 {
  margin: 0 0 24px 0;
  color: #e5e7eb;
  font-size: 32px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.info-item {
  background: #111827;
  border-radius: 12px;
  padding: 16px;
}

.label {
  display: block;
  color: #94a3b8;
  font-size: 13px;
  margin-bottom: 6px;
}

.info-item strong {
  color: #e5e7eb;
  font-size: 16px;
}

.descripcion {
  color: #d1d5db;
  line-height: 1.6;
  margin-bottom: 24px;
}

.btn-volver,
.mensaje-error button {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: bold;
}

.btn-volver:hover,
.mensaje-error button:hover {
  background: #1d4ed8;
}

@media (max-width: 700px) {
  .imagen-container {
    width: 92%;
    height: 180px;
  }

  .detalle-info {
    padding: 20px;
  }

  .detalle-info h1 {
    font-size: 26px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
