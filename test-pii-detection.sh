#!/bin/bash

echo "🧪 PII Guard 테스트 시작..."
echo ""

# API 엔드포인트
API_URL="http://localhost:8888/api/jobs/flush"

# 샘플 로그 데이터 (README에서 가져온 공식 테스트 데이터)
curl --location "$API_URL" \
--header 'Content-Type: application/json' \
--data-raw '{
  "version": "1.0.0",
  "logs": [
    "{\"timestamp\":\"2025-04-21T15:02:10Z\",\"service\":\"auth-service\",\"level\":\"INFO\",\"event\":\"user_login\",\"requestId\":\"1a9c7e21\",\"user\":{\"id\":\"u9001001\",\"name\":\"Leila Park\",\"email\":\"leila.park@example.io\"},\"srcIp\":\"198.51.100.15\"}",
    "{\"timestamp\":\"2025-04-21T15:02:12Z\",\"service\":\"cache-service\",\"level\":\"DEBUG\",\"event\":\"cache_miss\",\"requestId\":\"82c5cc9f\",\"cacheKey\":\"product_44291_variant_blue\",\"region\":\"us-east-1\"}"
  ]
}'

echo ""
echo ""
echo "✅ 요청 전송 완료!"
echo "📊 결과 확인: http://localhost:3000"
echo "🔍 API 상태: http://localhost:8888/api/jobs"
