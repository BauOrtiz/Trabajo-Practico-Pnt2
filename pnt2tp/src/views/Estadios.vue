<script setup>
    import { obtenerEstadios } from '@/services/partidosService';
    import { useRouter } from 'vue-router'
    import { ref, onMounted } from 'vue'
    import DetalleEstadio from './DetalleEstadio.vue';

    const router= useRouter()
    const estadios= ref([])
    const cargando = ref(true)
    const error = ref('')

    function detalleEstadio(id){
        router.push(`/estadios/${id}`)
    }



    onMounted(async ()=>{
        const respuesta= await obtenerEstadios()
        estadios.value = respuesta.estadios


    }
    )





</script>

<template>
    <h1>hola</h1>

    <article
    v-for="estadio in estadios"
    @click="detalleEstadio(estadio.id)">

        <h1 >{{ estadio.id }}</h1>
    </article>

</template>

<style scoped>

</style>
