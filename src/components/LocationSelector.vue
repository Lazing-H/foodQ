<template>
  <el-dialog
    title="选择店铺位置"
    :visible.sync="dialogVisible"
    width="900px"
    :close-on-click-modal="true"
    @close="onDialogClose"
  >
    <!-- 第一步：省市区选择 -->
    <div v-if="step === 1" class="location-selector">
      <el-steps :active="0" align-center style="margin-bottom: 30px;">
        <el-step title="选择省市区"></el-step>
        <el-step title="地图选择精确位置"></el-step>
      </el-steps>
      <el-form :model="regionForm" label-width="120px">
                    <el-form-item label="省份" required>
                      <el-select
                        v-model="regionForm.province"
                        placeholder="请选择省份"
                        style="width: 100%"
                        :loading="loadingProvinces"
                        @change="onProvinceChange"
                      >
                        <el-option
                          v-for="province in provinces"
                          :key="province.value"
                          :label="province.label"
                          :value="province.value"
                        ></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item label="城市" required>
                      <el-select
                        v-model="regionForm.city"
                        placeholder="请先选择省份"
                        style="width: 100%"
                        :disabled="!regionForm.province"
                        :loading="loadingCities"
                        @change="onCityChange"
                      >
                        <el-option
                          v-for="city in cities"
                          :key="city.value"
                          :label="city.label"
                          :value="city.value"
                        ></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item label="区/县">
                      <el-select
                        v-model="regionForm.district"
                        placeholder="请先选择城市（可选）"
                        style="width: 100%"
                        :disabled="!regionForm.city"
                        :loading="loadingDistricts"
                        clearable
                      >
                        <el-option
                          v-for="district in districts"
                          :key="district.value"
                          :label="district.label"
                          :value="district.value"
                        ></el-option>
                      </el-select>
                      <div style="font-size: 12px; color: #909399; margin-top: 4px;">部分城市可能没有区县，可直接进入地图选择</div>
                    </el-form-item>
      </el-form>
      <div slot="footer" style="text-align: right; margin-top: 20px;">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="goToMapStep" :disabled="!regionForm.province || !regionForm.city">
          下一步：地图选择
        </el-button>
      </div>
    </div>

    <!-- 第二步：地图选择精确位置 -->
    <div v-if="step === 2" class="map-selector">
      <el-steps :active="1" align-center style="margin-bottom: 30px;">
        <el-step title="选择省市区"></el-step>
        <el-step title="地图选择精确位置"></el-step>
      </el-steps>
      <div class="selected-region" style="margin-bottom: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px;">
        <p><strong>已选择区域：</strong>{{ regionForm.province }} > {{ regionForm.city }} > {{ regionForm.district }}</p>
      </div>
      <div class="map-wrap">
        <div v-if="mapLoading" class="map-loading">
          <i class="el-icon-loading"></i>
          <span>地图加载中...</span>
        </div>
        <div v-else-if="mapError" class="map-error">
          <span>{{ mapError }}</span>
        </div>
        <div
          id="location-picker-map"
          ref="mapContainer"
          class="map-container"
        ></div>
      </div>
      <div v-if="selectedLocation" class="location-info">
        <p><strong>已选择位置：</strong></p>
        <p><strong>省市区：</strong>{{ selectedLocation.province }} > {{ selectedLocation.city }} > {{ selectedLocation.district }}</p>
        <p><i class="el-icon-location"></i> <strong>详细地址：</strong>{{ selectedLocation.address || '正在获取...' }}</p>
        <p><strong>经纬度：</strong>{{ selectedLocation.longitude }}, {{ selectedLocation.latitude }}</p>
      </div>
      <div v-else class="location-tip">
        <p>请在地图上点击选择店铺的精确位置</p>
      </div>
      <div slot="footer" style="text-align: right; margin-top: 20px;">
        <el-button @click="step = 1">上一步</el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmLocation" :disabled="!selectedLocation">确认选择</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
const BAIDU_MAP_KEY = 'Ub3szcWBOIW7gkGbt8mTX0FViNzsTmwC'

