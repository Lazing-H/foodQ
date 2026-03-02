<template>
  <div class="admin">
    <h2>管理后台</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="店铺管理" name="shops">
        <el-button type="primary" @click="showShopDialog = true" style="margin-bottom: 20px">
          添加店铺
        </el-button>
        <el-table :data="shops" class="list-table">
          <el-table-column prop="name" label="店铺名称" min-width="180"></el-table-column>
          <el-table-column prop="address" label="地址" min-width="200"></el-table-column>
          <el-table-column prop="rating" label="评分" min-width="120"></el-table-column>
          <el-table-column label="推荐" min-width="100">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.isRecommended" type="success">是</el-tag>
              <el-tag v-else>否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="160">
            <template slot-scope="scope">
              <el-button size="small" @click="editShop(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteShop(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="美食管理" name="foods">
        <el-button type="primary" @click="showFoodDialog = true" style="margin-bottom: 20px">
          添加美食
        </el-button>
        <el-table :data="foods" class="list-table">
          <el-table-column prop="name" label="美食名称" min-width="160"></el-table-column>
          <el-table-column prop="shopName" label="所属店铺" min-width="140"></el-table-column>
          <el-table-column prop="price" label="价格" min-width="100">
            <template slot-scope="scope">
              ¥{{ scope.row.price }}
            </template>
          </el-table-column>
          <el-table-column prop="rating" label="评分" min-width="100"></el-table-column>
          <el-table-column label="操作" min-width="160">
            <template slot-scope="scope">
              <el-button size="small" @click="editFood(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteFood(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 店铺对话框 -->
    <el-dialog :title="shopDialogTitle" :visible.sync="showShopDialog" width="600px">
      <el-form :model="shopForm" label-width="100px">
        <el-form-item label="店铺名称">
          <el-input v-model="shopForm.name"></el-input>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="shopForm.address"></el-input>
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="shopForm.city"></el-input>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="shopForm.phone"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="shopForm.description" type="textarea"></el-input>
        </el-form-item>
        <el-form-item label="是否推荐">
          <el-switch v-model="shopForm.isRecommended" :active-value="1" :inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showShopDialog = false">取消</el-button>
        <el-button type="primary" @click="saveShop">保存</el-button>
      </div>
    </el-dialog>

    <!-- 美食对话框 -->
    <el-dialog :title="foodDialogTitle" :visible.sync="showFoodDialog" width="600px">
      <el-form :model="foodForm" label-width="100px">
        <el-form-item label="美食名称">
          <el-input v-model="foodForm.name"></el-input>
        </el-form-item>
        <el-form-item label="所属店铺">
          <el-select v-model="foodForm.shopId" placeholder="请选择店铺">
            <el-option v-for="shop in shops" :key="shop.id" :label="shop.name" :value="shop.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="foodForm.price" :min="0" :precision="2"></el-input-number>
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="foodForm.category"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="foodForm.description" type="textarea"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showFoodDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFood">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { shopApi, foodApi } from '../api'

export default {
  name: 'Admin',
  data() {
    return {
      activeTab: 'shops',
      shops: [],
      foods: [],
      showShopDialog: false,
      showFoodDialog: false,
      shopForm: {
        name: '',
        address: '',
        city: '',
        phone: '',
        description: '',
        isRecommended: 0
      },
      foodForm: {
        name: '',
        shopId: null,
        price: 0,
        category: '',
        description: ''
      },
      editingShopId: null,
      editingFoodId: null
    }
  },
  computed: {
    shopDialogTitle() {
      return this.editingShopId ? '编辑店铺' : '添加店铺'
    },
    foodDialogTitle() {
      return this.editingFoodId ? '编辑美食' : '添加美食'
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      await Promise.all([this.loadShops(), this.loadFoods()])
    },
    async loadShops() {
      try {
        const res = await shopApi.getShopList()
        if (res.data.code === 200) {
          this.shops = res.data.data
        }
      } catch (error) {
        this.$message.error('加载店铺列表失败')
      }
    },
    async loadFoods() {
      try {
        const res = await foodApi.getFoodList()
        if (res.data.code === 200) {
          this.foods = res.data.data
        }
      } catch (error) {
        this.$message.error('加载美食列表失败')
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
      try {
        if (this.editingShopId) {
          const payload = {
            ...this.shopForm,
            id: this.editingShopId,
            isRecommended: this.shopForm.isRecommended === true || this.shopForm.isRecommended === 1 ? 1 : 0
          }
          const res = await shopApi.updateShop(payload)
          if (res.data.code === 200) {
            this.$message.success('更新成功')
            this.showShopDialog = false
            this.loadShops()
          }
        } else {
          const res = await shopApi.createShop(this.shopForm)
          if (res.data.code === 200) {
            this.$message.success('创建成功')
            this.showShopDialog = false
            this.loadShops()
          }
        }
        this.resetShopForm()
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    async saveFood() {
      try {
        if (this.editingFoodId) {
          const res = await foodApi.updateFood({ ...this.foodForm, id: this.editingFoodId })
          if (res.data.code === 200) {
            this.$message.success('更新成功')
            this.showFoodDialog = false
            this.loadFoods()
          }
        } else {
          const res = await foodApi.createFood(this.foodForm)
          if (res.data.code === 200) {
            this.$message.success('创建成功')
            this.showFoodDialog = false
            this.loadFoods()
          }
        }
        this.resetFoodForm()
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    async deleteShop(id) {
      try {
        await this.$confirm('确定要删除这个店铺吗？', '提示', {
          type: 'warning'
        })
        const res = await shopApi.deleteShop(id)
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
        await this.$confirm('确定要删除这个美食吗？', '提示', {
          type: 'warning'
        })
        const res = await foodApi.deleteFood(id)
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
    resetShopForm() {
      this.shopForm = {
        name: '',
        address: '',
        city: '',
        phone: '',
        description: '',
        isRecommended: 0
      }
      this.editingShopId = null
    },
    resetFoodForm() {
      this.foodForm = {
        name: '',
        shopId: null,
        price: 0,
        category: '',
        description: ''
      }
      this.editingFoodId = null
    }
  }
}
</script>

<style scoped>
.admin {
  padding: 20px 0;
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
