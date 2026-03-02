<template>
  <div class="friends">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="我的好友" name="friends">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户"
              style="width: 300px; margin-bottom: 20px"
              @keyup.enter.native="searchUsers"
            >
              <el-button slot="append" @click="searchUsers">搜索</el-button>
            </el-input>

            <div v-if="searchResults.length > 0" class="search-results">
              <h3>搜索结果</h3>
              <el-card v-for="user in searchResults" :key="user.id" class="user-card">
                <div class="user-info">
                  <el-avatar :src="user.avatar" :size="50"></el-avatar>
                  <div class="user-details">
                    <h4>{{ user.nickname || user.username }}</h4>
                    <p>{{ user.username }}</p>
                  </div>
                  <el-button type="primary" @click="addFriend(user.id)">添加好友</el-button>
                </div>
              </el-card>
            </div>

            <h3>好友列表</h3>
            <el-card
              v-for="friend in friends"
              :key="friend.id"
              class="friend-card"
              @click.native="openChat(friend)"
            >
              <div class="friend-info">
                <el-avatar :src="friend.friendAvatar" :size="50"></el-avatar>
                <div class="friend-details">
                  <h4>{{ friend.friendNickname || friend.friendUsername }}</h4>
                  <p>{{ friend.friendUsername }}</p>
                </div>
              </div>
            </el-card>
            <el-empty v-if="friends.length === 0" description="暂无好友"></el-empty>
          </el-tab-pane>

          <el-tab-pane label="好友请求" name="requests">
            <el-card v-for="request in pendingRequests" :key="request.id" class="request-card">
              <div class="request-info">
                <el-avatar :src="request.friendAvatar" :size="50"></el-avatar>
                <div class="request-details">
                  <h4>{{ request.friendNickname || request.friendUsername }}</h4>
                  <p>{{ request.friendUsername }}</p>
                </div>
                <div class="request-actions">
                  <!-- 这里必须传申请方 userId，而不是 friendId（friendId 是自己） -->
                  <el-button type="primary" @click="acceptFriend(request.userId)">接受</el-button>
                  <el-button @click="rejectFriend(request.userId)">拒绝</el-button>
                </div>
              </div>
            </el-card>
            <el-empty v-if="pendingRequests.length === 0" description="暂无好友请求"></el-empty>
          </el-tab-pane>
        </el-tabs>
      </el-col>

      <!-- 右侧简单聊天窗口，仅前端模拟，用于通过好友后互相聊天 -->
      <el-col :span="14">
        <div class="chat-panel" v-if="currentChatFriend">
          <div class="chat-header">
            <div class="chat-header-main">
              <div class="chat-header-user">
                <el-avatar :src="currentChatFriend.friendAvatar" :size="40"></el-avatar>
                <div class="chat-header-text">
                  <h3>{{ currentChatFriend.friendNickname || currentChatFriend.friendUsername }}</h3>
                  <p>一起聊聊美食、互相种草</p>
                </div>
              </div>
            </div>
          </div>
          <div class="chat-messages" ref="chatMessages">
            <div
              v-for="(msg, index) in chatMessages[currentChatFriend.friendId] || []"
              :key="index"
              class="chat-message"
              :class="msg.from === 'me' ? 'from-me' : 'from-friend'"
            >
              <div class="chat-bubble">
                <span class="chat-text">{{ msg.text }}</span>
                <span class="chat-time">{{ msg.time }}</span>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <el-input
              type="textarea"
              :rows="2"
              v-model="chatInput"
              placeholder="和好友聊点什么吧～"
              @keyup.enter.native.exact.prevent="sendMessage"
            />
            <div class="chat-actions">
              <el-button type="primary" @click="sendMessage">发送</el-button>
            </div>
          </div>
        </div>
        <div v-else class="chat-empty">
          <el-empty description="选择一位好友开始聊天"></el-empty>
        </div>
      </el-col>
    </el-row>

  </div>
</template>

<script>
import { mapState } from 'vuex'
import { userApi, chatApi } from '../api'
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

