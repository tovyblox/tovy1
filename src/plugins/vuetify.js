import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import '@mdi/font/css/materialdesignicons.css'
Vue.use(Vuetify);
let drk = localStorage.getItem('darkMode');
let dark = drk === 'true'
console.log(dark)

export default new Vuetify({
    theme: {
        dark
    }
});
