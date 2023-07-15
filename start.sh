#!/bin/bash
cd /lotus/stable-diffusion-webui/

./webui.sh  --listen  --hide-ui-dir-config  --theme=dark --no-gradio-queue 1>>logs/webui.log 2>&1

