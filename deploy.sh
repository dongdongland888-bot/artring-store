#!/bin/bash
set -e

echo "============================================"
echo "  🎨 ArtRing Store - 一键部署"
echo "============================================"
echo ""

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ 请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ 请先安装 Docker Compose"
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null; then
    DC="docker compose"
else
    DC="docker-compose"
fi

echo "📦 Step 1/3: 构建 Docker 镜像..."
$DC build --no-cache

echo ""
echo "🚀 Step 2/3: 启动所有服务..."
$DC up -d

echo ""
echo "⏳ Step 3/3: 等待服务就绪..."

# Wait for backend to be healthy
MAX_WAIT=120
WAITED=0
echo -n "  等待后端 API 启动"
until curl -sf http://localhost:3000/api/health > /dev/null 2>&1; do
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo ""
        echo "⚠️  后端启动超时，请检查日志: $DC logs backend"
        break
    fi
    echo -n "."
    sleep 3
    WAITED=$((WAITED + 3))
done
echo ""

# Wait for frontend
WAITED=0
echo -n "  等待前端 Nginx 启动"
until curl -sf http://localhost > /dev/null 2>&1; do
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo ""
        echo "⚠️  前端启动超时，请检查日志: $DC logs frontend"
        break
    fi
    echo -n "."
    sleep 2
    WAITED=$((WAITED + 2))
done
echo ""

echo ""
echo "============================================"
echo "  ✅ 部署完成！"
echo "============================================"
echo ""
echo "  🌐 前端地址: http://localhost"
echo "  🔌 API 地址: http://localhost:3000/api"
echo "  📊 健康检查: http://localhost:3000/api/health"
echo ""
echo "  👤 管理员账号: admin@artring.com"
echo "  🔑 管理员密码: admin123"
echo ""
echo "  📝 常用命令:"
echo "    查看日志:   $DC logs -f"
echo "    停止服务:   $DC down"
echo "    重启服务:   $DC restart"
echo "    清除数据:   $DC down -v"
echo "============================================"
