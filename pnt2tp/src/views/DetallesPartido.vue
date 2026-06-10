<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
// Importamos el servicio para que sea dinámico con tu lista
import { obtenerPartidos } from '../services/partidosService'

const route = useRoute()
const partidoId = route.params.id // El :id que viene de la URL
const partido = ref(null)
const loading = ref(true)

// Variables reactivas para capturar el pronóstico del usuario
const pronosticoLocal = ref(null)
const pronosticoVisitante = ref(null)

// SACAMOS LA FUNCIÓN DE ONMOUNTED para que el template pueda leerla perfectamente
const unformatedDate = (fechaStr) => {
  if (!fechaStr) return ''
  const fecha = new Date(fechaStr)
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  try {
    // 1. Intentamos traer los partidos reales del servicio
    const partidosData = await obtenerPartidos()
    
    // 2. Le inyectamos los mismos IDs provisorios usando la misma lógica de la lista
    const partidosConId = partidosData.map((p, index) => ({
      ...p,
      id: p.id || `${p.equipoLocal}-${p.equipoVisitante}-${index}`
    }))

    // 3. Buscamos el partido por el ID de la URL
    partido.value = partidosConId.find(p => p.id === partidoId)

    // FALLBACK: Si no encuentra nada en la API (o estás probando local aislado), usa tu mock
    if (!partido.value) {
      const mockPartidos = [
        {
          "id": "Mexico-South Africa-0",
          "grupoId": "A",
          "equipoLocal": "Mexico",
          "equipoVisitante": "South Africa",
          "golesLocal": 0,
          "golesVisitante": 0,
          "fecha": "2026-06-11T13:00:00-06:00",
          "estado": "programado"
        }
      ]
      // Si el id de la URL coincide con el mock o si estás maquetando a ciegas
      partido.value = mockPartidos.find(p => p.id === partidoId) || mockPartidos[0]
    }
  } catch (error) {
    console.error("Error al traer el partido:", error)
  } finally {
    loading.value = false
  }
})

// Función para procesar el prode
const guardarPronostico = () => {
  if (pronosticoLocal.value !== null && pronosticoVisitante.value !== null) {
    alert(`Pronóstico guardado: ${partido.value.equipoLocal} ${pronosticoLocal.value} - ${pronosticoVisitante.value} ${partido.value.equipoVisitante}`)
    // Acá meterías el envío a tu base de datos o localStarage
  } else {
    alert('Por favor completa ambos resultados antes de guardar.')
  }
}
</script>

<template>
  <div class="partido-detalle-container">
    <div v-if="loading" class="loading">
      Cargando datos del partido...
    </div>

    <div v-else-if="partido" class="partido-card">
      <div class="grupo-badge">Grupo {{ partido.grupoId }}</div>
      
      <div class="marcador">
        <div class="equipo">
          <h2>{{ partido.equipoLocal }}</h2>
          <span class="goles">{{ partido.golesLocal }}</span>
        </div>
        
        <div class="vs">VS</div>
        
        <div class="equipo">
          <h2>{{ partido.equipoVisitante }}</h2>
          <span class="goles">{{ partido.golesVisitante }}</span>
        </div>
      </div>

      <div class="info-adicional">
        <p><strong>Fecha:</strong> {{ unformatedDate(partido.fecha) }}</p>
        <p><strong>Estado:</strong> <span class="estado-texto">{{ partido.estado }}</span></p>
      </div>

      <div class="prode-section" v-if="partido.estado === 'programado'">
        <h3>Cargar mi Pronóstico</h3>
        <div class="prode-inputs">
          <input 
            v-model.number="pronosticoLocal" 
            type="number" 
            min="0" 
            placeholder="0" 
            class="input-gol" 
          />
          <span class="guion">-</span>
          <input 
            v-model.number="pronosticoVisitante" 
            type="number" 
            min="0" 
            placeholder="0" 
            class="input-gol" 
          />
        </div>
        <button @click="guardarPronostico" class="btn-guardar">
          Confirmar Pronóstico
        </button>
      </div>
    </div>

    <div v-else class="error">
      No se encontró el partido especificado.
    </div>
  </div>
</template>

<style scoped>
.partido-detalle-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  min-height: 80vh;
}

.loading, .error {
  color: white;
  font-size: 18px;
  text-align: center;
}

.partido-card {
  background-color: white;
  color: #111827;
  border-radius: 16px;
  padding: 30px;
  width: 100%;
  max-width: 550px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.grupo-badge {
  display: inline-block;
  background-color: #2563eb;
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 20px;
}

.marcador {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 25px;
}

.equipo {
  flex: 1;
}

.equipo h2 {
  font-size: 20px;
  margin: 10px 0;
}

.goles {
  font-size: 36px;
  font-weight: 800;
  color: #374151;
}

.vs {
  font-weight: bold;
  color: #9ca3af;
  font-size: 18px;
  padding: 0 15px;
}

.info-adicional {
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  padding: 15px 0;
  margin-bottom: 25px;
  color: #4b5563;
  font-size: 15px;
}

.estado-texto {
  text-transform: capitalize;
  font-weight: 600;
  color: #059669;
}

/* Estilos de la sección Prode */
.prode-section {
  background-color: #f3f4f6;
  padding: 20px;
  border-radius: 12px;
}

.prode-section h3 {
  margin-top: 0;
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 15px;
}

.prode-inputs {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.input-gol {
  width: 60px;
  height: 50px;
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  border: 2px solid #d1d5db;
  border-radius: 8px;
}

.input-gol:focus {
  border-color: #2563eb;
  outline: none;
}

.guion {
  font-size: 24px;
  font-weight: bold;
  color: #9ca3af;
}

.btn-guardar {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
}

.btn-guardar:hover {
  background-color: #059669;
}
</style>