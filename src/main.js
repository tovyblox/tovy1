import Vue from 'vue'
import App from './App.vue'
import router from './router'
import Vuex from 'vuex'
import axios from 'axios'
import main from './layouts/main.vue'
import def from './layouts/default.vue'
import VueCookies from 'vue-cookies'
Vue.use(VueCookies)
let api = axios.create({
  baseURL: `/api`,
  headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
  }
});
Vue.use(Vuex)
Vue.component('main-layout', main)
Vue.component('default-layout', def)
const store = new Vuex.Store({
  state: {
    user: {
      id: null,
      name: null,
      signedin: false
    }, group: {
      color: 'red'
    }
  },
  mutations: {
    setuser(state, user) {
      state.user = user
    }, setcolor(state, color) {
      state.group.color = color;
    }
  }
})
Vue.prototype.$http = api;
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

new Vue({
  router,
  vuetify,
  store,

  render: h => h(App)
}).$mount('#app')
