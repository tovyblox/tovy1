import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import '@mdi/font/css/materialdesignicons.css'
Vue.use(Vuetify);
let dark = !!localStorage.getItem('darkMode');
console.log(dark)

export default new Vuetify({
    theme: {
        dark
    }
});
