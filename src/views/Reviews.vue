<template>
  <div class="reviews-container">
    <div class="reviews">
      <h2>我的评价</h2>
    <div v-for="review in reviews" :key="review.id" class="review-item">
      <div class="review-header">
        <div class="review-food-info">
          <h3>{{ review.foodName }}</h3>
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
    </div>
  </div>
</template>

<script>
import { reviewApi } from '../api'

export default {
  name: 'Reviews',
  data() {
    return {
      reviews: []
    }
  },
  created() {
    this.loadReviews()
  },
  methods: {
    async loadReviews() {
      try {
        const res = await reviewApi.getMyReviews()
        if (res.data.code === 200) {
          this.reviews = res.data.data
        }
      } catch (error) {
        this.$message.error('加载评价列表失败')
      }
    },
    formatTime(time) {
      return new Date(time).toLocaleString()
    },
    getImageUrl(path) {
      if (!path) return ''
      if (path.startsWith('http://') || path.startsWith('https://')) return path
      if (path.startsWith('/uploads/')) return '/api' + path
      return '/api/uploads/' + path
    }
  }
}
</script>

<style scoped>
.reviews-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background-color: #f5f7fb;
  min-height: calc(100vh - 120px);
}

.reviews {
  width: 1100px;
  max-width: 1300px;
  padding: 20px 0;
}

.review-item {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.review-food-info h3 {
  margin-bottom: 5px;
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
</style>
