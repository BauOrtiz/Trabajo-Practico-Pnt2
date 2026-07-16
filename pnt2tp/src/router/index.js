import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Perfil from '../views/Perfil.vue'
import NotFound from '../views/NotFound.vue'
import Partidos from '../views/Partidos.vue'
import DetallesPartido from '../views/DetallesPartido.vue'
import Grupos from '../views/Grupos.vue'
import Prode from '../views/Prode.vue'
import Ranking from '../views/Ranking.vue'
import Paises from '../views/Paises.vue'
import Pais from '../views/Pais.vue'
import Estadios from '../views/Estadios.vue'
import DetalleEstadio from '../views/DetalleEstadio.vue'
import Registro from '../views/Registro.vue'
import AdminCalendario from '../views/AdminCalendario.vue'



const routes = [

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
        path: '/perfil',
         name: 'Perfil',
         component: Perfil
    },

     {
        path: '/registro',
        name: 'Registro',
        component: Registro
    },


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



    {
        path: '/grupos',
        name: 'Grupos',
        component: Grupos
    },


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

    {
        path: '/admin/calendario',
        name: 'AdminCalendario',
        component: AdminCalendario
    },


    {
        path:'/paises',
        name: 'Paises',
        component: Paises
    },

    {
        path: '/paises/:id',
        name: 'Pais',
        component: Pais
    },



    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound
    }


]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
