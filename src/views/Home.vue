<template>
  <div class="home">
    <el-carousel height="400px" :interval="5000">
      <el-carousel-item v-for="(item, index) in banners" :key="index">
        <div class="banner-item" :style="{ backgroundImage: `url(${item.image})` }">
          <div class="banner-content">
            <h2>{{ item.title }}</h2>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>

    <div class="section">
      <h2 class="section-title">推荐店铺</h2>
      <el-row :gutter="20">
        <el-col :span="6" v-for="shop in recommendedShops" :key="shop.id">
          <el-card class="shop-card" @click.native="$router.push(`/shop/${shop.id}`)">
            <img :src="shop.coverImage || '/default-shop.jpg'" class="shop-image" />
            <div class="shop-info">
              <h3 class="shop-name-row">
                <span class="shop-name-text">{{ shop.name }}</span>
                <el-button
                  type="text"
                  class="btn-location"
                  icon="el-icon-location"
                  circle
                  size="mini"
                  title="查看位置"
                  @click.stop="openShopMap(shop)"
                ></el-button>
              </h3>
              <p class="shop-address">{{ shop.address }}</p>
              <div class="shop-rating">
                <el-rate v-model="shop.rating" disabled show-score :max="5"></el-rate>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="section">
      <h2 class="section-title">热门美食</h2>
      <el-row :gutter="20">
        <el-col :span="6" v-for="food in topRatedFoods" :key="food.id">
          <el-card class="food-card" @click.native="$router.push(`/food/${food.id}`)">
            <img :src="food.image || '/default-food.jpg'" class="food-image" />
            <div class="food-info">
              <h3>{{ food.name }}</h3>
              <p class="food-shop">{{ food.shopName }}</p>
              <div class="food-footer">
                <span class="food-price">¥{{ food.price }}</span>
                <el-rate v-model="food.rating" disabled show-score :max="5" :allow-half="true"></el-rate>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <shop-map-dialog :visible.sync="shopMapVisible" :shop="currentShopForMap" />
  </div>
</template>

<script>
import { shopApi, foodApi } from '../api'
import ShopMapDialog from '../components/ShopMapDialog.vue'

export default {
  name: 'Home',
  components: { ShopMapDialog },
  data() {
    return {
      shopMapVisible: false,
      currentShopForMap: null,
      banners: [
        {
          title: '发现美食',
          description: '探索城市中的美味',
          image: '/banners/banner1.png'
        },
        {
          title: '分享体验',
          description: '记录你的美食之旅',
          image: '/banners/banner2.png'
        },
        {
          title: '品味生活',
          description: '每一口都是享受',
          image: '/banners/banner3.png'
        },
        {
          title: '美食推荐',
          description: '发现身边的好味道',
          image: '/banners/banner4.png'
        },
        {
          title: '精致料理',
          description: '用心制作每一道菜',
          image: '/banners/banner5.png'
        }
      ],
      recommendedShops: [],
      topRatedFoods: []
    }
  },
  async created() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const [shopsRes, foodsRes] = await Promise.all([
          shopApi.getRecommendedShops(),
          foodApi.getTopRatedFoods(8)
        ])
        if (shopsRes.data.code === 200) {
          this.recommendedShops = shopsRes.data.data
        }
        if (foodsRes.data.code === 200) {
          this.topRatedFoods = foodsRes.data.data
        }
      } catch (error) {
        this.$message.error('加载数据失败')
      }
    },
    openShopMap(shop) {
      this.currentShopForMap = shop
      this.shopMapVisible = true
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px 0;
}

.banner-item {
  height: 400px;
  width: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: relative;
}

.banner-content {
  text-align: center;
}

.banner-content h2 {
  font-size: 48px;
  margin-bottom: 20px;
}

.banner-content p {
  font-size: 24px;
}

.section {
  margin-top: 40px;
}

.section-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.shop-card, .food-card {
  cursor: pointer;
  margin-bottom: 20px;
}

.shop-image, .food-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.shop-name-row {
  display: flex;
  align-items: center;
  margin: 10px 0;
  font-size: 18px;
  gap: 8px;
}
.shop-name-text {
  flex: 1;
  min-width: 0;
}
.btn-location {
  flex-shrink: 0;
  padding: 4px;
  color: #409eff;
}
.btn-location:hover {
  color: #66b1ff;
}
.shop-info h3, .food-info h3 {
  margin: 10px 0;
  font-size: 18px;
}

.shop-address, .food-shop {
  color: #999;
  font-size: 14px;
  margin-bottom: 10px;
}

.shop-rating {
  display: flex;
  align-items: center;
}

.rating-text {
  margin-left: 10px;
  color: #999;
}

.food-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.food-price {
  font-size: 20px;
  color: #f56c6c;
  font-weight: bold;
}
</style>
