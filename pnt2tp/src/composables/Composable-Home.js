import { computed, onMounted, ref } from 'vue'
import { partidosMock } from '../data/partidosMock'

export function useProximosPartidos() {
  const partidos = ref([])

  const proximosPartidos = computed(() => {
    const hoy = new Date()
    const enUnaSemana = new Date()
    enUnaSemana.setDate(hoy.getDate() + 7)

    const estaEnLaSemana = (p) => {
      const fecha = new Date(p.fecha)
      return fecha >= hoy && fecha <= enUnaSemana
    }

    return partidos.value.filter(estaEnLaSemana)
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

  onMounted(() => {
    partidos.value = partidosMock
  })

  return {
    partidos,
    proximosPartidos,
    partidosPorDia,
    formatearHora
  }
}
