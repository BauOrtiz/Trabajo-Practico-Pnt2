import { computed, onMounted } from 'vue'
import { useEstaticoStore } from '../stores/storeEstaticos'

export function useProximosPartidos() {
  const estaticoStore = useEstaticoStore()

  const proximosPartidos = computed(() => {
    const hoy = new Date()
    const enUnaSemana = new Date()
    enUnaSemana.setDate(hoy.getDate() + 7)

    return estaticoStore.partidos
      .filter((partido) => {
        const fecha = new Date(partido.fecha)
        return fecha >= hoy && fecha <= enUnaSemana
      })
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  })

  const partidosPorDia = computed(() => {
    const grupos = {}

    for (const partido of proximosPartidos.value) {
      const dia = new Date(partido.fecha).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long'
      })

      if (!grupos[dia]) {
        grupos[dia] = []
      }

      grupos[dia].push(partido)
    }

    return grupos
  })

  const cargando = computed(() => estaticoStore.loading && estaticoStore.partidos.length === 0)
  const error = computed(() => estaticoStore.errores.partidos || '')

  function formatearHora(fecha) {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  onMounted(() => {
    estaticoStore.cargarDatosMundial()
  })

  return {
    cargando,
    error,
    proximosPartidos,
    partidosPorDia,
    formatearHora
  }
}
