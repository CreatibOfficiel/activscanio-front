#!/bin/bash

# 📦 Config
FRONT_PATH="./"
VPS_TARGET="yeti-vps"
VPS_PATH="/home/ubuntu/activscanio-front"
IMAGE_NAME="activscanio-front"
TAR_NAME="${IMAGE_NAME}.tar"

# 🛠 Build + Save
export DOCKER_DEFAULT_PLATFORM=linux/amd64
docker build -t ${IMAGE_NAME}:latest "$FRONT_PATH" || exit 1
docker save ${IMAGE_NAME}:latest -o "$TAR_NAME" || exit 1

# 🚀 Send to VPS
scp "$TAR_NAME" ${VPS_TARGET}:"${VPS_PATH}/" || exit 1

echo "✅ Front built and transferred to VPS at ${VPS_PATH}/${TAR_NAME}"
