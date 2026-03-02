<template>
  <div class="orders">
    <h2>我的订单</h2>
    <el-table :data="orders" class="orders-table">
      <el-table-column prop="orderNo" label="订单号" min-width="200"></el-table-column>
      <el-table-column prop="shopName" label="店铺" min-width="150"></el-table-column>
      <el-table-column label="商品" min-width="220">
        <template slot-scope="scope">
          <div v-for="item in scope.row.items" :key="item.id">
            {{ item.foodName }} x{{ item.quantity }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="总金额" min-width="110">
        <template slot-scope="scope">
          ¥{{ scope.row.totalAmount }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="120">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="下单时间" min-width="200">
        <template slot-scope="scope">
          {{ formatTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="140">
        <template slot-scope="scope">
          <div class="order-actions">
            <el-button size="small" @click="viewOrder(scope.row)">查看详情</el-button>
            <el-button
              v-if="scope.row.status === 'PENDING'"
              size="small"
              type="primary"
              @click="updateOrderStatus(scope.row.id, 'PAID')"
            >
              支付
            </el-button>
            <el-button
              v-if="scope.row.status === 'PAID'"
              size="small"
              type="success"
              @click="$router.push(`/food/${scope.row.items[0].foodId}?orderId=${scope.row.id}`)"
            >
              评价
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { orderApi } from '../api'

export default {
  name: 'Orders',
  data() {
    return {
      orders: []
    }
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      if (to.name === 'Orders') vm.loadOrders()
    })
  },
  methods: {
    async loadOrders() {
      try {
        const res = await orderApi.getOrders()
        if (res.data.code === 200) {
          this.orders = res.data.data
        }
      } catch (error) {
        this.$message.error('加载订单列表失败')
      }
    },
    getStatusType(status) {
      const map = {
        PENDING: 'warning',
        PAID: 'success',
        COMPLETED: 'info',
        CANCELLED: 'danger'
      }
      return map[status] || ''
    },
    getStatusText(status) {
      const map = {
        PENDING: '待支付',
        PAID: '已支付',
        COMPLETED: '已完成',
        CANCELLED: '已取消'
      }
      return map[status] || status
    },
    formatTime(time) {
      return new Date(time).toLocaleString()
    },
    viewOrder(order) {
      if (!order) {
        this.$message.warning('订单信息不存在')
        return
      }

      try {
        // 构建订单详情HTML，每条信息占据一行
        let detailHtml = '<div style="text-align: left; line-height: 2;">'
        detailHtml += `<div style="margin-bottom: 8px;"><strong>订单号：</strong>${order.orderNo || '未知'}</div>`
        detailHtml += `<div style="margin-bottom: 8px;"><strong>店铺：</strong>${order.shopName || '未知店铺'}</div>`
        if (order.address) {
          detailHtml += `<div style="margin-bottom: 8px;"><strong>配送地址：</strong>${order.address}</div>`
        }
        if (order.remark) {
          detailHtml += `<div style="margin-bottom: 8px;"><strong>备注：</strong>${order.remark}</div>`
        }
        detailHtml += '<div style="margin-bottom: 8px;"><strong>订单商品：</strong></div>'
        detailHtml += '<div style="margin-left: 20px; margin-bottom: 8px;">'
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            const foodName = item.foodName || '未知商品'
            const quantity = item.quantity || 0
            const foodPrice = item.foodPrice || 0
            const subtotal = (foodPrice * quantity).toFixed(2)
            detailHtml += `<div style="margin-bottom: 4px;">${foodName} x${quantity} = ¥${subtotal}</div>`
          })
        } else {
          detailHtml += '<div>暂无商品信息</div>'
        }
        detailHtml += '</div>'
        const totalAmount = order.totalAmount || 0
        detailHtml += `<div style="margin-bottom: 8px; margin-top: 12px; border-top: 1px solid #eee; padding-top: 8px;"><strong>总金额：</strong><span style="color: #f56c6c; font-size: 18px; font-weight: bold;">¥${totalAmount.toFixed(2)}</span></div>`
        detailHtml += `<div style="margin-bottom: 8px;"><strong>订单状态：</strong>${this.getStatusText(order.status)}</div>`
        if (order.createTime) {
          detailHtml += `<div style="margin-bottom: 8px;"><strong>下单时间：</strong>${this.formatTime(order.createTime)}</div>`
        }
        if (order.updateTime && order.updateTime !== order.createTime) {
          detailHtml += `<div style="margin-bottom: 8px;"><strong>更新时间：</strong>${this.formatTime(order.updateTime)}</div>`
        }
        detailHtml += '</div>'

        this.$alert(detailHtml, '订单详情', {
          confirmButtonText: '确定',
          dangerouslyUseHTMLString: true
        }).catch(() => {
          // 用户取消对话框时，静默处理，不显示错误
        })
      } catch (error) {
        console.error('显示订单详情失败:', error)
        this.$message.error('显示订单详情失败')
      }
    },
    async updateOrderStatus(orderId, status) {
      try {
        const res = await orderApi.updateOrderStatus(orderId, status)
        if (res.data.code === 200) {
          this.$message.success('操作成功')
          this.loadOrders()
        }
      } catch (error) {
        this.$message.error('操作失败')
      }
    }
  }
}
</script>

<style scoped>
.orders {
  padding: 20px 0;
}

.orders-table {
  width: 100% !important;
}

/* 让表格铺满容器，最后一列自动占满右侧，上下线一致 */
.orders-table .el-table__body,
.orders-table .el-table__header {
  width: 100% !important;
}

.orders-table .el-table__body-wrapper table,
.orders-table .el-table__header-wrapper table {
  width: 100% !important;
}

.order-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
}
</style>
