<template>
  <div class="register-container" :style="backgroundStyle">
    <div class="register-box">
      <h2>注册</h2>
      <el-form :model="form" :rules="rules" ref="registerForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称（可选）"></el-input>
        </el-form-item>
        <el-form-item label="注册身份" prop="role">
          <el-radio-group v-model="form.role">
            <el-radio label="USER">普通用户</el-radio>
            <el-radio label="MERCHANT">商家</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item class="button-item">
          <el-button type="primary" @click="handleRegister" :loading="loading" class="full-width-button">注册</el-button>
        </el-form-item>
        <el-form-item class="link-item">
          <el-link type="primary" @click="$router.push('/login')" class="centered-link">已有账号？立即登录</el-link>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { userApi } from '../api'

export default {
  name: 'Register',
  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.form.password) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }
    return {
      form: {
        username: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        role: 'USER'
      },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
        confirmPassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
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
    handleRegister() {
      this.$refs.registerForm.validate(async (valid) => {
        if (valid) {
          this.loading = true
          try {
            const res = await userApi.register({
              username: this.form.username,
              password: this.form.password,
              nickname: this.form.nickname,
              role: (this.form.role && this.form.role.toString()) || 'USER'
            })
            if (res.data.code === 200) {
              this.$message.success('注册成功，请登录')
              this.$router.push('/login')
            } else {
              this.$message.error(res.data.message)
            }
          } catch (error) {
            this.$message.error(error.response?.data?.message || '注册失败')
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
.register-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
}

/* 添加遮罩层，提高注册表单的可读性 */
.register-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.register-box {
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

.register-box h2 {
  text-align: center;
  margin-bottom: 35px;
  color: #333;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 输入框样式优化 */
.register-box :deep(.el-input__inner) {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.register-box :deep(.el-input__inner):focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 按钮样式优化 */
.register-box :deep(.el-button--primary) {
  border-radius: 8px;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.register-box :deep(.el-button--primary):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.register-box :deep(.el-button--primary):active {
  transform: translateY(0);
}

/* 按钮容器样式 - 使按钮宽度与表单项对齐 */
.register-box :deep(.button-item) {
  margin-bottom: 20px;
}

.register-box :deep(.button-item .el-form-item__content) {
  margin-left: 0 !important;
}

.register-box .full-width-button {
  width: 100%;
}

/* 链接容器样式 - 居中显示 */
.register-box :deep(.link-item) {
  margin-bottom: 0;
  text-align: center;
}

.register-box :deep(.link-item .el-form-item__content) {
  margin-left: 0 !important;
  display: flex;
  justify-content: center;
}

.register-box .centered-link {
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