export default {
  name: 'Friends',
  data() {
    return {
      activeTab: 'friends',
      friends: [],
      pendingRequests: [],
      searchKeyword: '',
      searchResults: [],
      // WebSocket / 聊天相关状态
      currentChatFriend: null,
      chatMessages: {},
      chatInput: '',
      stompClient: null,
      connected: false
    }
  },
  computed: {
    ...mapState(['user'])
  },
  created() {
    this.loadData()
    this.connectWebSocket()
  },
  beforeDestroy() {
    if (this.stompClient) {
      this.stompClient.disconnect()
      this.stompClient = null
    }
  },
  methods: {
    async loadData() {
      await Promise.all([this.loadFriends(), this.loadPendingRequests()])
    },
    async loadFriends() {
      try {
        const res = await userApi.getFriends()
        if (res.data.code === 200) {
          this.friends = res.data.data
        }
      } catch (error) {
        this.$message.error('加载好友列表失败')
      }
    },
    async loadPendingRequests() {
      try {
        const res = await userApi.getPendingRequests()
        if (res.data.code === 200) {
          this.pendingRequests = res.data.data
        }
      } catch (error) {
        this.$message.error('加载好友请求失败')
      }
    },
    async searchUsers() {
      if (!this.searchKeyword) {
        this.$message.warning('请输入搜索关键词')
        return
      }
      try {
        const res = await userApi.searchUsers(this.searchKeyword)
        if (res.data.code === 200) {
          this.searchResults = res.data.data
        }
      } catch (error) {
        this.$message.error('搜索失败')
      }
    },
    async addFriend(friendId) {
      try {
        const res = await userApi.addFriend(friendId)
        if (res.data.code === 200) {
          this.$message.success('好友请求已发送')
          this.searchResults = []
        } else {
          this.$message.error(res.data.message)
        }
      } catch (error) {
        this.$message.error(error.response?.data?.message || '添加好友失败')
      }
    },
    async acceptFriend(friendId) {
      try {
        const res = await userApi.acceptFriend(friendId)
        if (res.data.code === 200) {
          this.$message.success('已接受好友请求')
          this.loadData()
        }
      } catch (error) {
        this.$message.error(error.response?.data?.message || '操作失败')
      }
    },
    rejectFriend(/* friendId */) {
      this.$message.info('拒绝功能待实现（当前仅支持通过好友请求）')
    },
    // 连接 WebSocket（SockJS + STOMP）
    connectWebSocket() {
      if (this.stompClient || !this.user || !this.user.id) return
      // 仅使用常见的浏览器传输方式，避免部分回退方式在本地开发环境报错
      const socket = new SockJS('/ws-chat', null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling']
      })
      // 使用新的 API：Stomp.over 需要传入 factory 函数
      const client = Stomp.over(() => socket)
      // 可选：关闭调试日志（stomp v7 需要是函数，不能为 null）
      client.debug = () => {}
      client.connect({}, () => {
        this.connected = true
        // 订阅个人消息队列：使用基于用户ID的直接路径
        const subscriptionPath = '/queue/user.' + this.user.id
        client.subscribe(subscriptionPath, (msg) => {
          console.log('收到WebSocket消息:', msg)
          if (!msg.body) {
            console.warn('消息体为空')
            return
          }
          try {
            const body = JSON.parse(msg.body)
            console.log('解析后的消息:', body)
            this.onReceiveMessage(body)
          } catch (e) {
            console.error('解析消息失败:', e, '原始消息:', msg.body)
          }
        })
        console.log('WebSocket 已连接，订阅路径:', subscriptionPath)
      }, (error) => {
        this.connected = false
        console.error('WebSocket 连接失败:', error)
        this.$message.error('聊天连接失败，请刷新页面重试')
      })
      this.stompClient = client
    },
    // 打开聊天窗口
    async openChat(friend) {
      this.currentChatFriend = friend
      const id = friend.friendId
      // 如果还没有加载过历史消息，则加载
      if (!this.chatMessages[id] || this.chatMessages[id].length === 0) {
        await this.loadChatHistory(id)
      }
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    // 加载聊天历史记录
    async loadChatHistory(friendId) {
      if (!this.user || !this.user.id) return
      try {
        const res = await chatApi.getChatHistory(this.user.id, friendId)
        if (res.data.code === 200 && res.data.data) {
          const messages = res.data.data.map(msg => ({
            from: msg.senderId === this.user.id ? 'me' : 'friend',
            type: 'TEXT',
            text: msg.content || '',
            time: this.formatTime(msg.createTime)
          }))
          this.$set(this.chatMessages, friendId, messages)
        } else {
          this.$set(this.chatMessages, friendId, [])
        }
      } catch (error) {
        console.error('加载聊天历史失败:', error)
        this.$set(this.chatMessages, friendId, [])
      }
    },
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      try {
        const date = new Date(time)
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      } catch (e) {
        // 如果解析失败，返回原始值
      }
      return time
    },
    // 发送文本消息（通过 WebSocket）
    sendMessage() {
      if (!this.currentChatFriend || !this.chatInput.trim()) {
        this.$message.warning('请输入消息内容')
        return
      }
      if (!this.connected || !this.stompClient) {
        this.$message.error('聊天连接未建立，请刷新页面重试')
        return
      }
      const content = this.chatInput.trim()
      this.chatInput = ''
      // 通过 WebSocket 发送，等待回显来显示消息
      try {
        const payload = {
          senderId: this.user.id,
          senderName: this.user.nickname || this.user.username,
          receiverId: this.currentChatFriend.friendId,
          type: 'TEXT',
          content: content
        }
        this.stompClient.send('/app/chat.send', {}, JSON.stringify(payload))
      } catch (error) {
        console.error('发送消息失败:', error)
        this.$message.error('发送失败，请检查网络连接')
      }
    },
    // 处理收到的消息
    onReceiveMessage(message) {
      console.log('onReceiveMessage 被调用，消息:', message, '当前用户ID:', this.user?.id)
      if (!message || !message.senderId || !message.receiverId) {
        console.warn('收到无效消息:', message)
        return
      }
      // 确定好友ID：如果是我发送的，friendId是receiverId；如果是对方发送的，friendId是senderId
      const friendId = message.senderId === this.user.id ? message.receiverId : message.senderId
      console.log('计算的好友ID:', friendId, '发送者ID:', message.senderId, '接收者ID:', message.receiverId)

      if (!this.chatMessages[friendId]) {
        this.$set(this.chatMessages, friendId, [])
      }

      // 检查是否已存在相同消息（避免重复）
      const existingMsg = this.chatMessages[friendId].find(
        m => m.text === message.content &&
             m.time === (message.time || message.createTime)
      )
      if (existingMsg) {
        console.log('消息已存在，跳过:', message)
        return
      }

      // 格式化时间：后端返回的是 ISO 格式字符串，需要转换为可读格式
      let timeStr = message.time || message.createTime
      if (timeStr && typeof timeStr === 'string') {
        try {
          const date = new Date(timeStr)
          if (!isNaN(date.getTime())) {
            timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        } catch (e) {
          // 如果解析失败，使用原始值
        }
      } else if (timeStr && timeStr instanceof Date) {
        timeStr = timeStr.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }

      // 添加消息到列表
      this.chatMessages[friendId].push({
        from: message.senderId === this.user.id ? 'me' : 'friend',
        type: 'TEXT',
        text: message.content || '',
        time: timeStr || new Date().toLocaleTimeString()
      })
      console.log('消息已添加到列表，当前消息数:', this.chatMessages[friendId].length)
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    scrollToBottom() {
      const box = this.$refs.chatMessages
      if (box) {
        box.scrollTop = box.scrollHeight
      }
    }
  }
}
</script>

<style scoped>
.friends {
  padding: 40px 20px;
  background-color: #f5f7fb;
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 120px);
}

