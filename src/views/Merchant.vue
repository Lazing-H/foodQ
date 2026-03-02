<template>
  <div class="merchant">
    <h2>商家管理</h2>
    <el-tabs v-model="activeTab">
      <!-- 店铺管理 -->
      <el-tab-pane label="我的店铺" name="shops">
        <el-button type="primary" @click="showShopDialog = true" style="margin-bottom: 20px">
          添加店铺
        </el-button>
        <el-table :data="shops" class="list-table">
          <el-table-column prop="name" label="店铺名称" min-width="180"></el-table-column>
          <el-table-column prop="address" label="地址" min-width="200"></el-table-column>
          <el-table-column prop="phone" label="联系电话" min-width="130"></el-table-column>
          <el-table-column prop="rating" label="评分" min-width="120">
            <template slot-scope="scope">
              <el-rate v-model="scope.row.rating" disabled show-score :max="5"></el-rate>
            </template>
          </el-table-column>
          <el-table-column label="状态" min-width="100">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.status === 1" type="success">营业中</el-tag>
              <el-tag v-else type="info">已关闭</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="160">
            <template slot-scope="scope">
              <el-button size="small" @click="editShop(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteShop(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="shops.length === 0" description="暂无店铺"></el-empty>
      </el-tab-pane>

      <!-- 菜品管理 -->
      <el-tab-pane label="我的菜品" name="foods">
        <div style="margin-bottom: 20px">
          <el-select v-model="selectedShopId" placeholder="选择店铺查看菜品" clearable style="width: 200px; margin-right: 10px" @change="loadFoods">
            <el-option v-for="shop in shops" :key="shop.id" :label="shop.name" :value="shop.id"></el-option>
          </el-select>
          <el-button type="primary" @click="showFoodDialog = true" :disabled="!selectedShopId">
            添加菜品
          </el-button>
        </div>
        <el-table :data="foods" class="list-table">
          <el-table-column prop="name" label="菜品名称" min-width="160"></el-table-column>
          <el-table-column prop="shopName" label="所属店铺" min-width="140"></el-table-column>
          <el-table-column prop="price" label="价格" min-width="100">
            <template slot-scope="scope">
              ¥{{ scope.row.price }}
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" min-width="100"></el-table-column>
          <el-table-column prop="rating" label="评分" min-width="120">
            <template slot-scope="scope">
              <el-rate v-model="scope.row.rating" disabled show-score :max="5"></el-rate>
            </template>
          </el-table-column>
          <el-table-column label="状态" min-width="90">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.status === 1" type="success">上架</el-tag>
              <el-tag v-else type="info">下架</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="160">
            <template slot-scope="scope">
              <el-button size="small" @click="editFood(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteFood(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="foods.length === 0" description="暂无菜品"></el-empty>
      </el-tab-pane>
    </el-tabs>

    <!-- 店铺对话框 -->
    <el-dialog :title="shopDialogTitle" :visible.sync="showShopDialog" width="700px">
      <el-form :model="shopForm" label-width="120px">
        <el-form-item label="店铺名称" required>
          <el-input v-model="shopForm.name"></el-input>
        </el-form-item>
        <el-form-item label="省市区" required>
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-input
              :value="getRegionText()"
              placeholder="点击右侧按钮选择省市区"
              readonly
              style="flex: 1;"
            ></el-input>
            <el-button type="primary" icon="el-icon-location" @click="showLocationPicker = true">选择位置</el-button>
          </div>
        </el-form-item>
        <el-form-item label="详细地址" required>
          <el-input
            v-model="shopForm.address"
            placeholder="选择位置后将自动填充详细地址，也可手动修改"
          ></el-input>
          <div v-if="shopForm.longitude && shopForm.latitude" style="margin-top: 8px; font-size: 12px; color: #909399;">
            经纬度：{{ shopForm.longitude }}, {{ shopForm.latitude }}
          </div>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="shopForm.phone"></el-input>
        </el-form-item>
        <el-form-item label="店铺描述">
          <el-input v-model="shopForm.description" type="textarea" :rows="4"></el-input>
        </el-form-item>
        <el-form-item label="封面图片">
          <el-upload
            class="cover-uploader"
            action="/api/upload"
            :data="{ type: 'shops' }"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            :before-upload="beforeUpload"
            :headers="uploadHeaders"
          >
            <img v-if="shopForm.coverImage" :src="getImageUrl(shopForm.coverImage)" class="cover-image" />
            <i v-else class="el-icon-plus cover-uploader-icon"></i>
          </el-upload>
          <div class="upload-tip">点击上传店铺封面图片</div>
        </el-form-item>
        <el-form-item label="营业状态">
          <el-switch v-model="shopForm.status" :active-value="1" :inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showShopDialog = false">取消</el-button>
        <el-button type="primary" @click="saveShop">保存</el-button>
      </div>
    </el-dialog>

    <!-- 菜品对话框 -->
    <el-dialog :title="foodDialogTitle" :visible.sync="showFoodDialog" width="600px">
      <el-form :model="foodForm" label-width="100px">
        <el-form-item label="菜品名称" required>
          <el-input v-model="foodForm.name"></el-input>
        </el-form-item>
        <el-form-item label="所属店铺" required>
          <el-select v-model="foodForm.shopId" placeholder="请选择店铺" style="width: 100%">
            <el-option v-for="shop in shops" :key="shop.id" :label="shop.name" :value="shop.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input-number v-model="foodForm.price" :min="0" :precision="2" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="foodForm.category" placeholder="例如：主食、小吃、饮品"></el-input>
        </el-form-item>
        <el-form-item label="菜品描述">
          <el-input v-model="foodForm.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="菜品图片">
          <el-upload
            class="food-uploader"
            action="/api/upload"
            :data="{ type: 'foods' }"
            :show-file-list="false"
            :on-success="handleFoodImageSuccess"
            :before-upload="beforeUpload"
            :headers="uploadHeaders"
          >
            <img v-if="foodForm.image" :src="getImageUrl(foodForm.image)" class="food-image" />
            <i v-else class="el-icon-plus food-uploader-icon"></i>
          </el-upload>
          <div class="upload-tip">点击上传菜品图片</div>
        </el-form-item>
        <el-form-item label="上架状态">
          <el-switch v-model="foodForm.status" :active-value="1" :inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showFoodDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFood">保存</el-button>
      </div>
    </el-dialog>

    <!-- 位置选择器（省市区 + 地图） -->
    <location-selector
      :visible.sync="showLocationPicker"
      :initial-location="shopForm.longitude && shopForm.latitude ? {
        longitude: shopForm.longitude,
        latitude: shopForm.latitude,
        address: shopForm.address,
        province: shopForm.province,
        city: shopForm.city,
        district: shopForm.district
      } : null"
      @location-selected="handleLocationSelected"
    />
  </div>
