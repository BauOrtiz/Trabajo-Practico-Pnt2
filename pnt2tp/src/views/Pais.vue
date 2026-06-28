<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { obtenerSelecciones } from '../services/partidosService'

const route = useRoute()
const paisId = route.params.id

const pais = ref(null)
const error = ref('')
const cargando = ref(true)

onMounted(async () => {
  try {
    const respuesta = await obtenerSelecciones()
    const selecciones = respuesta.selecciones ?? []

    const paisEncontrado = selecciones.find(p => p.id === paisId)

    if (paisEncontrado) {
      pais.value = paisEncontrado
    } else {
      error.value = 'No se encontró el país en la base de datos.'
    }
  } catch (e) {
    error.value = 'Error al cargar los datos del país.'
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <section class="detalle-pais">
    <div v-if="cargando">
      <h2>⏳ Cargando datos del país...</h2>
    </div>

    <div v-else-if="error">
      <h2>{{ error }}</h2>
    </div>

    <div v-else>
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
    </div>
  </section>
</template>

<style scoped>
.detalle-pais {
  padding: 24px;
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