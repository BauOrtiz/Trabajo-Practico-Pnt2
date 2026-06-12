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
        //al hacer click, llama a la url del estadio seleccionado pasando su id
        router.push(`/estadios/${id}`)
    }



    onMounted(async ()=>{
        //llama al metodo que trae la lista de estadios de la api
        const respuesta= await obtenerEstadios()
        //como viene dentro de{} le indico que quiero el atributo estadios, que contiene el array de los estadios
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
