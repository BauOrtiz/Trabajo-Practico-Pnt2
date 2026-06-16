<script setup>
    import { ref } from 'vue'
    import { useAuthStore } from '../stores/storeAuth'
    import { useRouter } from 'vue-router'

    const authStore = useAuthStore()
    const router = useRouter()

    const email= ref('')
    const contrasenia=ref('')
    const nombre=ref('')

    const registrarse= async()=>{
        if(!email.value || !contrasenia.value || !nombre.value){
            return
        }

        const exitoso= await authStore.register(nombre.value,email.value,contrasenia.value)

        if(exitoso){
            router.push('/login')
        }
    }

</script>

<template>
   <h1>Registro</h1>
    <form @submit.prevent="registrarse">

        <div class="form-group">
        <label>Nombre</label>
        <input v-model="nombre" type="text" required/>
        </div>

        <div class="form-group">
        <label>Email</label>
        <input v-model="email" type="email" required placeholder="tu@email.com" />
        </div>

        <div class="form-group">
        <label>Contraseña</label>
        <input v-model="contrasenia" type="password" required placeholder="******" />
        </div>

        <p v-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

         <button type="submit" :disabled="authStore.loading">
            {{ authStore.loading ? 'Creando cuenta...' : 'Registrarse' }}
         </button>
        
        </form>

</template>

<style scoped>

</style>
