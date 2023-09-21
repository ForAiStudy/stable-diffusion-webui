#!/bin/bash
cd /lotus/stable-diffusion-webui_1/

./webui.sh  --listen --api --hide-ui-dir-config  --theme=dark --no-gradio-queue 1>>logs/webui.log 2>&1

