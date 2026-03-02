<template>
  <div class="shop-detail">
    <div v-if="shop" class="shop-header">
      <img :src="shop.coverImage || '/default-shop.jpg'" class="shop-cover" />
      <div class="shop-header-info">
        <h1 class="shop-title-row">
          <span class="shop-title-text">{{ shop.name }}</span>
          <el-button
            type="primary"
            size="small"
            icon="el-icon-location"
            circle
            title="查看位置"
            @click="openMap"
          ></el-button>
        </h1>
        <p class="shop-address">{{ shop.address }}</p>
        <div class="shop-rating">
          <el-rate v-model="shop.rating" disabled show-score :max="5"></el-rate>
        </div>
        <p v-if="shop.phone" class="shop-phone">联系电话：{{ shop.phone }}</p>
        <p v-if="shop.description" class="shop-description">{{ shop.description }}</p>
      </div>
    </div>

    <div class="foods-section">
      <h2>美食列表</h2>
      <el-row :gutter="20" class="food-list-row">
        <el-col :span="6" v-for="food in foods" :key="food.id" class="food-list-col">
          <el-card class="food-card" @click.native="$router.push(`/food/${food.id}`)">
            <div class="food-image-wrap">
              <img :src="food.image || '/default-food.jpg'" class="food-image" />
            </div>
            <div class="food-info">
              <h3>{{ food.name }}</h3>
              <p class="food-price">¥{{ food.price }}</p>
              <el-rate v-model="food.rating" disabled show-score :max="5" :allow-half="true"></el-rate>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-if="foods.length === 0" description="暂无美食"></el-empty>
    </div>

    <shop-map-dialog :visible.sync="mapVisible" :shop="shop" />
  </div>
</template>

<script>
import { shopApi, foodApi } from '../api'
import ShopMapDialog from '../components/ShopMapDialog.vue'

export default {
  name: 'ShopDetail',
  components: { ShopMapDialog },
  data() {
    return {
      shop: null,
      foods: [],
      mapVisible: false
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const shopId = this.$route.params.id
        const [shopRes, foodsRes] = await Promise.all([
          shopApi.getShopById(shopId),
          foodApi.getFoodsByShopId(shopId)
        ])
        if (shopRes.data.code === 200) {
          this.shop = shopRes.data.data
        }
        if (foodsRes.data.code === 200) {
          this.foods = foodsRes.data.data
        }
      } catch (error) {
        this.$message.error('加载数据失败')
      }
    },
    openMap() {
      if (this.shop) {
        this.mapVisible = true
      }
    }
  }
}
</script>

<style scoped>
.shop-detail {
  padding: 20px 0;
}

.shop-header {
  display: flex;
  margin-bottom: 40px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.shop-cover {
  width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 20px;
}

.shop-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.shop-title-text {
  flex: 1;
  min-width: 0;
}
.shop-header-info h1 {
  margin-bottom: 10px;
}

.shop-address {
  color: #999;
  margin-bottom: 10px;
}

.shop-rating {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.rating-text {
  margin-left: 10px;
  color: #999;
}

.shop-phone {
  color: #666;
  margin-bottom: 10px;
}

.shop-description {
  color: #666;
  line-height: 1.6;
}

.foods-section {
  margin-top: 40px;
  width: 100%;
  overflow-x: hidden;
}

.foods-section h2 {
  margin-bottom: 20px;
}

/* 与其它店铺一致：每列固定 25% 宽，单列时卡片宽度与四列时一致 */
.foods-section .food-list-col {
  flex: 0 0 25% !important;
  max-width: 25% !important;
  min-width: 25% !important;
}

.food-card {
  cursor: pointer;
  margin-bottom: 20px;
  overflow: hidden;
}

/* 与首页/其他页面统一：菜品图 200px 高，与 Home 热门美食一致 */
.food-image-wrap {
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: 4px;
  background: #f5f5f5;
}

.food-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.food-info h3 {
  margin: 10px 0;
}

.food-price {
  font-size: 20px;
  color: #f56c6c;
  font-weight: bold;
  margin-bottom: 10px;
}
</style>
