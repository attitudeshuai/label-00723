# 使用nginx作为静态文件服务器，支持多平台
FROM --platform=$BUILDPLATFORM nginx:alpine AS builder

# 生产镜像
FROM nginx:alpine

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制静态文件
COPY . /usr/share/nginx/html

# 删除不需要的文件
RUN rm -f /usr/share/nginx/html/Dockerfile \
    && rm -f /usr/share/nginx/html/nginx.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
