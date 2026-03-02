import axios from 'axios'

// 用户相关
export const userApi = {
  login(data) {
    return axios.post('/user/login', data)
  },
  register(data) {
    return axios.post('/user/register', data)
  },
  getUserInfo() {
    return axios.get('/user/info')
  },
  searchUsers(keyword) {
    return axios.get('/user/search', { params: { keyword } })
  },
  addFriend(friendId) {
    return axios.post('/user/friend/add', { friendId })
  },
  acceptFriend(friendId) {
    return axios.post('/user/friend/accept', { friendId })
  },
  getFriends() {
    return axios.get('/user/friend/list')
  },
  getPendingRequests() {
    return axios.get('/user/friend/pending')
  }
}

// 店铺相关
export const shopApi = {
  getShopList(params) {
    return axios.get('/shop/list', { params })
  },
  getRecommendedShops() {
    return axios.get('/shop/recommended')
  },
  getShopById(id) {
    return axios.get(`/shop/${id}`)
  },
  createShop(data) {
    return axios.post('/shop/create', data)
  },
  updateShop(data) {
    return axios.put('/shop/update', data)
  },
  deleteShop(id) {
    return axios.delete(`/shop/${id}`)
  },
  // 商家相关
  getMyShops() {
    return axios.get('/shop/merchant/my-shops')
  },
  createMyShop(data) {
    return axios.post('/shop/merchant/create', data)
  },
  updateMyShop(data) {
    return axios.put('/shop/merchant/update', data)
  },
  deleteMyShop(id) {
    return axios.delete(`/shop/merchant/${id}`)
  }
}

// 美食相关
export const foodApi = {
  getFoodList(params) {
    return axios.get('/food/list', { params })
  },
  getFoodsByShopId(shopId) {
    return axios.get(`/food/shop/${shopId}`)
  },
  getTopRatedFoods(limit = 10) {
    return axios.get('/food/top-rated', { params: { limit } })
  },
  getFoodById(id) {
    return axios.get(`/food/${id}`)
  },
  createFood(data) {
    return axios.post('/food/create', data)
  },
  updateFood(data) {
    return axios.put('/food/update', data)
  },
  deleteFood(id) {
    return axios.delete(`/food/${id}`)
  },
  // 商家相关
  getMyFoods(shopId) {
    return axios.get('/food/merchant/my-foods', { params: { shopId } })
  },
  createMyFood(data) {
    return axios.post('/food/merchant/create', data)
  },
  updateMyFood(data) {
    return axios.put('/food/merchant/update', data)
  },
  deleteMyFood(id) {
    return axios.delete(`/food/merchant/${id}`)
  }
}

// 订单相关
export const orderApi = {
  createOrder(data) {
    return axios.post('/order/create', data)
  },
  getOrderById(id) {
    return axios.get(`/order/${id}`)
  },
  getOrders() {
    return axios.get('/order/list')
  },
  updateOrderStatus(id, status) {
    return axios.put(`/order/${id}/status`, { status })
  }
}

// 评价相关
export const reviewApi = {
  createReview(data) {
    return axios.post('/review/create', data)
  },
  getReviewsByFoodId(foodId) {
    return axios.get(`/review/food/${foodId}`)
  },
  getMyReviews() {
    return axios.get('/review/my')
  }
}

// 分享相关
export const shareApi = {
  shareFood(data) {
    return axios.post('/share/create', data)
  },
  getReceivedShares(isRead) {
    return axios.get('/share/received', { params: { isRead } })
  },
  markAsRead(id) {
    return axios.put(`/share/${id}/read`)
  }
}

// 聊天相关
export const chatApi = {
  getChatHistory(userId, friendId) {
    return axios.get('/chat/history', { params: { userId, friendId } })
  }
}

// 文件上传（评价图片等，type: others）
export function uploadFile(file, type = 'others') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return axios.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
