<template>
  <div class="food-detail" v-if="food">
    <div class="food-header">
      <img :src="food.image || '/default-food.jpg'" class="food-main-image" />
      <div class="food-info">
        <h1>{{ food.name }}</h1>
        <p class="food-shop">来自：{{ food.shopName }}</p>
        <p class="food-price">¥{{ food.price }}</p>
        <el-rate v-model="food.rating" disabled show-score :max="5" :allow-half="true"></el-rate>
        <p class="food-description">{{ food.description }}</p>
        <div class="food-actions">
          <el-button type="primary" @click="showOrderDialog = true" v-if="isLoggedIn">
            立即下单
          </el-button>
          <el-button type="success" @click="openShareDialog" v-if="isLoggedIn" icon="el-icon-share">
            分享给好友
          </el-button>
        </div>
      </div>  
    </div>

    <div class="reviews-section">
      <h2>用户评价</h2>
      <div v-for="review in reviews" :key="review.id" class="review-item">
        <div class="review-header">
          <el-avatar :src="review.userAvatar" :size="40"></el-avatar>
          <div class="review-user-info">
            <span class="review-username">{{ review.userName }}</span>
            <el-rate v-model="review.rating" disabled :max="5"></el-rate>
          </div>
          <span class="review-time">{{ formatTime(review.createTime) }}</span>
        </div>
        <p class="review-content">{{ review.content }}</p>
        <div v-if="review.images && review.images.length > 0" class="review-images">
          <img v-for="img in review.images" :key="img.id" :src="getImageUrl(img.imageUrl)" class="review-image" />
        </div>
      </div>
      <el-empty v-if="reviews.length === 0" description="暂无评价"></el-empty>
      <el-button v-if="isLoggedIn && orderId && !hasReviewed" type="primary" @click="showReviewDialog = true" style="margin-top: 20px">
        写评价
      </el-button>
    </div>

    <el-dialog title="写评价" :visible.sync="showReviewDialog" width="600px">
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="reviewForm.rating" :max="5"></el-rate>
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="reviewForm.content" type="textarea" :rows="5" placeholder="写下你的评价..."></el-input>
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="#"
            list-type="picture-card"
            :file-list="reviewForm.imageList"
            :on-preview="handlePreview"
            :on-change="handleReviewImageChange"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :auto-upload="false"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateReview" :loading="reviewLoading">提交评价</el-button>
      </div>
    </el-dialog>

    <el-dialog title="分享给好友" :visible.sync="showShareDialog" width="500px">
      <el-form :model="shareForm" label-width="80px">
        <el-form-item label="选择好友">
          <el-select v-model="shareForm.friendId" placeholder="请选择要分享的好友" style="width: 100%">
            <el-option
              v-for="friend in friends"
              :key="friend.friendId"
              :label="friend.friendNickname || friend.friendUsername || '好友'"
              :value="friend.friendId">
              <div style="display: flex; align-items: center;">
                <el-avatar :src="friend.friendAvatar" :size="30" style="margin-right: 10px;"></el-avatar>
                <span>{{ friend.friendNickname || friend.friendUsername || '好友' }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="留言">
          <el-input
            v-model="shareForm.message"
            type="textarea"
            :rows="3"
            placeholder="给好友留个言吧~（可选）">
          </el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button type="primary" @click="handleShareFood" :loading="shareLoading">确认分享</el-button>
      </div>
    </el-dialog>

    <el-dialog title="下单" :visible.sync="showOrderDialog" width="500px">
      <el-form :model="orderForm" label-width="80px">
        <el-form-item label="数量">
          <el-input-number v-model="orderForm.quantity" :min="1" :max="10"></el-input-number>
        </el-form-item>
        <el-form-item label="配送地址">
          <el-input v-model="orderForm.address" placeholder="请输入配送地址"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="orderForm.remark" type="textarea" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item label="总金额">
          <span class="total-amount">¥{{ (food.price * orderForm.quantity).toFixed(2) }}</span>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showOrderDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateOrder" :loading="orderLoading">确认下单</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { foodApi, reviewApi, orderApi, userApi, shareApi, uploadFile } from '../api'
import { mapGetters } from 'vuex'

export default {
  name: 'FoodDetail',
  data() {
    return {
      food: null,
      reviews: [],
      showOrderDialog: false,
      showReviewDialog: false,
      showShareDialog: false,
      orderId: null,
      hasReviewed: false,
      friends: [],
      shareForm: {
        friendId: null,
        message: ''
      },
      shareLoading: false,
      orderForm: {
        quantity: 1,
        address: '',
        remark: ''
      },
      orderLoading: false,
      reviewForm: {
        rating: 5,
        content: '',
        imageList: []
      },
      reviewLoading: false
    }
  },
  computed: {
    ...mapGetters(['isLoggedIn'])
  },
  created() {
    this.syncOrderIdFromRoute()
    this.loadData()
  },
  watch: {
    $route: {
      handler() {
        this.syncOrderIdFromRoute()
        this.loadData()
      }
    },
    showShareDialog(val) {
      if (val && this.isLoggedIn) {
        this.loadFriends()
      }
    }
  },
  methods: {
    syncOrderIdFromRoute() {
      const q = this.$route.query.orderId
      this.orderId = (q != null && q !== '') ? q : null
    },
    async loadData() {
      try {
        const foodId = this.$route.params.id
        const [foodRes, reviewsRes] = await Promise.all([
          foodApi.getFoodById(foodId),
          reviewApi.getReviewsByFoodId(foodId)
        ])
        if (foodRes.data.code === 200) {
          this.food = foodRes.data.data
        }
        if (reviewsRes.data.code === 200) {
          this.reviews = reviewsRes.data.data
          // 检查是否已评价
          if (this.orderId) {
            this.hasReviewed = this.reviews.some(r => r.orderId === parseInt(this.orderId))
          }
        }
      } catch (error) {
        this.$message.error('加载数据失败')
      }
    },
    getImageUrl(path) {
      if (!path) return ''
      if (path.startsWith('http://') || path.startsWith('https://')) return path
      if (path.startsWith('/uploads/')) return '/api' + path
      return '/api/uploads/' + path
    },
    async handleCreateReview() {
      if (!this.reviewForm.rating) {
        this.$message.warning('请选择评分')
        return
      }
      this.reviewLoading = true
      try {
        const imageUrls = []
        for (const item of this.reviewForm.imageList) {
          const file = this.getReviewImageRawFile(item)
          if (!file) continue
          const upRes = await uploadFile(file, 'others')
          if (upRes.data && upRes.data.code === 200 && upRes.data.data) {
            imageUrls.push(upRes.data.data)
          }
        }
        const orderIdNum = this.orderId != null && this.orderId !== ''
          ? parseInt(this.orderId, 10)
          : null
        const res = await reviewApi.createReview({
          foodId: this.food.id,
          orderId: orderIdNum,
          rating: this.reviewForm.rating,
          content: this.reviewForm.content,
          imageUrls
        })
        if (res.data.code === 200) {
          if (orderIdNum != null) {
            try {
              await orderApi.updateOrderStatus(orderIdNum, 'COMPLETED')
            } catch (e) {
              console.error('更新订单状态失败:', e)
            }
          }
          this.$message.success('评价成功')
          this.showReviewDialog = false
          this.reviewForm = {
            rating: 5,
            content: '',
            imageList: []
          }
          this.loadData()
        } else {
          this.$message.error(res.data.message)
        }
      } catch (error) {
        this.$message.error(error.response?.data?.message || '评价失败')
      } finally {
        this.reviewLoading = false
      }
    },
    getReviewImageRawFile(item) {
      if (!item) return null
      if (item.raw && item.raw instanceof File) return item.raw
      if (item instanceof File) return item
      return null
    },
    handleReviewImageChange(file, fileList) {
      this.reviewForm.imageList = fileList
    },
    handlePreview(file) {
      // 预览图片
    },
    handleRemove(file, fileList) {
      this.reviewForm.imageList = fileList
    },
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isImage) {
        this.$message.error('只能上传图片文件')
        return false
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过2MB')
        return false
      }
      return false
    },
    async handleCreateOrder() {
      if (!this.orderForm.address) {
        this.$message.warning('请输入配送地址')
        return
      }
      this.orderLoading = true
      try {
        const res = await orderApi.createOrder({
          shopId: this.food.shopId,
          items: [{
            foodId: this.food.id,
            quantity: this.orderForm.quantity
          }],
          address: this.orderForm.address,
          remark: this.orderForm.remark
        })
        if (res.data.code === 200) {
          this.$message.success('下单成功')
          this.showOrderDialog = false
          this.$router.push('/orders')
        } else {
          this.$message.error(res.data.message)
        }
      } catch (error) {
        this.$message.error(error.response?.data?.message || '下单失败')
      } finally {
        this.orderLoading = false
      }
    },
    formatTime(time) {
      return new Date(time).toLocaleString()
    },
    async loadFriends() {
      try {
        const res = await userApi.getFriends()
        if (res.data.code === 200) {
          this.friends = res.data.data || []
        }
      } catch (error) {
        console.error('加载好友列表失败:', error)
      }
    },
    openShareDialog() {
      this.showShareDialog = true
    },
    async handleShareFood() {
      if (!this.shareForm.friendId) {
        this.$message.warning('请选择要分享的好友')
        return
      }
      this.shareLoading = true
      try {
        const res = await shareApi.shareFood({
          friendId: this.shareForm.friendId,
          foodId: this.food.id,
          message: this.shareForm.message || null
        })
        if (res.data.code === 200) {
          this.$message.success('分享成功')
          this.showShareDialog = false
          this.shareForm = {
            friendId: null,
            message: ''
          }
        } else {
          this.$message.error(res.data.message || '分享失败')
        }
      } catch (error) {
        this.$message.error(error.response?.data?.message || '分享失败')
      } finally {
        this.shareLoading = false
      }
    }
  }
}
</script>

<style scoped>
.food-detail {
  padding: 20px 0;
}

.food-header {
  display: flex;
  margin-bottom: 40px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.food-main-image {
  width: 400px;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 20px;
}

.food-info h1 {
  margin-bottom: 10px;
}

.food-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.food-shop {
  color: #999;
  margin-bottom: 10px;
}

.food-price {
  font-size: 32px;
  color: #f56c6c;
  font-weight: bold;
  margin: 20px 0;
}

.food-description {
  color: #666;
  line-height: 1.6;
  margin: 20px 0;
}

.reviews-section {
  margin-top: 40px;
}

.reviews-section h2 {
  margin-bottom: 20px;
}

.review-item {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.review-user-info {
  margin-left: 10px;
  flex: 1;
}

.review-username {
  font-weight: bold;
  margin-right: 10px;
}

.review-time {
  color: #999;
  font-size: 12px;
}

.review-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.review-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.total-amount {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}
</style>
