import { computed } from 'vue'
import { useEstaticoStore } from '../stores/storeEstaticos'

export function useProximosPartidos() {
  const estaticoStore = useEstaticoStore()


  const cargando = computed(() => estaticoStore.loading && estaticoStore.partidos.length === 0)
  const error = computed(() => estaticoStore.error || '')


  const proximosPartidos = computed(() => {

    const partidosCalculados = estaticoStore.partidosConEstadoCalculado || []


    const fechaReferencia = new Date(estaticoStore.fechaAdmin)


    const limiteSemana = new Date(fechaReferencia.getTime() + 7 * 24 * 60 * 60 * 1000)

    return partidosCalculados.filter((partido) => {
      const fechaPartido = new Date(partido.fecha)

      return fechaPartido >= fechaReferencia && fechaPartido <= limiteSemana
    })
  })


  const partidosPorDia = computed(() => {
    const agrupados = {}

    proximosPartidos.value.forEach((partido) => {
      const fecha = new Date(partido.fecha)

      const diaFormateado = fecha.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })


      const diaCapitalizado = diaFormateado.charAt(0).toUpperCase() + diaFormateado.slice(1)

      if (!agrupados[diaCapitalizado]) {
        agrupados[diaCapitalizado] = []
      }
      agrupados[diaCapitalizado].push(partido)
    })

    return agrupados
  })


  function formatearHora(fechaStr) {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return {
    cargando,
    error,
    proximosPartidos,
    partidosPorDia,
    formatearHora
  }
}