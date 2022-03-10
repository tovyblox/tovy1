import Vue from 'vue'
import VueRouter from 'vue-router'
import gHome from '../views/group/Home.vue'
import ActivityPage from '../views/group/activityPage.vue'
import Welcome from '../views/Welcome'
import Login from '../views/Login.vue'
import yourActivity from '../views/group/yourActivity'
import activeNotices from '@/views/group/activeNotices'
import settings from '@/views/group/settings'
import err from '@/views/err'
import staff from '@/views/group/staff'
import profile from '@/views/group/profile'
import signup from '@/views/signup'
import forbidden from '@/views/forbidden'
import wall from '@/views/group/wall'
import sessions from '@/views/group/sessions'
import session from '@/views/group/session'
import home from '@/views/home'
import group from '@/views/group/group'
import notReady from '@/views/notReady'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: home,
    meta: { layout: 'noworkspace' }
  },
  {
    path: '/group/:id',
    name: 'Home',
    component: group,
    children: [
      {
        path: '/',
        name: 'home',
        meta: { layout: 'main' },
        component: gHome
      },
      {
        path: 'activity',
        name: 'activity',
        meta: { layout: 'default' },
        component: ActivityPage
      },
      {
        path: 'youractivity',
        name: 'Your activity',
        meta: { layout: 'main' },
        component: yourActivity
      },
      {
        path: '/reviewa',
        name: 'Revuiew notices',
        meta: { layout: 'main' },
        component: activeNotices
      },
      {
        path: 'staff',
        name: 'Staff',
        meta: { layout: 'main' },
        component: staff
      }, {
        path: 'sessions',
        name: 'Sessions',
        meta: { layout: 'main' },
        component: sessions
      }, {
        path: 'nr',
        name: 'Not ready',
        meta: { layout: 'default' },
        component: notReady
      }, {
        path: 'session/:id',
        name: 'Session',
        meta: { layout: 'default' },
        component: session
      }, 
      {
        path: 'wall',
        name: 'Wall',
        meta: { layout: 'main' },
        component: wall
      },
      {
        path: 'settings',
        name: 'Settings',
        meta: { layout: 'default' },
        component: settings
      },
      {
        path: 'profile/:id',
        name: 'Profile',
        meta: { layout: 'main' },
        component: profile
      },
    ]
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: Welcome
  }, {
    path: '/signup',
    name: 'Signup',
    component: signup
  }, {
    path: '/invite/:code',
    name: 'Invite'
  },
  {
    path: '/error',
    name: 'Server Error',
    component: err
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: forbidden
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '',
  routes
})

export default router
