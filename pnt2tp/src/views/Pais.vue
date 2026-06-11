<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
// Importamos el servicio para que sea dinámico con tu lista
import { obtenerSelecciones } from '../services/partidosService'

const route = useRoute()
const paisId = route.params.id // El :id que viene de la URL
const selecciones = ref([])
const pais = ref(null)
const loading = ref(true)

onMounted(async () => {

    // 1. Intentamos traer los partidos reales del servicio
      const respuesta = await obtenerSelecciones()
      selecciones.value =respuesta.selecciones
    
    // 2. Le inyectamos los mismos IDs provisorios usando la misma lógica de la lista
        const paisEncontrado = selecciones.value.find(p=>p.id===paisId)

  if (paisEncontrado) {
      pais.value = paisEncontrado // ¡Aquí desaparece el "Cargando" y muestra los datos!
    } else {
      error.value = "No se encontró el país en la base de datos."
    }

})

</script>

<template>
   <div v-if="!pais">
    <h2>⏳ Cargando datos del país...</h2>
  </div>

  <div v-else>
    <h1>{{ pais.id }}</h1>
    </div>
</template>
    
<style scoped>

</style>
