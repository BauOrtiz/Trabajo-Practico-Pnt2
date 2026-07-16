<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEstaticoStore } from '../stores/storeEstaticos'


const router = useRouter()               
const estaticoStore = useEstaticoStore() 



function irDetalle(id) {
  router.push(`/paises/${id}`)
}




const cargando = computed(() => estaticoStore.loading && estaticoStore.selecciones.length === 0)


const error = computed(() => estaticoStore.errores.selecciones || '')


onMounted(async () => {

  await estaticoStore.cargarDatosMundial()
})
</script>

<template>
  <div class="paises-page">
    <h1>Selecciones</h1>


    <section v-if="cargando" class="mensaje">
      Cargando equipos...
    </section>


    <section v-else-if="error" class="mensaje mensaje--error">
      {{ error }}
    </section>


    <section v-else class="listado">


      <article
        v-for="seleccion in estaticoStore.selecciones"
        :key="seleccion.id"
        class="card"
        @click="irDetalle(seleccion.id)"
      >

        <div class="grupo">Grupo {{ seleccion.grupo }}</div>


        <img
          :src="seleccion.bandera"
          :alt="seleccion.nombre"
          class="bandera"
        />


        <h3>{{ seleccion.nombre }}</h3>
      </article>
    </section>
  </div>
</template>

<style scoped>
.paises-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 40px;
  color: white;
}

.paises-page h1 {
  margin: 0 0 24px;
}

.mensaje {
  padding: 24px;
  text-align: center;
  border-radius: 12px;
  background-color: #1f2937;
  color: #e5e7eb;
}

.mensaje--error {
  background-color: #7f1d1d;
  color: white;
}

.listado {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.card {
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 8px;
  width: 150px;
  text-align: center;
  background: white;
  color: #111827;
  cursor: pointer;
}

.grupo {
  font-weight: bold;
  margin-bottom: 10px;
}

.bandera {
  width: 60px;
  height: auto;
  border: 1px solid #eee;
}

.card h3 {
  margin: 10px 0 5px;
}
</style>
