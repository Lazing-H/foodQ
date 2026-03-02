import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'shops',
        name: 'Shops',
        component: () => import('../views/Shops.vue')
      },
      {
        path: 'shop/:id',
        name: 'ShopDetail',
        component: () => import('../views/ShopDetail.vue')
      },
      {
        path: 'food/:id',
        name: 'FoodDetail',
        component: () => import('../views/FoodDetail.vue')
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('../views/Orders.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'reviews',
        name: 'Reviews',
        component: () => import('../views/Reviews.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'friends',
        name: 'Friends',
        component: () => import('../views/Friends.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'shares',
        name: 'Shares',
        component: () => import('../views/Shares.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'merchant',
        name: 'Merchant',
        component: () => import('../views/Merchant.vue'),
        meta: { requiresAuth: true, requiresMerchant: true }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !store.getters.isLoggedIn) {
    next('/login')
  } else if (to.meta.requiresAdmin && !store.getters.isAdmin) {
    next('/home')
  } else if (to.meta.requiresMerchant && !store.getters.isMerchant) {
    next('/home')
  } else {
    next()
  }
})

export default router
