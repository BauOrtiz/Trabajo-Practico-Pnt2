<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEstaticoStore } from '../stores/storeEstaticos'

const route = useRoute()

const estaticoStore = useEstaticoStore()
const paisId = computed(() => route.params.id)

onMounted(async () => {
estaticoStore.cargarDatosMundial()
})

// 2. COMPUTED: Busca en tiempo real. Si Pinia se actualiza, esto se actualiza solo
 const pais =   computed(() => {
  // Si el array de estadios todavía no existe o está vacío, devolvemos null temporalmente
  if (!estaticoStore.selecciones || estaticoStore.selecciones.length === 0) {
    return null
  }
  // Buscamos el estadio de forma segura
  return estaticoStore.selecciones.find(e => e.id === paisId.value)
})


// 3. ERROR COMPUTADO: Si ya se cargaron los datos globales pero el ID no existe en la lista
const error = computed(() => {
  if (estaticoStore.cargado && !pais.value) {
    return 'No se encontró el país en la base de datos.'
  }
  return estaticoStore.error ? 'No se pudo cargar el detalle del país.' : ''
})

</script>

<template>
  <section class="detalle-pais">
    <p v-if="error" class="mensaje">{{ error }}</p>

    <p v-else-if="!pais" class="mensaje">Cargando país...</p>

    <template v-else>
      <div class="encabezado">
        <img 
          v-if="pais.bandera" 
          :src="pais.bandera" 
          :alt="`Bandera de ${pais.nombre}`"
          class="bandera"
        >

        <div>
          <h1>{{ pais.nombre ?? pais.id }}</h1>
          <p><strong>Código:</strong> {{ pais.id }}</p>
          <p v-if="pais.grupo"><strong>Grupo:</strong> {{ pais.grupo }}</p>
        </div>
      </div>

      <hr>

      <h2>Director técnico</h2>

      <div v-if="pais.entrenador" class="card">
        <p><strong>Nombre:</strong> {{ pais.entrenador.nombre }}</p>
        <p v-if="pais.entrenador.nacionalidad">
          <strong>Nacionalidad:</strong> {{ pais.entrenador.nacionalidad }}
        </p>
      </div>

      <p v-else>
        No hay director técnico cargado.
      </p>

      <hr>

      <h2>Jugadores</h2>

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
