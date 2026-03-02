const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 如果ESLint仍然有问题，可以临时禁用
  // lintOnSave: false,
  devServer: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/uploads': '/api/uploads'  // 将 /uploads 重写为 /api/uploads
        }
      },
      // WebSocket 代理（SockJS/STOMP 聊天）
      '/ws-chat': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        pathRewrite: {
          '^/ws-chat': '/api/ws-chat'
        }
      }
    }
  }
})
