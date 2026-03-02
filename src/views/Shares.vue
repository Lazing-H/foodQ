<template>
  <div class="shares-container">
    <div class="shares">
      <h2>收到的分享</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="未读" name="unread">
        <div v-for="share in unreadShares" :key="share.id" class="share-item">
          <el-card>
            <div class="share-header">
              <el-avatar :src="share.userAvatar" :size="40"></el-avatar>
              <div class="share-user-info">
                <span class="share-username">{{ share.userName }}</span>
                <span class="share-time">{{ formatTime(share.createTime) }}</span>
              </div>
              <el-button size="small" @click="markAsRead(share.id)">标记已读</el-button>
            </div>
            <div class="share-content">
              <div class="share-food">
                <img :src="share.foodImage || '/default-food.jpg'" class="share-food-image" />
                <div class="share-food-info">
                  <h3>{{ share.foodName }}</h3>
                  <p v-if="share.message">{{ share.message }}</p>
                  <p v-if="share.reviewContent" class="share-review">{{ share.reviewContent }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </div>
        <el-empty v-if="unreadShares.length === 0" description="暂无未读分享"></el-empty>
      </el-tab-pane>

      <el-tab-pane label="已读" name="read">
        <div v-for="share in readShares" :key="share.id" class="share-item">
          <el-card>
            <div class="share-header">
              <el-avatar :src="share.userAvatar" :size="40"></el-avatar>
              <div class="share-user-info">
                <span class="share-username">{{ share.userName }}</span>
                <span class="share-time">{{ formatTime(share.createTime) }}</span>
              </div>
            </div>
            <div class="share-content">
              <div class="share-food">
                <img :src="share.foodImage || '/default-food.jpg'" class="share-food-image" />
                <div class="share-food-info">
                  <h3>{{ share.foodName }}</h3>
                  <p v-if="share.message">{{ share.message }}</p>
                  <p v-if="share.reviewContent" class="share-review">{{ share.reviewContent }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </div>
        <el-empty v-if="readShares.length === 0" description="暂无已读分享"></el-empty>
      </el-tab-pane>
    </el-tabs>
    </div>
  </div>
</template>

<script>
import { shareApi } from '../api'

export default {
  name: 'Shares',
  data() {
    return {
      activeTab: 'unread',
      shares: []
    }
  },
  computed: {
    unreadShares() {
      return this.shares.filter(s => s.isRead === 0)
    },
    readShares() {
      return this.shares.filter(s => s.isRead === 1)
    }
  },
  created() {
    this.loadShares()
  },
  methods: {
    async loadShares() {
      try {
        const res = await shareApi.getReceivedShares()
        if (res.data.code === 200) {
          this.shares = res.data.data
        }
      } catch (error) {
        this.$message.error('加载分享列表失败')
      }
    },
    async markAsRead(id) {
      try {
        const res = await shareApi.markAsRead(id)
        if (res.data.code === 200) {
          this.$message.success('已标记为已读')
          this.loadShares()
        }
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    formatTime(time) {
      return new Date(time).toLocaleString()
    }
  }
}
</script>

<style scoped>
.shares-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background-color: #f5f7fb;
  min-height: calc(100vh - 120px);
}

.shares {
  width: 1100px;
  max-width: 1300px;
  padding: 20px 0;
}

.share-item {
  margin-bottom: 20px;
}

.share-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.share-user-info {
  margin-left: 10px;
  flex: 1;
}

.share-username {
  font-weight: bold;
  margin-right: 10px;
}

.share-time {
  color: #999;
  font-size: 12px;
}

.share-content {
  margin-top: 15px;
}

.share-food {
  display: flex;
}

.share-food-image {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 15px;
}

.share-food-info h3 {
  margin-bottom: 10px;
}

.share-review {
  color: #666;
  margin-top: 10px;
  font-style: italic;
}
</style>