.friends .el-row {
  width: 1100px; /* 宽度再加100px，左右各20px边距 */
  max-width: 1300px;
}

.chat-panel {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  height: 600px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chat-header {
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.chat-header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header-user {
  display: flex;
  align-items: center;
}

.chat-header-text {
  margin-left: 12px;
}

.chat-header-text h3 {
  margin: 0;
  font-size: 18px;
}

.chat-header-text p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #999;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px 0;
  min-height: 0;
}

.chat-message {
  display: flex;
  margin-bottom: 8px;
}

.chat-message.from-me {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #f5f7fa;
  font-size: 13px;
}

.chat-message.from-me .chat-bubble {
  background-color: #409EFF;
  color: #fff;
}

.chat-text {
  display: block;
}

.chat-time {
  display: block;
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.chat-input {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
  margin-top: 15px;
}

.chat-actions {
  text-align: right;
  margin-top: 4px;
}

.chat-empty {
  height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.user-card, .friend-card, .request-card {
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
}

.friend-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.user-info, .friend-info, .request-info {
  display: flex;
  align-items: center;
}

.user-details, .friend-details, .request-details {
  margin-left: 15px;
  flex: 1;
}

.user-details h4, .friend-details h4, .request-details h4 {
  margin-bottom: 5px;
}

.user-details p, .friend-details p, .request-details p {
  color: #999;
  font-size: 12px;
}

.request-actions {
  margin-left: auto;
}

.search-results {
  margin-bottom: 30px;
}
</style>
