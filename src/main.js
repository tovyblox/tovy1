import Vue from 'vue'
import App from './App.vue'
import router from './router'
import Vuex from 'vuex'
import axios from 'axios'
import main from './layouts/main.vue'
import def from './layouts/default.vue'
import VueCookies from 'vue-cookies'
import VueCountdown from '@chenfengyuan/vue-countdown';
require('dotenv').config()
Vue.use(VueCookies)
Vue.component(VueCountdown.name, VueCountdown);
let api = axios.create({
  baseURL: `${process.env.VUE_APP_BASE ? `//${process.env.VUE_APP_BASE}` : ''}/api`,
  withCredentials: true,
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
      color: 'red',
      id: null
    }
  },
  mutations: {
    setuser(state, user) {
      state.user = user
    }, setgroup(state, group) {
      state.group = group;
    }, setcolor(state, color) {
      state.group.color = color;
    }, netntext(state, text) {
      state.group.noticetext = text;
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
