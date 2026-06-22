<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
// Importamos el servicio para que sea dinámico con tu lista
import { obtenerSelecciones } from '../services/partidosService'

const route = useRoute()
const paisId = route.params.id // El :id que viene de la URL
const selecciones = ref([])
const pais = ref(null)
const error = ref('')

onMounted(async () => {

    // llama al metodo que trae los partidos de mocachino
      const respuesta = await obtenerSelecciones()
      selecciones.value =respuesta.selecciones
    
    // buscamos en el array de selecciones, un valor que coincida con el id que vino por url
        const paisEncontrado = selecciones.value.find(p=>p.id===paisId)

  if (paisEncontrado) {
      pais.value = paisEncontrado
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
