<script setup>

    import { ref, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { useEstaticoStore } from '../stores/storeEstaticos'

    const router = useRouter()
    const estaticoStore = useEstaticoStore()



    function irDetalle(id){
      //al hacer click, llama a la url del pais seleccionado pasando su id
    router.push(`/paises/${id}`)
    }   

    onMounted(async () => {
            estaticoStore.cargarDatosMundial()
    }

    



)
</script>
<template>
<div style="padding: 20px; font-family: sans-serif;">
    <h2 v-if="!estaticoStore.cargado" style="color: blue;">⏳ Cargando equipos...</h2>
    
    


    <div v-else style="display: flex; gap: 15px; flex-wrap: wrap;">
      <article
        v-for="seleccion in estaticoStore.selecciones"
        :key="seleccion.id"
        @click="irDetalle(seleccion.id)"
        style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; width: 150px; text-align: center;"
      >
        <div style="font-weight: bold; margin-bottom: 10px;">
          Grupo {{ seleccion.grupo }}
        </div>
        <img 
          :src="seleccion.bandera" 
          :alt="seleccion.nombre"
          style="width: 60px; height: auto; border: 1px solid #eee;"
        />
        <h3 style="margin: 10px 0 5px 0;">{{ seleccion.nombre }}</h3>
      </article>
    </div>
  </div>
</template>

<style scoped>

</style>