</template>

<script>
import { shopApi, foodApi } from '../api'
import LocationSelector from '../components/LocationSelector.vue'

export default {
  name: 'Merchant',
  components: { LocationSelector },
  data() {
    return {
      activeTab: 'shops',
      shops: [],
      foods: [],
      selectedShopId: null,
      showShopDialog: false,
      showFoodDialog: false,
      showLocationPicker: false,
      editingShopId: null,
      editingFoodId: null,
      shopForm: {
        name: '',
        address: '',
        province: '',
        city: '',
        district: '',
        phone: '',
        description: '',
        coverImage: '',
        status: 1
      },
      foodForm: {
        name: '',
        shopId: null,
        price: 0,
        category: '',
        description: '',
        image: '',
        status: 1
      }
    }
  },
  computed: {
    shopDialogTitle() {
      return this.editingShopId ? '编辑店铺' : '添加店铺'
    },
    foodDialogTitle() {
      return this.editingFoodId ? '编辑菜品' : '添加菜品'
    },
    uploadHeaders() {
      const token = this.$store.state.token
      return token ? { Authorization: 'Bearer ' + token } : {}
    }
  },
  created() {
    this.loadShops()
  },
  methods: {
    async loadShops() {
      try {
        const res = await shopApi.getMyShops()
        if (res.data.code === 200) {
          this.shops = res.data.data
          if (this.shops.length > 0 && !this.selectedShopId) {
            this.selectedShopId = this.shops[0].id
            this.loadFoods()
          }
        }
      } catch (error) {
        this.$message.error('加载店铺列表失败')
      }
    },
    async loadFoods() {
      if (!this.selectedShopId) {
        this.foods = []
        return
      }
      try {
        const res = await foodApi.getMyFoods(this.selectedShopId)
        if (res.data.code === 200) {
          this.foods = res.data.data
        }
      } catch (error) {
        this.$message.error('加载菜品列表失败')
      }
    },
    editShop(shop) {
      this.editingShopId = shop.id
      this.shopForm = { ...shop }
      this.showShopDialog = true
    },
    editFood(food) {
      this.editingFoodId = food.id
      this.foodForm = { ...food }
      this.showFoodDialog = true
    },
    async saveShop() {
      if (!this.shopForm.name) {
        this.$message.warning('请填写店铺名称')
        return
      }
      if (!this.shopForm.province || !this.shopForm.city || !this.shopForm.district) {
        this.$message.warning('请点击"选择位置"按钮选择省市区')
        return
      }
      if (!this.shopForm.address) {
        this.$message.warning('请填写详细地址')
        return
      }
      if (!this.shopForm.longitude || !this.shopForm.latitude) {
        this.$message.warning('请在地图上选择精确位置')
        return
      }
      try {
        // 确保必填字段有值
        const shopData = {
          ...this.shopForm,
          rating: this.shopForm.rating || 0,
          ratingCount: this.shopForm.ratingCount || 0,
          status: this.shopForm.status !== undefined ? this.shopForm.status : 1,
          isRecommended: this.shopForm.isRecommended !== undefined ? this.shopForm.isRecommended : 0
        }

        if (this.editingShopId) {
          shopData.id = this.editingShopId
          const res = await shopApi.updateMyShop(shopData)
          if (res.data.code === 200) {
            this.$message.success('更新成功')
            this.showShopDialog = false
            this.resetShopForm()
            this.loadShops()
          } else {
            this.$message.error(res.data.message || '更新失败')
          }
        } else {
          const res = await shopApi.createMyShop(shopData)
          if (res.data.code === 200) {
            this.$message.success('创建成功')
            this.showShopDialog = false
            this.resetShopForm()
            this.loadShops()
          } else {
            this.$message.error(res.data.message || '创建失败')
          }
        }
      } catch (error) {
        console.error('保存店铺失败:', error)
        this.$message.error(error.response?.data?.message || '保存失败，请检查网络连接')
      }
    },
    async saveFood() {
      if (!this.foodForm.name || !this.foodForm.shopId || this.foodForm.price == null) {
        this.$message.warning('请填写菜品名称、选择店铺和价格')
        return
      }
      try {
        // 确保必填字段有值
        const foodData = {
          ...this.foodForm,
          rating: this.foodForm.rating || 0,
          ratingCount: this.foodForm.ratingCount || 0,
          salesCount: this.foodForm.salesCount || 0,
          status: this.foodForm.status !== undefined ? this.foodForm.status : 1
        }

        if (this.editingFoodId) {
          foodData.id = this.editingFoodId
          const res = await foodApi.updateMyFood(foodData)
          if (res.data.code === 200) {
            this.$message.success('更新成功')
            this.showFoodDialog = false
            this.resetFoodForm()
            this.loadFoods()
          } else {
            this.$message.error(res.data.message || '更新失败')
          }
        } else {
          const res = await foodApi.createMyFood(foodData)
          if (res.data.code === 200) {
            this.$message.success('创建成功')
            this.showFoodDialog = false
            this.resetFoodForm()
            this.loadFoods()
          } else {
            this.$message.error(res.data.message || '创建失败')
          }
        }
      } catch (error) {
        console.error('保存菜品失败:', error)
        this.$message.error(error.response?.data?.message || '保存失败，请检查网络连接')
      }
    },
    async deleteShop(id) {
      try {
        await this.$confirm('确定要删除这个店铺吗？删除后该店铺的所有菜品也会被删除', '提示', {
          type: 'warning'
        })
        const res = await shopApi.deleteMyShop(id)
        if (res.data.code === 200) {
          this.$message.success('删除成功')
          this.loadShops()
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    async deleteFood(id) {
      try {
        await this.$confirm('确定要删除这个菜品吗？', '提示', {
          type: 'warning'
        })
        const res = await foodApi.deleteMyFood(id)
        if (res.data.code === 200) {
          this.$message.success('删除成功')
          this.loadFoods()
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    handleCoverSuccess(response) {
      if (response.code === 200) {
        this.shopForm.coverImage = response.data
        this.$message.success('图片上传成功')
      } else {
        this.$message.error(response.message || '图片上传失败')
      }
    },
    handleFoodImageSuccess(response) {
      if (response.code === 200) {
        this.foodForm.image = response.data
        this.$message.success('图片上传成功')
      } else {
        this.$message.error(response.message || '图片上传失败')
      }
    },
    getImageUrl(path) {
      if (!path) return ''
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path
      }
      if (path.startsWith('/uploads/')) {
        return '/api' + path
      }
      return '/api/uploads/' + path
    },
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt10M = file.size / 1024 / 1024 < 10

      if (!isImage) {
        this.$message.error('只能上传图片文件!')
        return false
      }
      if (!isLt10M) {
        this.$message.error('图片大小不能超过 10MB!')
        return false
      }
      return true
    },
    getRegionText() {
      if (this.shopForm.province && this.shopForm.city && this.shopForm.district) {
        return `${this.shopForm.province} > ${this.shopForm.city} > ${this.shopForm.district}`
      }
      return ''
    },
    handleLocationSelected(location) {
      // 先设置省市区
      this.shopForm.province = location.province
      this.shopForm.city = location.city
      this.shopForm.district = location.district
      // 设置详细地址（如果逆地理编码成功，会有详细地址；否则使用省市区）
      this.shopForm.address = location.address || `${location.province}${location.city}${location.district}`
      // 设置经纬度
      this.shopForm.longitude = location.longitude
      this.shopForm.latitude = location.latitude
      this.$message.success('位置已选择')
    },
    resetShopForm() {
      this.editingShopId = null
      this.shopForm = {
        name: '',
        address: '',
        province: '',
        city: '',
        district: '',
        longitude: null,
        latitude: null,
        phone: '',
        description: '',
        coverImage: '',
        status: 1
      }
    },
    resetFoodForm() {
      this.editingFoodId = null
      this.foodForm = {
        name: '',
        shopId: this.selectedShopId,
        price: 0,
        category: '',
        description: '',
        image: '',
        status: 1
      }
    }
  },
  watch: {
    showShopDialog(val) {
      if (!val) {
        this.resetShopForm()
      }
    },
    showFoodDialog(val) {
      if (!val) {
        this.resetFoodForm()
      } else {
        this.foodForm.shopId = this.selectedShopId
      }
    }
  }
}
</script>

<style scoped>
.merchant {
  padding: 20px;
}

.merchant h2 {
  margin-bottom: 20px;
}

.cover-uploader,
.food-uploader {
  display: inline-block;
}

.cover-uploader-icon,
.food-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.cover-uploader-icon:hover,
.food-uploader-icon:hover {
  border-color: #409eff;
}

.cover-image,
.food-image {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
  border-radius: 6px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 列表表格铺满宽度、按比例自适应，表头与内容线对齐 */
.list-table {
  width: 100% !important;
}
.list-table .el-table__body,
.list-table .el-table__header {
  width: 100% !important;
}
.list-table .el-table__body-wrapper table,
.list-table .el-table__header-wrapper table {
  width: 100% !important;
}
</style>