export default {
  name: 'LocationSelector',
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
      step: 1, // 1: 省市区选择, 2: 地图选择
      regionForm: {
        province: '',
        city: '',
        district: ''
      },
      selectedLocation: null,
      mapLoading: false,
      mapError: '',
      mapInstance: null,
      markerInstance: null,
      // 省市区数据缓存
      provinces: [],
      cities: [],
      districts: [],
      // 加载状态
      loadingProvinces: false,
      loadingCities: false,
      loadingDistricts: false,
      // 百度地图实例
      baiduMapInstance: null
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
  watch: {
    visible(val) {
      if (val) {
        this.step = 1
        if (this.initialLocation) {
          this.regionForm.province = this.initialLocation.province || ''
          this.regionForm.city = this.initialLocation.city || ''
          this.regionForm.district = this.initialLocation.district || ''
        }
        // 加载省份列表
        this.loadProvinces()
      }
    },
    'regionForm.province'(val) {
      if (val) {
        this.regionForm.city = ''
        this.regionForm.district = ''
        this.cities = []
        this.districts = []
        this.loadCities(val)
      }
    },
    'regionForm.city'(val) {
      if (val && this.regionForm.province) {
        this.regionForm.district = ''
        this.districts = []
        this.loadDistricts(this.regionForm.province, val)
      }
    }
  },
  methods: {
    onDialogClose() {
      this.step = 1
      this.destroyMap()
      this.mapLoading = false
      this.mapError = ''
      this.selectedLocation = null
    },
    onProvinceChange() {
      // watch 中已处理，这里可以留空或添加额外逻辑
    },
    onCityChange() {
      // watch 中已处理，这里可以留空或添加额外逻辑
    },
    goToMapStep() {
      if (!this.regionForm.province || !this.regionForm.city || !this.regionForm.district) {
        this.$message.warning('请完整选择省市区')
        return
      }
      this.step = 2
      this.$nextTick(() => {
        try {
          this.initMap()
        } catch (err) {
          this.mapError = (err && err.message) ? err.message : '地图初始化失败'
          this.mapLoading = false
        }
      })
    },
    loadBaiduMap() {
      return new Promise((resolve, reject) => {
        try {
          if (window.BMap) {
            resolve(window.BMap)
            return
          }
          const script = document.createElement('script')
          script.src = `https://api.map.baidu.com/api?v=3.0&ak=${BAIDU_MAP_KEY}&callback=initBaiduMap`
          script.async = true
          
          // 设置全局回调函数
          window.initBaiduMap = () => {
            if (window.BMap) {
              resolve(window.BMap)
            } else {
              reject(new Error('百度地图初始化失败'))
            }
            delete window.initBaiduMap
          }
          
          script.onerror = () => {
            delete window.initBaiduMap
            reject(new Error('百度地图脚本加载失败'))
          }
          document.head.appendChild(script)
        } catch (err) {
          reject(err || new Error('地图加载失败'))
        }
      })
    },
    initMap() {
      const vm = this
      vm.mapLoading = true
      vm.mapError = ''
      vm.loadBaiduMap()
        .then((BMap) => {
          try {
            vm.baiduMapInstance = BMap
            const container = document.getElementById('location-picker-map')
            if (!container) {
              vm.mapError = '地图容器不存在'
              vm.mapLoading = false
              return
            }

            // 先使用默认中心点初始化地图，确保地图能快速显示
            const defaultCenter = new BMap.Point(116.397428, 39.90923) // 默认北京天安门
            // 如果有选择的城市，尝试获取其坐标
            if (vm.regionForm.province && vm.regionForm.city) {
              const address = vm.regionForm.province + vm.regionForm.city + (vm.regionForm.district || '')
              // 先初始化地图，再异步获取中心点并更新
              vm.initMapInstance(BMap, container, defaultCenter)
              // 异步获取区域坐标并更新地图中心
              const geocoder = new BMap.Geocoder()
              geocoder.getPoint(address, (point) => {
                if (point && vm.mapInstance) {
                  vm.mapInstance.centerAndZoom(point, 14)
                }
              }, vm.regionForm.city || '全国')
            } else {
              // 没有选择区域，直接使用默认中心点初始化
              vm.initMapInstance(BMap, container, defaultCenter)
            }
          } catch (err) {
            console.error('地图初始化错误:', err)
            vm.mapError = (err && err.message) ? err.message : '地图初始化失败'
            vm.mapLoading = false
          }
        })
        .catch((e) => {
          const msg = (e && e.message) ? e.message : ''
          vm.mapError = msg || '地图加载失败，请检查百度地图 Key 配置'
          vm.mapLoading = false
        })
    },
    initMapInstance(BMap, container, center) {
      const vm = this
      try {
        vm.mapInstance = new BMap.Map(container)
        vm.mapInstance.centerAndZoom(center, 14)
        vm.mapInstance.enableScrollWheelZoom(true)

        // 如果有初始位置，显示标记
        if (vm.initialLocation && vm.initialLocation.longitude && vm.initialLocation.latitude) {
          const point = new BMap.Point(Number(vm.initialLocation.longitude), Number(vm.initialLocation.latitude))
          vm.addMarker(BMap, Number(vm.initialLocation.longitude), Number(vm.initialLocation.latitude))
          vm.selectedLocation = {
            longitude: vm.initialLocation.longitude,
            latitude: vm.initialLocation.latitude,
            address: vm.initialLocation.address || ''
          }
        }

        // 绑定地图点击事件
        vm.mapInstance.addEventListener('click', (e) => {
          const lng = e.point.lng
          const lat = e.point.lat
          vm.onMapClick(BMap, lng, lat)
        })
        
        // 保存 BMap 实例供其他方法使用
        vm.baiduMapInstance = BMap

        // 地图加载完成
        vm.mapInstance.addEventListener('tilesloaded', () => {
          vm.mapLoading = false
        })

        // 如果地图已经加载完成，直接设置 loading 为 false
        setTimeout(() => {
          if (vm.mapLoading) {
            vm.mapLoading = false
          }
        }, 1000)
      } catch (err) {
        console.error('创建地图实例失败:', err)
        vm.mapError = (err && err.message) ? err.message : '地图初始化失败'
        vm.mapLoading = false
      }
    },
    // 加载省份列表 - 使用百度地图 API
    loadProvinces() {
      const vm = this
      if (vm.provinces.length > 0) {
        return // 已加载，直接返回
      }
      vm.loadingProvinces = true
      
      // 使用百度地图 Web 服务 API - 行政区划查询
      const url = `https://api.map.baidu.com/api_region_search/v1/?keyword=中国&sub_admin=1&ak=${BAIDU_MAP_KEY}&output=json&callback=baiduProvinceCallback_${Date.now()}`
      const callbackName = `baiduProvinceCallback_${Date.now()}`
      
      // 设置全局回调
      window[callbackName] = (data) => {
        vm.loadingProvinces = false
        delete window[callbackName]
        
        if (data && data.status === 0 && data.result && data.result.length > 0) {
          // 百度地图返回的是城市列表，需要提取省份
          const provinceMap = new Map()
          data.result.forEach(item => {
            if (item.province && !provinceMap.has(item.province)) {
              provinceMap.set(item.province, item.province)
            }
            // 也检查子级数据
            if (item.cities && Array.isArray(item.cities)) {
              item.cities.forEach(city => {
                if (city.province && !provinceMap.has(city.province)) {
                  provinceMap.set(city.province, city.province)
                }
              })
            }
          })
          
          if (provinceMap.size > 0) {
            vm.provinces = Array.from(provinceMap.values())
              .map(name => ({
                label: name,
                value: name
              }))
              .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
          } else {
            // 如果提取不到省份，尝试使用百度地图的其他 API
            vm.loadProvincesByBaiduAPI()
          }
        } else {
          console.warn('百度地图 API 返回异常，尝试备用方案:', data)
          vm.loadProvincesByBaiduAPI()
        }
      }
      
      const script = document.createElement('script')
      script.src = url.replace('baiduProvinceCallback', callbackName)
      script.onerror = () => {
        vm.loadingProvinces = false
        delete window[callbackName]
        vm.loadProvincesByBaiduAPI()
      }
      document.head.appendChild(script)
    },
    // 备用方案：使用百度地图 POI 检索获取省份
    loadProvincesByBaiduAPI() {
      const vm = this
      // 使用百度地图的 POI 检索 API 获取省份（通过检索省会城市）
      const capitalCities = ['北京', '天津', '石家庄', '太原', '呼和浩特', '沈阳', '长春', '哈尔滨', '上海', '南京', '杭州', '合肥', '福州', '南昌', '济南', '郑州', '武汉', '长沙', '广州', '南宁', '海口', '重庆', '成都', '贵阳', '昆明', '拉萨', '西安', '兰州', '西宁', '银川', '乌鲁木齐']
      
      // 尝试通过地理编码获取省份信息
      if (window.BMap) {
        const geocoder = new BMap.Geocoder()
        let loadedCount = 0
        const provinceSet = new Set()
        
        capitalCities.forEach((city, index) => {
          setTimeout(() => {
            geocoder.getPoint(city, (point) => {
              if (point) {
                geocoder.getLocation(point, (result) => {
                  if (result && result.addressComponents) {
                    const province = result.addressComponents.province
                    if (province) {
                      provinceSet.add(province)
                    }
                  }
                  loadedCount++
                  if (loadedCount === capitalCities.length || provinceSet.size >= 30) {
                    if (provinceSet.size > 0) {
                      vm.provinces = Array.from(provinceSet.values())
                        .map(name => ({
                          label: name,
                          value: name
                        }))
                        .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
                    } else {
                      vm.loadStaticProvinces()
                    }
                    vm.loadingProvinces = false
                  }
                })
              } else {
                loadedCount++
                if (loadedCount === capitalCities.length) {
                  if (provinceSet.size > 0) {
                    vm.provinces = Array.from(provinceSet.values())
                      .map(name => ({
                        label: name,
                        value: name
                      }))
                      .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
                  } else {
                    vm.loadStaticProvinces()
                  }
                  vm.loadingProvinces = false
                }
              }
            })
          }, index * 50) // 避免请求过快
        })
      } else {
        // 如果百度地图未加载，使用静态数据
        vm.loadStaticProvinces()
      }
    },
    // 加载静态省份数据（最终备用方案）
    loadStaticProvinces() {
      const vm = this
      // 中国34个省级行政区
      const staticProvinces = [
        '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省',
        '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
        '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省',
        '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区', '台湾省', '香港特别行政区', '澳门特别行政区'
      ]
      vm.provinces = staticProvinces.map(name => ({
        label: name,
        value: name
      }))
      vm.loadingProvinces = false
    },
    // 加载城市列表 - 使用百度地图 API
    loadCities(provinceName) {
      const vm = this
      vm.loadingCities = true
      vm.cities = []
      
      // 使用百度地图行政区划查询 API
      const url = `https://api.map.baidu.com/api_region_search/v1/?keyword=${encodeURIComponent(provinceName)}&sub_admin=1&ak=${BAIDU_MAP_KEY}&output=json&callback=baiduCityCallback_${Date.now()}`
      const callbackName = `baiduCityCallback_${Date.now()}`
      
      // 设置全局回调
      window[callbackName] = (data) => {
        vm.loadingCities = false
        delete window[callbackName]
        
        if (data && data.status === 0 && data.result && data.result.length > 0) {
          const cities = []
          data.result.forEach(item => {
            // 提取城市信息
            if (item.level === 'city' || item.name.includes('市') || item.name.includes('州')) {
              cities.push({
                label: item.name,
                value: item.name
              })
            }
            // 也检查子级数据
            if (item.cities && Array.isArray(item.cities)) {
              item.cities.forEach(city => {
                if (!cities.find(c => c.value === city.name)) {
                  cities.push({
                    label: city.name,
                    value: city.name
                  })
                }
              })
            }
          })
          
          if (cities.length > 0) {
            vm.cities = cities
              .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
          } else {
            // 如果 API 返回为空，尝试使用地理编码获取
            vm.loadCitiesByGeocoder(provinceName)
          }
        } else {
          // API 失败，使用备用方案
          vm.loadCitiesByGeocoder(provinceName)
        }
      }
      
      const script = document.createElement('script')
      script.src = url.replace('baiduCityCallback', callbackName)
      script.onerror = () => {
        vm.loadingCities = false
        delete window[callbackName]
        vm.loadCitiesByGeocoder(provinceName)
      }
      document.head.appendChild(script)
    },
    // 备用方案：通过地理编码获取城市列表
    loadCitiesByGeocoder(provinceName) {
      const vm = this
      // 使用已知的主要城市列表（基于省份）
      const cityMap = {
        '山西省': ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'],
        '河北省': ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'],
        '河南省': ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市', '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市', '南阳市', '商丘市', '信阳市', '周口市', '驻马店市'],
        '山东省': ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'],
        '江苏省': ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
        '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
        '广东省': ['广州市', '韶关市', '深圳市', '珠海市', '汕头市', '佛山市', '江门市', '湛江市', '茂名市', '肇庆市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
        '四川省': ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市'],
        '湖北省': ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市'],
        '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市'],
        '北京市': ['北京市'],
        '上海市': ['上海市'],
        '天津市': ['天津市'],
        '重庆市': ['重庆市']
      }
      
      if (cityMap[provinceName]) {
        vm.cities = cityMap[provinceName].map(name => ({
          label: name,
          value: name
        }))
      } else {
        vm.cities = []
        vm.$message.warning('该省份的城市数据暂未配置，请手动输入城市名称')
      }
      vm.loadingCities = false
    },
    // 加载静态城市数据（备用方案）
    loadStaticCities(provinceName) {
      const vm = this
      // 主要省份的城市数据（简化版）
      const cityData = {
        '山西省': ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'],
        '河北省': ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'],
        '河南省': ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市', '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市', '南阳市', '商丘市', '信阳市', '周口市', '驻马店市'],
        '山东省': ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'],
        '江苏省': ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
        '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
        '广东省': ['广州市', '韶关市', '深圳市', '珠海市', '汕头市', '佛山市', '江门市', '湛江市', '茂名市', '肇庆市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
        '四川省': ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市'],
        '湖北省': ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市'],
        '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市'],
        '北京市': ['北京市'],
        '上海市': ['上海市'],
        '天津市': ['天津市'],
        '重庆市': ['重庆市']
      }
      
      if (cityData[provinceName]) {
        vm.cities = cityData[provinceName].map(name => ({
          label: name,
          value: name
        }))
      } else {
        // 如果省份不在列表中，尝试使用百度地图搜索
        vm.cities = []
        vm.$message.warning('该省份的城市数据暂未配置，请手动输入城市名称')
      }
    },
    // 加载区县列表 - 使用百度地图 API
    loadDistricts(provinceName, cityName) {
      const vm = this
      vm.loadingDistricts = true
      vm.districts = []
      
      // 使用百度地图行政区划查询 API
      const url = `https://api.map.baidu.com/api_region_search/v1/?keyword=${encodeURIComponent(cityName)}&sub_admin=1&ak=${BAIDU_MAP_KEY}&output=json&callback=baiduDistrictCallback_${Date.now()}`
      const callbackName = `baiduDistrictCallback_${Date.now()}`
      
      // 设置全局回调
      window[callbackName] = (data) => {
        vm.loadingDistricts = false
        delete window[callbackName]
        
        if (data && data.status === 0 && data.result && data.result.length > 0) {
          const districts = []
          data.result.forEach(item => {
            // 提取区县信息
            if (item.level === 'district' || item.name.includes('区') || item.name.includes('县') || item.name.includes('市')) {
              districts.push({
                label: item.name,
                value: item.name
              })
            }
            // 也检查子级数据
            if (item.districts && Array.isArray(item.districts)) {
              item.districts.forEach(district => {
                if (!districts.find(d => d.value === district.name)) {
                  districts.push({
                    label: district.name,
                    value: district.name
                  })
                }
              })
            }
          })
          
          if (districts.length > 0) {
            vm.districts = districts
              .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
          } else {
            // 如果 API 返回为空，可能是该城市没有区县或使用备用方案
            vm.loadDistrictsByGeocoder(cityName)
          }
        } else {
          // API 失败，使用备用方案
          vm.loadDistrictsByGeocoder(cityName)
        }
      }
      
      const script = document.createElement('script')
      script.src = url.replace('baiduDistrictCallback', callbackName)
      script.onerror = () => {
        vm.loadingDistricts = false
        delete window[callbackName]
        vm.loadDistrictsByGeocoder(cityName)
      }
      document.head.appendChild(script)
    },
    // 备用方案：通过地理编码获取区县列表
    loadDistrictsByGeocoder(cityName) {
      const vm = this
      // 主要城市的区县数据（作为备用）
      const districtData = {
        '长治市': ['潞州区', '上党区', '屯留区', '潞城区', '襄垣县', '平顺县', '黎城县', '壶关县', '长子县', '武乡县', '沁县', '沁源县'],
        '太原市': ['小店区', '迎泽区', '杏花岭区', '尖草坪区', '万柏林区', '晋源区', '清徐县', '阳曲县', '娄烦县', '古交市'],
        '北京市': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区'],
        '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'],
        '广州市': ['荔湾区', '越秀区', '海珠区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区'],
        '深圳市': ['罗湖区', '福田区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区', '坪山区', '光明区', '大鹏新区'],
        '杭州市': ['上城区', '下城区', '江干区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '富阳区', '临安区', '桐庐县', '淳安县', '建德市']
      }
      
      if (districtData[cityName]) {
        vm.districts = districtData[cityName].map(name => ({
          label: name,
          value: name
        }))
      } else {
        // 如果城市不在列表中，区县为空（可选）
        vm.districts = []
      }
      vm.loadingDistricts = false
    },
    onMapClick(BMap, lng, lat) {
      const vm = this
      if (vm.baiduMapInstance) {
        vm.addMarker(vm.baiduMapInstance, lng, lat)
      }
      // 先设置基本信息，地址稍后通过逆地理编码获取
      vm.selectedLocation = {
        longitude: lng,
        latitude: lat,
        address: '正在获取详细地址...',
        province: vm.regionForm.province,
        city: vm.regionForm.city,
        district: vm.regionForm.district
      }

      // 使用百度地图逆地理编码获取详细地址
      try {
        const geocoder = new BMap.Geocoder()
        const point = new BMap.Point(lng, lat)
        geocoder.getLocation(point, (result) => {
          try {
            if (result) {
              // 优先使用格式化地址
              let detailAddress = result.address || ''

              // 如果格式化地址为空或不完整，手动构建
              if (!detailAddress || detailAddress.trim().length < 10) {
                const parts = []
                if (result.addressComponents.province) parts.push(result.addressComponents.province)
                if (result.addressComponents.city && result.addressComponents.city !== result.addressComponents.province) {
                  parts.push(result.addressComponents.city)
                }
                if (result.addressComponents.district) parts.push(result.addressComponents.district)
                if (result.addressComponents.street) parts.push(result.addressComponents.street)
                if (result.addressComponents.streetNumber) parts.push(result.addressComponents.streetNumber)
                detailAddress = parts.join('')
              }

              // 如果还是没有，至少使用省市区
              if (!detailAddress || detailAddress.trim().length < 5) {
                detailAddress = `${result.addressComponents.province || ''}${result.addressComponents.city || ''}${result.addressComponents.district || ''}`
              }

              // 使用 Vue.set 确保响应式更新
              vm.$set(vm.selectedLocation, 'address', detailAddress || `${vm.regionForm.province}${vm.regionForm.city}${vm.regionForm.district}`)
              if (result.addressComponents.province) vm.$set(vm.selectedLocation, 'province', result.addressComponents.province)
              if (result.addressComponents.city) vm.$set(vm.selectedLocation, 'city', result.addressComponents.city)
              if (result.addressComponents.district) vm.$set(vm.selectedLocation, 'district', result.addressComponents.district)
            } else {
              // 如果逆地理编码失败，使用选择的省市区作为地址
              const fallbackAddress = `${vm.regionForm.province}${vm.regionForm.city}${vm.regionForm.district}`
              vm.$set(vm.selectedLocation, 'address', fallbackAddress)
              vm.$message.warning('无法获取详细地址，已使用选择的省市区信息，可手动修改详细地址')
            }
          } catch (err) {
            console.error('逆地理编码处理错误:', err)
            const fallbackAddress = `${vm.regionForm.province}${vm.regionForm.city}${vm.regionForm.district}`
            vm.$set(vm.selectedLocation, 'address', fallbackAddress)
            vm.$message.warning('获取详细地址时出错，已使用省市区信息，可手动修改详细地址')
          }
        })
      } catch (err) {
        console.error('逆地理编码初始化错误:', err)
        const fallbackAddress = `${vm.regionForm.province}${vm.regionForm.city}${vm.regionForm.district}`
        vm.$set(vm.selectedLocation, 'address', fallbackAddress)
        vm.$message.warning('获取详细地址时出错，已使用省市区信息，可手动修改详细地址')
      }
    },
    addMarker(BMap, lng, lat) {
      if (this.markerInstance && this.mapInstance) {
        this.mapInstance.removeOverlay(this.markerInstance)
      }
      const point = new BMap.Point(lng, lat)
      this.markerInstance = new BMap.Marker(point)
      this.mapInstance.addOverlay(this.markerInstance)
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
.location-selector {
  padding: 20px 0;
}
.map-selector {
  padding: 20px 0;
}
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
.selected-region p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}
</style>
