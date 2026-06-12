<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { obtenerEstadios } from '../services/partidosService'

    const route = useRoute()
    const estadioId= route.params.id 
    const estadios=ref([])
    const estadio=ref(null)
    const error = ref('')


    onMounted(async ()=>{
        // llama al metodo que trae los estadios de mocachino
        const respuesta= await obtenerEstadios()
        estadios.value= respuesta.estadios
        // buscamos en el array de estadios, un valor que coincida con el id que vino por url
        const estadioEncontrado= estadios.value.find(p=>p.id===estadioId)

        if (estadioEncontrado) {
            estadio.value = estadioEncontrado 
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
