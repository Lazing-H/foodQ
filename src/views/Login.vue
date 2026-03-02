<template>
  <div class="login-container" :style="backgroundStyle">
    <div class="login-box">
      <h2>登录</h2>
      <el-form :model="form" :rules="rules" ref="loginForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item class="button-item">
          <el-button type="primary" @click="handleLogin" :loading="loading" class="full-width-button">登录</el-button>
        </el-form-item>
        <el-form-item class="link-item">
          <el-link type="primary" @click="$router.push('/register')" class="centered-link">还没有账号？立即注册</el-link>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { userApi } from '../api'
import { mapMutations } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      },
      loading: false,
      backgroundStyle: {
        backgroundImage: 'url(\'/banners/banner1.png\')',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }
    }
  },
  methods: {
    ...mapMutations(['SET_TOKEN', 'SET_USER']),
    handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          this.loading = true
          try {
            const res = await userApi.login(this.form)
            if (res.data.code === 200) {
              this.SET_TOKEN(res.data.data.token)
              this.SET_USER(res.data.data.user)
              this.$message.success('登录成功')
              this.$router.push('/home')
            } else {
              this.$message.error(res.data.message)
            }
          } catch (error) {
            this.$message.error(error.response?.data?.message || '登录失败')
          } finally {
            this.loading = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  /* 添加半透明遮罩层，确保登录表单可读性 */
  overflow: hidden;
}

/* 添加遮罩层，提高登录表单的可读性 */
.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.login-box {
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.95);
  padding: 50px 45px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 420px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: fadeInUp 0.5s ease-out;
}

.login-box h2 {
  text-align: center;
  margin-bottom: 35px;
  color: #333;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 输入框样式优化 */
.login-box :deep(.el-input__inner) {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.login-box :deep(.el-input__inner):focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 按钮样式优化 */
.login-box :deep(.el-button--primary) {
  border-radius: 8px;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.login-box :deep(.el-button--primary):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.login-box :deep(.el-button--primary):active {
  transform: translateY(0);
}

/* 按钮容器样式 - 使按钮宽度与表单项对齐 */
.login-box :deep(.button-item) {
  margin-bottom: 20px;
}

.login-box :deep(.button-item .el-form-item__content) {
  margin-left: 0 !important;
}

.login-box .full-width-button {
  width: 100%;
}

/* 链接容器样式 - 居中显示 */
.login-box :deep(.link-item) {
  margin-bottom: 0;
  text-align: center;
}

.login-box :deep(.link-item .el-form-item__content) {
  margin-left: 0 !important;
  display: flex;
  justify-content: center;
}

.login-box .centered-link {
  font-size: 14px;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
