# 使用官方Node.js镜像，支持多平台(ARM64/AMD64)
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 生产镜像
FROM node:18-alpine

WORKDIR /app

# 从构建阶段复制
COPY --from=builder /app .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
