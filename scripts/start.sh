#!/bin/bash
echo -e "\n\033[1mStarting the server\033[0m"
docker-compose up --build -d
echo "Done! The server will be live in a few seconds."