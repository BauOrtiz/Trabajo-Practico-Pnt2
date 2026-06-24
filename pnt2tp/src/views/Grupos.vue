<script setup>

// importo herramientes de VUE

import { computed, onMounted, ref } from 'vue'

// importo la función obtenerPartidos desde el archivo de servicios partidosService.js
// importo la función obtenerBanderaUrl desde el archivo de utilidades banderas.js

import { obtenerPartidos } from '../services/partidosService'
import { obtenerBanderaUrl } from '../utils/banderas.js'

// declaro variables reactivas para manejar el estado de los partidos, la carga y los errores
// la variable reactiva hace que vue actualice automáticamente la vista cuando cambian sus valores, 
// lo que permite que la interfaz de usuario refleje el estado actual de los datos sin necesidad de recargar la página

// declaro tres variables reactivas: 
// partidos como un array vacío, cargando como true y error como una cadena vacía

const partidos = ref([])
const cargando = ref(true)
const error = ref('')

// Carga los partidos al montar el componente, maneja errores y actualiza el estado de carga
// onMounted: cuando vue monte Grupos.vue, ejecuta esta función asíncrona para obtener los partidos

onMounted(async () => {

  // intenta obtener los partidos usando la función obtenerPartidos
  // viene de services / partidosService.js
  // si la solicitud es exitosa, asigna los partidos a la variable reactiva partidos.value
  // (reactiva significa que se actualiza automáticamente cuando cambia su valor, eso lo hace VUE) 
  try {
    partidos.value = await obtenerPartidos()
    // si ocurre un error lo captura   
  } catch (e) {
    error.value = 'No se pudieron cargar los grupos.'
    // finalmente, independientemente del resultado, establece cargando en false para indicar que la carga ha terminado
    // en la linea 21 se inicializa cargando como true, lo que indica que los datos están siendo cargados.
  } finally {
    cargando.value = false
  }
})

// función para crear un objeto del equipo recibido por parámetros con las estadísticas iniciales

function crearEquipo(nombre) {
  return {
    nombre,
    jugados: 0,
    ganados: 0,
    empatados: 0,
    perdidos: 0,
    golesFavor: 0,
    golesContra: 0,
    diferenciaGol: 0,
    puntos: 0
  }
}

// computed es una función de Vue que sirve para crear un valor calculado que se actualiza automáticamente cuando cambian otras variables reactivas.
// en este caso, grupos es un valor calculado que se basa en los partidos obtenidos

const grupos = computed(() => {

  // creo un objeto vacío para almacenar los grupos y sus equipos
  const gruposMap = {}

  // recorro cada partido para llenar el objeto gruposMap con la información de los equipos y sus estadísticas.
  partidos.value.forEach((partido) => {
    // obtengo el ID del grupo del partido, si no tiene grupo asignado, lo etiqueto como 'Sin grupo'
    const grupoId = partido.grupoId || 'Sin grupo'

    // si el grupo no existe en gruposMap, lo creo como un objeto vacío
    if (!gruposMap[grupoId]) {
      gruposMap[grupoId] = {}
    }

    // para cada equipo (local y visitante) del partido, verifico si ya existe en el grupo correspondiente en gruposMap
    // si no existe, lo creo usando la función crearEquipo y lo asigno al grupo
    if (!gruposMap[grupoId][partido.equipoLocal]) {
      gruposMap[grupoId][partido.equipoLocal] = crearEquipo(partido.equipoLocal)
    }

    // hago lo mismo para el equipo visitante

    if (!gruposMap[grupoId][partido.equipoVisitante]) {
      gruposMap[grupoId][partido.equipoVisitante] = crearEquipo(partido.equipoVisitante)
    }

    // si el partido ha finalizado, actualizo las estadísticas de ambos equipos en el grupo correspondiente en gruposMap

    if (partido.estado === 'finalizado') {
      const local = gruposMap[grupoId][partido.equipoLocal]
      const visitante = gruposMap[grupoId][partido.equipoVisitante]

      const golesLocal = Number(partido.golesLocal)
      const golesVisitante = Number(partido.golesVisitante)

      local.jugados++
      visitante.jugados++

      local.golesFavor += golesLocal
      local.golesContra += golesVisitante

      visitante.golesFavor += golesVisitante
      visitante.golesContra += golesLocal

      // determino el resultado del partido para actualizar las estadísticas de ganados, empatados, perdidos y puntos de cada equipo

      if (golesLocal > golesVisitante) {
        local.ganados++
        visitante.perdidos++
        local.puntos += 3
      } else if (golesLocal < golesVisitante) {
        visitante.ganados++
        local.perdidos++
        visitante.puntos += 3
      } else {
        local.empatados++
        visitante.empatados++
        local.puntos += 1
        visitante.puntos += 1
      }

      // calculo la diferencia de goles para cada equipo como goles a favor menos goles en contra

      local.diferenciaGol = local.golesFavor - local.golesContra
      visitante.diferenciaGol = visitante.golesFavor - visitante.golesContra
    }
  })

    // convierto el objeto gruposMap en un array de grupos,
    //  donde cada grupo tiene su ID y una tabla de equipos ordenada según los criterios de puntos, diferencia de goles, goles a favor y nombre
   
    // .entries convierte el objeto que recibe por parámetro en un array de pares [clave, valor], en este caso [grupoId, equipos]
   
  return Object.entries(gruposMap)
   // .map recorre cada par del array y devuelve un nuevo array con objetos que representan cada grupo, con su ID y su tabla de equipos ordenada
    .map(([grupoId, equipos]) => {

      // ordeno los equipos del grupo según los criterios de puntos, diferencia de goles, goles a favor y nombre
      // sort ordena el array de equipos comparando dos equipos a la vez (a y b) y devolviendo un valor negativo, cero o positivo según el orden deseado
      const tabla = Object.values(equipos).sort((a, b) => {
        if (b.puntos !== a.puntos) {
          return b.puntos - a.puntos
        }

        if (b.diferenciaGol !== a.diferenciaGol) {
          return b.diferenciaGol - a.diferenciaGol
        }

        if (b.golesFavor !== a.golesFavor) {
          return b.golesFavor - a.golesFavor
        }

        return a.nombre.localeCompare(b.nombre)
      })

      return {
        grupoId,
        tabla
      }
    })
    .sort((a, b) => String(a.grupoId).localeCompare(String(b.grupoId)))
})
</script>

