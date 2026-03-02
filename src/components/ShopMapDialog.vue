<template>
  <el-dialog
    :title="(shop && shop.name) ? shop.name + ' - 位置' : '店铺位置'"
    :visible.sync="dialogVisible"
    width="720px"
    :close-on-click-modal="true"
    @open="onDialogOpen"
    @close="onDialogClose"
  >
    <div class="map-wrap">
      <div v-if="loading" class="map-loading">
        <i class="el-icon-loading"></i>
        <span>地图加载中...</span>
      </div>
      <div v-else-if="error" class="map-error">
        <span>{{ error }}</span>
      </div>
      <div
        id="shop-map-container"
        ref="mapContainer"
        class="map-container"
      ></div>
    </div>
    <p v-if="shop && shop.address" class="map-address">
      <i class="el-icon-location"></i> {{ shop.address }}
    </p>
  </el-dialog>
</template>

<script>
const AMAP_KEY = 'ac6c9c7ab79a462db35bbbce1fea2ca0'
const DEFAULT_CENTER = [116.397428, 39.90923]
const DEFAULT_ZOOM = 14

export default {
  name: 'ShopMapDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    shop: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      error: '',
      mapInstance: null,
      markerInstance: null
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  methods: {
    onDialogOpen() {
      if (!this.shop) {
        this.error = '暂无店铺信息'
        return
      }
      this.loading = true
      this.error = ''
      this.$nextTick(() => {
        try {
          this.initMap()
        } catch (err) {
          this.error = (err && err.message) ? err.message : '地图初始化失败'
          this.loading = false
        }
      })
    },
    onDialogClose() {
      this.destroyMap()
      this.loading = false
      this.error = ''
    },
    loadAMap() {
      return new Promise((resolve, reject) => {
        if (window.AMap) {
          resolve(window.AMap)
          return
        }
        if (window.AMapLoader) {
          window.AMapLoader.load({
            key: AMAP_KEY,
            version: '2.0',
            plugins: ['AMap.Geocoder']
          }).then(resolve).catch(reject)
          return
        }
        const script = document.createElement('script')
        script.src = 'https://webapi.amap.com/loader.js'
        script.async = true
        script.onload = () => {
          window.AMapLoader.load({
            key: AMAP_KEY,
            version: '2.0',
            plugins: ['AMap.Geocoder']
          }).then(resolve).catch(reject)
        }
        script.onerror = () => reject(new Error('高德地图脚本加载失败'))
        document.head.appendChild(script)
      })
    },
    initMap() {
      const vm = this
      vm.loadAMap()
        .then((AMap) => {
          try {
            const container = document.getElementById('shop-map-container')
            if (!container) {
              vm.error = '地图容器不存在'
              vm.loading = false
              return
            }
            const lat = vm.shop && vm.shop.latitude != null ? Number(vm.shop.latitude) : null
            const lng = vm.shop && vm.shop.longitude != null ? Number(vm.shop.longitude) : null
            if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
              vm.showMapWithLngLat(AMap, container, lng, lat)
            } else if (vm.shop && vm.shop.address) {
              vm.showMapWithAddress(AMap, container)
            } else {
              vm.showMapDefault(AMap, container)
            }
          } catch (err) {
            const msg = (err && err.message) ? err.message : ''
            if (!msg || msg === 'Script error.' || msg.indexOf('USERKEY') !== -1) {
              vm.error = '地图加载失败。请在高德开放平台(lbs.amap.com)为该 Key 开通「Web 端(JS API)」并添加当前域名（如 localhost）到白名单。'
            } else {
              vm.error = msg || '地图初始化失败'
            }
          }
          vm.loading = false
        })
        .catch((e) => {
          const msg = (e && e.message) ? e.message : ''
          if (!msg || msg === 'Script error.' || msg.indexOf('USERKEY') !== -1) {
            vm.error = '地图加载失败。请在高德开放平台(lbs.amap.com)为该 Key 开通「Web 端(JS API)」并添加当前域名（如 localhost）到白名单。'
          } else {
            vm.error = msg || '地图加载失败'
          }
          vm.loading = false
        })
    },
    showMapWithLngLat(AMap, container, lng, lat) {
      try {
        this.mapInstance = new AMap.Map(container, {
          zoom: DEFAULT_ZOOM,
          center: [lng, lat],
          viewMode: '2D'
        })
        this.markerInstance = new AMap.Marker({
          position: [lng, lat],
          title: (this.shop && this.shop.name) || '店铺'
        })
        this.mapInstance.add(this.markerInstance)
      } catch (err) {
        this.error = (err && err.message) ? err.message : '地图初始化失败'
      }
    },
    showMapWithAddress(AMap, container) {
      this.mapInstance = new AMap.Map(container, {
        zoom: DEFAULT_ZOOM,
        center: DEFAULT_CENTER,
        viewMode: '2D'
      })
      AMap.plugin('AMap.Geocoder', () => {
        try {
          const geocoder = new AMap.Geocoder({
            city: (this.shop && this.shop.city) || '全国'
          })
          geocoder.getLocation(this.shop.address, (status, result) => {
            try {
              if (status === 'complete' && result && result.info === 'OK' && result.geocodes && result.geocodes.length) {
                const loc = result.geocodes[0].location
                const lng = loc.lng
                const lat = loc.lat
                if (this.mapInstance) this.mapInstance.setCenter([lng, lat])
                this.markerInstance = new AMap.Marker({
                  position: [lng, lat],
                  title: (this.shop && this.shop.name) || '店铺'
                })
                if (this.mapInstance) this.mapInstance.add(this.markerInstance)
              } else if (this.mapInstance) {
                this.showMapDefault(AMap, container)
              }
            } catch (err) {
              if (this.mapInstance) this.showMapDefault(AMap, container)
            }
          })
        } catch (err) {
          this.showMapDefault(AMap, container)
        }
      })
    },
    showMapDefault(AMap, container) {
      try {
        this.mapInstance = new AMap.Map(container, {
          zoom: DEFAULT_ZOOM,
          center: DEFAULT_CENTER,
          viewMode: '2D'
        })
        if (this.shop && this.shop.address) {
          this.$message.info('未解析到精确坐标，已显示默认位置，请根据地址查找')
        }
      } catch (err) {
        this.error = (err && err.message) ? err.message : '地图初始化失败'
      }
    },
    destroyMap() {
      try {
        if (this.markerInstance && this.mapInstance) {
          this.mapInstance.remove(this.markerInstance)
          this.markerInstance = null
        }
        if (this.mapInstance) {
          this.mapInstance.destroy()
          this.mapInstance = null
        }
      } catch (err) {
        this.mapInstance = null
        this.markerInstance = null
      }
    }
  }
}
</script>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 420px;
  background: #f0f2f5;
  border-radius: 8px;
  overflow: hidden;
}
.map-loading,
.map-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #909399;
  font-size: 14px;
}
.map-error {
  color: #f56c6c;
}
.map-container {
  width: 100%;
  height: 100%;
}
.map-address {
  margin: 12px 0 0;
  color: #606266;
  font-size: 14px;
}
.map-address i {
  margin-right: 6px;
  color: #409eff;
}
</style>
