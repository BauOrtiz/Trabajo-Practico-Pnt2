<script setup>

    import { ref, onMounted } from 'vue'
    import { obtenerSelecciones } from '../services/partidosService'
    import { useRouter } from 'vue-router'

    const router = useRouter()
    const selecciones = ref([])
    const cargando = ref(true)
    const error = ref('')

    function irDetalle(id){
      //al hacer click, llama a la url del pais seleccionado pasando su id
    router.push(`/paises/${id}`)
    }   

    onMounted(async () => {
  try {
    //llama al metodo que trae la lista de selecciones de la api
    const respuesta = await obtenerSelecciones()
    //como viene dentro de{} le indico que quiero el atributo selecciones, que contiene el array de los paises
    selecciones.value =respuesta.selecciones
   
  } catch (e) {
    error.value = 'No se pudieron cargar los partidos.'
  } finally {
    cargando.value = false
  }

}

    



)
</script>
<template>
<div style="padding: 20px; font-family: sans-serif;">
    <h2 v-if="cargando" style="color: blue;">⏳ Cargando equipos...</h2>
    
    <h2 v-else-if="error" style="color: red;">❌ {{ error }}</h2>
    
    <h2 v-else-if="selecciones.length === 0" style="color: orange;">
      ⚠️ La petición funcionó, pero el arreglo de equipos está vacío.
    </h2>

    <div v-else style="display: flex; gap: 15px; flex-wrap: wrap;">
      <article
        v-for="seleccion in selecciones"
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
