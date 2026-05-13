import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Perfil from '../views/Perfil.vue'
import NotFound from '../views/NotFound.vue'

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
        path: '/fixture',
        name: 'Fixture',
        component: Fixture
    },

    {
        path: '/partido/:id',
        name: 'Partido',
        component: DetallesPartido
    },
    
    {
        path: '/grupos/:id',
        name: 'Grupos',
        component: Grupos
    },

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router