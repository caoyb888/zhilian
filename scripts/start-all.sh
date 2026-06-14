#!/bin/bash
# 绿产智链（Green-Link）全服务一键启动脚本
set -e

source /etc/profile.d/greenlink-env.sh

PROJECT_DIR="/data/zhilian"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR"

echo "[1/4] 启动基础设施服务..."
cd "$PROJECT_DIR/infra"
docker-compose -f docker-compose.dev.yml up -d

echo "[2/4] 等待基础设施就绪..."
sleep 15

echo "[3/4] 编译并打包后端微服务..."
cd "$PROJECT_DIR"
mvn clean package -DskipTests -q

echo "[4/4] 启动后端微服务与前端..."

# 本地开发环境连接信息（覆盖 application.yml 中的生产默认值）
export NACOS_ADDR=localhost:18848
export MYSQL_HOST=localhost
export MYSQL_USER=greenlink
export MYSQL_PASS=GreenLink@2026
export REDIS_HOST=localhost
export REDIS_PASS=GreenLink@2026
export ES_URI=http://localhost:9200
export ES_URIS=http://localhost:9200
export ROCKETMQ_NAMESRV=localhost:9876
export ROCKETMQ_NAMESERVER=localhost:9876
export GL_AUTH_URL=http://localhost:8081
export GL_MEMBER_URL=http://localhost:8082
export MINIO_ENDPOINT=http://localhost:9000
export MINIO_ACCESS_KEY=greenlink
export MINIO_SECRET_KEY=GreenLink@2026
export MINIO_BUCKET=greenlink
export MINIO_PUBLIC_BUCKET=greenlink-public
export CDN_URL=http://files.greenlink.com
export SPRING_CLOUD_NACOS_CONFIG_IMPORT_CHECK_ENABLED=false

# 启动顺序：先注册中心/网关/认证/支撑服务，再业务服务
SERVICES=(
  gl-gateway
  gl-auth
  gl-member
  gl-tag
  gl-file
  gl-portal
  gl-supply
  gl-match
  gl-message
  gl-admin
)

for svc in "${SERVICES[@]}"; do
  jar=$(ls "$PROJECT_DIR/$svc/target/"*.jar 2>/dev/null | head -1)
  if [ -n "$jar" ]; then
    echo "  启动 $svc -> $(basename "$jar")"
    nohup java -jar "$jar" \
      --spring.cloud.nacos.config.enabled=false \
      --spring.cloud.nacos.discovery.enabled=false \
      --spring.cloud.nacos.config.import-check.enabled=false \
      > "$LOG_DIR/$svc.log" 2>&1 &
    echo $! > "$LOG_DIR/$svc.pid"
    sleep 3
  else
    echo "  警告：未找到 $svc 的 jar 包"
  fi
done

echo "  启动前端 green-link-web"
cd "$PROJECT_DIR/green-link-web"
nohup env VITE_API_BASE_URL=http://localhost:8080 npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
echo $! > "$LOG_DIR/frontend.pid"

echo ""
echo "所有服务已尝试启动，日志目录：$LOG_DIR"
echo "常用检查命令："
echo "  docker ps                 # 查看基础设施容器"
echo "  ps -ef | grep java        # 查看后端进程"
echo "  tail -f $LOG_DIR/gl-gateway.log"
echo "  tail -f $LOG_DIR/frontend.log"
