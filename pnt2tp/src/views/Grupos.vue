<script setup>
import { computed, onMounted } from 'vue'
import { calcularGrupos } from '../services/grupoService'
import { useEstaticoStore } from '../stores/storeEstaticos'
import { obtenerBanderaUrl } from '../utils/banderas.js'

const estaticoStore = useEstaticoStore()

onMounted(() => {
  estaticoStore.cargarDatosMundial()
})

const cargando = computed(() => estaticoStore.loading && estaticoStore.partidos.length === 0)
const error = computed(() => estaticoStore.errores.partidos || '')
const grupos = computed(() => calcularGrupos(estaticoStore.partidos))
</script>

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
          Los dos primeros aparecen destacados como clasificacion directa.
        </p>
      </article>
    </section>
  </main>
</template>

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
