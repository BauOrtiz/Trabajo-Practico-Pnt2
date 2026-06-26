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
  <h1 class="titulo-estadios">Estadios</h1>

  <section class="estadios-container">
    <article
      v-for="estadio in estadios"
      :key="estadio.id"
      class="estadio-card"
      @click="detalleEstadio(estadio.id)"
    >
      <div class="card-image-container">
        <img :src="estadio.imagen" :alt="estadio.nombre" loading="lazy" />
        <span class="badge-pais">{{ estadio.pais }}</span>
      </div>

      <div class="card-content-container">
        <h3>{{ estadio.nombre }}</h3>

        <p class="info-location">
          📍 <strong>Ciudad:</strong> {{ estadio.ciudad }}
        </p>

        <p class="info-capacity">
          🏟️ <strong>Capacidad:</strong> {{ estadio.capacidad }} espectadores
        </p>
      </div>
    </article>
  </section>
</template>



<style scoped>
.titulo-estadios {
  text-align: center;
  margin: 24px 0;
  font-size: 32px;
  color: #e5e7eb;
}

.estadios-container {
  width: 90%;
  max-width: 850px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.estadio-card {
  background: #0d131f;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: row;
  height: 130px;
  cursor: pointer;
}

.estadio-card:hover {
  transform: translateY(-3px);
}

.card-image-container {
  position: relative;
  width: 230px;
  height: 130px;
  overflow: hidden;
  flex-shrink: 0;
}

.card-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.badge-pais {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.card-content-container {
  flex: 1;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
}

.card-content-container h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #cbd5e1;
}

.card-content-container p {
  margin: 4px 0;
  color: #d1d5db;
  font-size: 14px;
}

@media (max-width: 700px) {
  .estadios-container {
    width: 95%;
  }

  .estadio-card {
    height: 120px;
  }

  .card-image-container {
    width: 180px;
    height: 120px;
  }

  .card-content-container {
    padding: 10px 12px;
  }

  .card-content-container h3 {
    font-size: 16px;
  }

  .card-content-container p {
    font-size: 13px;
  }
}
</style>
