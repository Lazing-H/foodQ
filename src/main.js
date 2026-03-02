import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'

Vue.config.productionTip = false

// 捕获第三方脚本（如高德地图）的跨域 Script error，避免全屏报错覆盖层
window.addEventListener('error', function (event) {
  if (event.message === 'Script error.' || event.message === 'Script error') {
    console.warn('[Suppressed] Third-party script error (e.g. AMap):', event.filename || event)
    return true
  }
  return false
})

Vue.use(ElementUI)

// 配置axios
axios.defaults.baseURL = 'https://api.lhcj.xyz/api'
axios.defaults.timeout = 10000

// 请求拦截器
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axios.interceptors.response.use(
  response => {
    if (response.data.code === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    return response
  },
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

Vue.prototype.$http = axios

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
