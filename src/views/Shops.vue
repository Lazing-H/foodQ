<template>
  <div class="shops">
    <el-row :gutter="20">
      <el-col :span="6" v-for="shop in shops" :key="shop.id">
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
                @click.stop="openMap(shop)"
              ></el-button>
            </h3>
            <p class="shop-address">{{ shop.address }}</p>
            <div class="shop-rating">
              <el-rate v-model="shop.rating" disabled show-score :max="5"></el-rate>
            </div>
            <el-tag v-if="shop.isRecommended" type="success" size="small" style="margin-top: 10px">
              推荐
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="shops.length === 0" description="暂无店铺"></el-empty>

    <shop-map-dialog :visible.sync="mapVisible" :shop="currentShop" />
  </div>
</template>

<script>
import { shopApi } from '../api'
import ShopMapDialog from '../components/ShopMapDialog.vue'

export default {
  name: 'Shops',
  components: { ShopMapDialog },
  data() {
    return {
      shops: [],
      mapVisible: false,
      currentShop: null
    }
  },
  created() {
    this.loadShops()
  },
  methods: {
    async loadShops() {
      try {
        const res = await shopApi.getShopList({})
        if (res.data.code === 200) {
          this.shops = res.data.data
        }
      } catch (error) {
        this.$message.error('加载店铺列表失败')
      }
    },
    openMap(shop) {
      this.currentShop = shop
      this.mapVisible = true
    }
  }
}
</script>

<style scoped>
.shops {
  padding: 20px 0;
}

.shop-card {
  cursor: pointer;
  margin-bottom: 20px;
}

.shop-image {
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
.shop-info h3 {
  margin: 10px 0;
  font-size: 18px;
}

.shop-address {
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
</style>
