#!/bin/bash

# 多平台构建脚本
# 用法: ./scripts/build-platform.sh [platform]
# 平台: poki, crazygames, azerion, telegram, standalone

PLATFORM=${1:-standalone}
BUILD_DIR="dist-${PLATFORM}"

echo "Building for platform: $PLATFORM"

# 创建平台特定的 index.html
cp index.html index.html.backup

case $PLATFORM in
  poki)
    echo "Adding Poki SDK..."
    sed -i '/<!-- Poki SDK -->/a <script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>' index.html
    ;;
  crazygames)
    echo "Adding CrazyGames SDK..."
    sed -i '/<!-- CrazyGames SDK -->/a <script src="https://sdk.crazygames.com/crazygames-sdk-v2.js"></script>' index.html
    ;;
  azerion)
    echo "Adding Azerion SDK..."
    sed -i '/<!-- Azerion SDK -->/a <script src="https://html5.api.gameads.io/sdk/v1/gd-sdk.js"></script>' index.html
    ;;
  telegram)
    echo "Preparing Telegram build (removing external links)..."
    # Telegram Games不允许外部链接，需要移除所有外部资源引用
    # 注意：Google Fonts和Tailwind CDN已在index.html中通过JavaScript条件加载
    # Telegram SDK是Telegram官方提供的，允许使用
    sed -i '/<!-- Telegram SDK -->/a <script src="https://telegram.org/js/telegram-web-app.js"></script>' index.html
    echo "Telegram build prepared (external links will be disabled at runtime)"
    ;;
  *)
    echo "Building standalone version (no SDK)"
    ;;
esac

# 构建
npm run build

# 复制到平台特定目录
if [ -d "dist" ]; then
  cp -r dist "$BUILD_DIR"
  echo "Build completed! Output: $BUILD_DIR"
else
  echo "Build failed!"
  exit 1
fi

# 恢复原始 index.html
mv index.html.backup index.html

echo "Done!"

