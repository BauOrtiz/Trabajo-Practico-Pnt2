<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
// Importamos el servicio para que sea dinámico con tu lista
import { obtenerEstadios } from '../services/partidosService'

    const route = useRoute()
    const estadioId= route.params.id 
    const estadios=ref([])
    const estadio=ref(null)

    onMounted(async ()=>{
        const respuesta= await obtenerEstadios()
        estadios.value= respuesta.estadios
        const estadioEncontrado= estadios.value.find(p=>p.id===estadioId)

        if (estadioEncontrado) {
            estadio.value = estadioEncontrado // ¡Aquí desaparece el "Cargando" y muestra los datos!
            } else {
            error.value = "No se encontró el país en la base de datos."
          }

    })






</script>

<template>
    <div v-if="!estadio">
        <h1>AAAA</h1>
    </div>
    <div v-else>
        <h1>{{ estadio.nombre }}</h1>
    </div>

</template>

<style scoped>

</style>
