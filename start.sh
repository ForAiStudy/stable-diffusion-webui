#!/bin/bash
cd /lotus/stable-diffusion-webui_1/

./webui.sh  --listen  --port=7861  --hide-ui-dir-config  --theme=dark --no-gradio-queue --api 1>>logs/webui.log 2>&1

