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
    <div class="estadio-card">
    <div class="card-image">
      <img :src="estadio.imagen" :alt="estadio.nombre" loading="lazy" />
      <span class="badge-pais">{{ estadio.pais }}</span>
    </div>

    <div class="card-content">
      <h3>{{ estadio.nombre }}</h3>
      <p class="info-location">
        📍 <strong>Ciudad:</strong> {{ estadio.ciudad }}
      </p>
      <p class="info-capacity">
        🏟️ <strong>Capacidad:</strong> {{ estadio.capacidad }} espectadores
      </p>
    </div>
  </div>
       <p></p>
    </article>

</template>

<style scoped>
    .estadio-card {
    background: #0d131f;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: transform 0.3s ease;
    
    /* EL TRUCO: Activamos flex para que los hijos se pongan uno al lado del otro */
    display: flex; 
    flex-direction: row; 
    height: 160px; /* Le fijamos una altura a la tarjeta para que quede simétrica */
    }

    .estadio-card:hover {
    transform: translateY(-3px);
    }

    .card-image-container {
    position: relative;
    width: 40%;        /* Se queda clavado en el 40% del ancho de la tarjeta */
    height: 100%;      /* Ocupa el 100% de la altura de la tarjeta (los 160px) */
    overflow: hidden;  /* Si algo de la foto se pasa, se corta y no deforma la tarjeta */
    flex-shrink: 0;    /* OBLIGATORIO: Evita que el texto de la derecha empuje la imagen y la achique */
    }

    /* 2. La imagen se adapta de forma inteligente a ese contenedor */
    .card-image-container img {
    width: 100%;       /* Se estira a lo ancho para cubrir todo el contenedor */
    height: 100%;      /* Se estira a lo alto para cubrir todo el contenedor */
    
    /* EL SALVAVIDAS: Corta la foto como si fuera un cuadro. 
        La centra y la recorta por los costados sin estirarla ni pixelarla */
    object-fit: cover; 
    object-position: center; /* Se asegura de enfocar el medio de la foto */
    }

    .badge-pais {
    position: absolute;
    top: 8px;
    left: 8px; /* Lo pasé a la izquierda para que no tape el centro */
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: bold;
    }

    /* Configuración de la Columna Derecha (Datos) */
    .card-content-container {
    width: 60%; /* Ocupa el 60% restante */
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: center; /* Centra los textos verticalmente */
    text-align: left;
    }

    .card-content-container h3 {
    margin: 0 0 8px 0;
    font-size: 1.2rem;
    color: #2c3e50;
    }

    .info-body p {
    margin: 4px 0;
    color: #555;
    font-size: 0.9rem;
    }
</style>
