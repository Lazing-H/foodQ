<template>
  <div class="main-layout">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="logo" @click="$router.push('/home')">
            <i class="el-icon-food"></i>
            <span>美食推荐平台</span>
          </div>
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            router
            class="header-menu"
          >
            <el-menu-item index="/home">首页</el-menu-item>
            <el-menu-item index="/shops">店铺</el-menu-item>
            <el-menu-item v-if="isLoggedIn" index="/orders">我的订单</el-menu-item>
            <el-menu-item v-if="isLoggedIn" index="/reviews">我的评价</el-menu-item>
            <el-menu-item v-if="isLoggedIn" index="/friends">好友</el-menu-item>
            <el-menu-item v-if="isLoggedIn" index="/shares">分享</el-menu-item>
            <el-menu-item v-if="isMerchant" index="/merchant">商家管理</el-menu-item>
            <el-menu-item v-if="isAdmin" index="/admin">管理后台</el-menu-item>
          </el-menu>
          <div class="user-info">
            <template v-if="isLoggedIn">
              <el-dropdown>
                <span class="user-dropdown">
                  <el-avatar :src="user.avatar" :size="30"></el-avatar>
                  <span style="margin-left: 8px">{{ user.nickname || user.username }}</span>
                  <i class="el-icon-arrow-down"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item @click.native="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </template>
            <template v-else>
              <el-button type="text" @click="$router.push('/login')">登录</el-button>
              <el-button type="text" @click="$router.push('/register')">注册</el-button>
            </template>
          </div>
        </div>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'MainLayout',
  computed: {
    ...mapGetters(['isLoggedIn', 'isAdmin', 'isMerchant']),
    user() {
      return this.$store.state.user
    },
    activeMenu() {
      return this.$route.path
    }
  },
  methods: {
    handleLogout() {
      this.$store.dispatch('logout')
      this.$router.push('/login')
      this.$message.success('已退出登录')
    }
  }
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,.1);
  padding: 0;
}

.header-content {
  display: flex;
  align-items: center;
  height: 60px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
  cursor: pointer;
  margin-right: 40px;
}

.logo i {
  font-size: 24px;
  margin-right: 8px;
}

.header-menu {
  flex: 1;
  border-bottom: none;
}

.user-info {
  margin-left: auto;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.el-main {
  max-width: 90%;
  width: 90%;
  margin: 0 auto;
  padding: 20px 0px;
}
</style>