// en el próximo template defino que se va a mostrar en la página de grupos
// se muestra un encabezado con el título y una descripción, luego se muestra un mensaje de carga o error si corresponde,
// y finalmente se muestra la tabla de grupos con sus equipos y estadísticas si los datos se han cargado correctamente
<template>
 

  <main class="grupos-page">
    <section class="encabezado">
      <div>
        <h1>Grupos</h1>
        <p>Tablas de posiciones del Mundial 2026</p>
      </div>
    </section>

    <section v-if="cargando" class="mensaje">
      Cargando grupos...
    </section>

    <section v-else-if="error" class="mensaje error">
      {{ error }}
    </section>

    <section v-else class="contenedor-grupos">
      <article
        v-for="grupo in grupos"
        :key="grupo.grupoId"
        class="tarjeta-grupo"
      >
        <h2>Grupo {{ grupo.grupoId }}</h2>

        <div class="tabla-wrapper">
          <table>
            <thead>
              <tr>
                <th class="equipo-col">Equipo</th>
                <th>PJ</th>
                <th>PG</th>
                <th>PE</th>
                <th>PP</th>
                <th>GF</th>
                <th>GC</th>
                <th>DG</th>
                <th>Pts</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(equipo, index) in grupo.tabla"
                :key="equipo.nombre"
                :class="{ clasificado: index < 2 }"
              >
                <td class="equipo">
                  <span class="posicion">{{ index + 1 }}</span>

                  <img
                    class="bandera-img"
                    :src="obtenerBanderaUrl(equipo.nombre)"
                    :alt="equipo.nombre"
                  />

                  <span>{{ equipo.nombre }}</span>
                </td>

                <td>{{ equipo.jugados }}</td>
                <td>{{ equipo.ganados }}</td>
                <td>{{ equipo.empatados }}</td>
                <td>{{ equipo.perdidos }}</td>
                <td>{{ equipo.golesFavor }}</td>
                <td>{{ equipo.golesContra }}</td>
                <td>{{ equipo.diferenciaGol }}</td>
                <td class="puntos">{{ equipo.puntos }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="nota">
          Los dos primeros aparecen destacados como clasificación directa.
        </p>
      </article>
    </section>
  </main>
</template>

// estilos para la página de grupos, con diseño responsivo para adaptarse a diferentes tamaños de pantalla

<style scoped>


.grupos-page {
  min-height: calc(100vh - 80px);
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
  color: white;
}

.encabezado {
  margin-bottom: 28px;
}

.encabezado h1 {
  margin: 0;
  font-size: 32px;
  color: white;
}

.encabezado p {
  margin: 6px 0 0;
  color: #9ca3af;
}

.mensaje {
  padding: 24px;
  text-align: center;
  border-radius: 12px;
  background-color: #1f2937;
  color: #e5e7eb;
}

.error {
  background-color: #7f1d1d;
  color: white;
}

.contenedor-grupos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(520px, 1fr));
  gap: 20px;
}

.tarjeta-grupo {
  padding: 20px;
  border-radius: 18px;
  background-color: white;
  color: #111827;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

.tarjeta-grupo h2 {
  margin: 0 0 16px;
  color: #111827;
}

.tabla-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px 8px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

th {
  color: #6b7280;
  font-weight: 700;
}

.equipo-col {
  text-align: left;
}

.equipo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  font-weight: 600;
}

.posicion {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
}

.bandera-img {
  width: 28px;
  height: 20px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.clasificado {
  background-color: #eff6ff;
}

.clasificado .posicion {
  background-color: #2563eb;
  color: white;
}

.puntos {
  font-weight: 800;
  color: #2563eb;
}

.nota {
  margin: 14px 0 0;
  font-size: 13px;
  color: #6b7280;
}

@media (max-width: 700px) {
  .contenedor-grupos {
    grid-template-columns: 1fr;
  }

  .tarjeta-grupo {
    padding: 16px;
  }

  th,
  td {
    padding: 8px 6px;
    font-size: 13px;
  }
}
</style>