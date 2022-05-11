import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

Vue.use(Vuetify);
let dark = !!localStorage.getItem('darkMode');
console.log(dark)

export default new Vuetify({
    theme: {
        dark
    }
});
