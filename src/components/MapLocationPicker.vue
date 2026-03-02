<template>
  <el-dialog
    title="选择店铺位置"
    :visible.sync="dialogVisible"
    width="800px"
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
        id="location-picker-map"
        ref="mapContainer"
        class="map-container"
      ></div>
    </div>
    <div v-if="selectedLocation" class="location-info">
      <p><strong>已选择位置：</strong></p>
      <p><i class="el-icon-location"></i> {{ selectedLocation.address }}</p>
      <p v-if="selectedLocation.province">省份：{{ selectedLocation.province }}</p>
      <p v-if="selectedLocation.city">城市：{{ selectedLocation.city }}</p>
      <p v-if="selectedLocation.district">区/县：{{ selectedLocation.district }}</p>
      <p>经纬度：{{ selectedLocation.longitude }}, {{ selectedLocation.latitude }}</p>
    </div>
    <div v-else class="location-tip">
      <p>请在地图上点击选择店铺位置</p>
    </div>
    <div slot="footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmLocation" :disabled="!selectedLocation">确认选择</el-button>
    </div>
  </el-dialog>
</template>

<script>
const AMAP_KEY = 'e4aaf0571fbb3e663e0986d1795859c6'
const DEFAULT_CENTER = [113.1162, 36.1948] // 长治市潞州区中心
const DEFAULT_ZOOM = 14

export default {
  name: 'MapLocationPicker',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialLocation: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      error: '',
      mapInstance: null,
      markerInstance: null,
      selectedLocation: null
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
      this.loading = true
      this.error = ''
      this.selectedLocation = this.initialLocation ? { ...this.initialLocation } : null
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
      this.selectedLocation = null
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
            const container = document.getElementById('location-picker-map')
            if (!container) {
              vm.error = '地图容器不存在'
              vm.loading = false
              return
            }
            
            // 确定初始中心点
            let center = DEFAULT_CENTER
            if (vm.selectedLocation && vm.selectedLocation.longitude && vm.selectedLocation.latitude) {
              center = [Number(vm.selectedLocation.longitude), Number(vm.selectedLocation.latitude)]
            }
            
            vm.mapInstance = new AMap.Map(container, {
              zoom: DEFAULT_ZOOM,
              center: center,
              viewMode: '2D'
            })
            
            // 如果有初始位置，显示标记
            if (vm.selectedLocation && vm.selectedLocation.longitude && vm.selectedLocation.latitude) {
              vm.addMarker(AMap, center[0], center[1])
            }
            
            // 绑定地图点击事件
            vm.mapInstance.on('click', (e) => {
              const lng = e.lnglat.lng
              const lat = e.lnglat.lat
              vm.onMapClick(AMap, lng, lat)
            })
            
            vm.loading = false
          } catch (err) {
            vm.error = (err && err.message) ? err.message : '地图初始化失败'
            vm.loading = false
          }
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
    onMapClick(AMap, lng, lat) {
      const vm = this
      // 添加标记
      vm.addMarker(AMap, lng, lat)
      
      // 使用逆地理编码获取地址信息
      AMap.plugin('AMap.Geocoder', () => {
        try {
          const geocoder = new AMap.Geocoder()
          geocoder.getAddress([lng, lat], (status, result) => {
            try {
              if (status === 'complete' && result && result.info === 'OK' && result.regeocode) {
                const regeocode = result.regeocode
                const addressComponent = regeocode.addressComponent
                
                vm.selectedLocation = {
                  longitude: lng,
                  latitude: lat,
                  address: regeocode.formattedAddress || regeocode.address || '未知地址',
                  province: addressComponent.province || '',
                  city: addressComponent.city || addressComponent.province || '',
                  district: addressComponent.district || ''
                }
              } else {
                // 如果逆地理编码失败，至少保存经纬度
                vm.selectedLocation = {
                  longitude: lng,
                  latitude: lat,
                  address: `经度: ${lng}, 纬度: ${lat}`,
                  province: '',
                  city: '',
                  district: ''
                }
              }
            } catch (err) {
              vm.selectedLocation = {
                longitude: lng,
                latitude: lat,
                address: `经度: ${lng}, 纬度: ${lat}`,
                province: '',
                city: '',
                district: ''
              }
            }
          })
        } catch (err) {
          vm.selectedLocation = {
            longitude: lng,
            latitude: lat,
            address: `经度: ${lng}, 纬度: ${lat}`,
            province: '',
            city: '',
            district: ''
          }
        }
      })
    },
    addMarker(AMap, lng, lat) {
      if (this.markerInstance && this.mapInstance) {
        this.mapInstance.remove(this.markerInstance)
      }
      this.markerInstance = new AMap.Marker({
        position: [lng, lat],
        title: '选择的位置'
      })
      this.mapInstance.add(this.markerInstance)
      this.mapInstance.setCenter([lng, lat])
    },
    confirmLocation() {
      if (this.selectedLocation) {
        this.$emit('location-selected', this.selectedLocation)
        this.dialogVisible = false
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
  height: 500px;
  background: #f0f2f5;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
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
.location-info {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
}
.location-info p {
  margin: 6px 0;
  font-size: 14px;
  color: #606266;
}
.location-info p:first-child {
  font-weight: bold;
  color: #303133;
}
.location-tip {
  padding: 12px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
