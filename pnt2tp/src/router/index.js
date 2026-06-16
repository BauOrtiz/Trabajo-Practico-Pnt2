import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Perfil from '../views/Perfil.vue'
import NotFound from '../views/NotFound.vue'
import Partidos from '../views/Partidos.vue'
import DetallesPartido from '../views/DetallesPartido.vue'
import Grupos from '../views/Grupos.vue'
import DetallesGrupo from '../views/DetallesGrupo.vue'
import Prode from '../views/Prode.vue'
import Ranking from '../views/Ranking.vue'
import Paises from '../views/Paises.vue'
import Pais from '../views/Pais.vue'
import Estadios from '../views/Estadios.vue'
import DetalleEstadio from '../views/DetalleEstadio.vue'
import Registro from '../views/Registro.vue'



const routes = [
//Basicos:
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/home',
        name: 'Home',
        component: Home
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/perfil/:id',
        name: 'Perfil',
        component: Perfil
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound
    },
     {
        path: '/registro',
        name: 'Registro',
        component: Registro
    },

//Partidos:
    {
        path: '/partidos',
        name: 'Partidos',
        component: Partidos
    },
    {
        path: '/partido/:id',
        name: 'DetallesPartido',
        component: DetallesPartido
    },

//Estadios:
    {
        path: '/estadios',
        name: 'Estadios',
        component: Estadios
    },
    {
        path: '/estadios/:id',
        name: 'DetalleEstadio',
        component: DetalleEstadio
    },
    

//Grupos:
    {
        path: '/grupos',
        name: 'Grupos',
        component: Grupos
    },

    {
        path: '/grupos/:id',
        name: 'DetallesGrupo',
        component: DetallesGrupo
    },

//Prode:
    {
        path:'/prode',
        name: 'Prode',
        component: Prode
    },

    {
        path: '/ranking',
        name: 'Ranking',
        component: Ranking
    },

//Paises:
    {
        path:'/paises',
        name: 'Paises',
        component: Paises
    },

    {
        path: '/paises/:id',
        name: 'Pais',
        component: Pais
    }


]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router