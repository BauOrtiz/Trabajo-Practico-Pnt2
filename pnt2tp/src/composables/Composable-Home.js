import { computed, onMounted, ref } from 'vue'
import { obtenerPartidos } from '../services/partidosService'

export function useProximosPartidos() {
  const partidos = ref([])
  const cargando = ref(true)
  const error = ref('')

  const proximosPartidos = computed(() => {
    const hoy = new Date()
    const enUnaSemana = new Date()
    enUnaSemana.setDate(hoy.getDate() + 7)

    const estaEnLaSemana = (p) => {
      const fecha = new Date(p.fecha)
      return fecha >= hoy && fecha <= enUnaSemana
    }

    return partidos.value
      .filter(estaEnLaSemana)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  })

  const partidosPorDia = computed(() => {
    const grupos = {}
    for (const partido of proximosPartidos.value) {
      const dia = new Date(partido.fecha).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long'
      })
      if (!grupos[dia]) grupos[dia] = []
      grupos[dia].push(partido)
    }
    return grupos
  })

  function formatearHora(fecha) {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  onMounted(async () => {
    try {
      partidos.value = await obtenerPartidos()
    } catch (e) {
      error.value = 'No se pudieron cargar los próximos partidos.'
    } finally {
      cargando.value = false
    }
  })

  return {
    partidos,
    cargando,
    error,
    proximosPartidos,
    partidosPorDia,
    formatearHora
  }
}
