#!/bin/bash
set -e
docker-compose build

echo -e "\n\033[1mEnter the movie library path\033[0m"
echo "This is where the movies, covers and subtitles will be stored."
echo -n "Movie library path: "
read movies_path

echo -e "\n\033[1mEnter the torrents path\033[0m"
echo "This is where unfinished torrents will be stored."
echo -n "Triage path: "
read torrents_path

echo -e "\n\033[1mEnter the database persistence path\033[0m"
echo "This is where the database data will be stored."
echo -n "Database path: "
read db_path

echo -e "\n\033[1mEnter a unique, random secret key\033[0m"
echo "This is used by Django to set secure cookies, among other things."
echo -n "Secret key: "
read secret_key

echo -e "\n\033[1mEnter your VPN provider\033[0m"
echo "For instance, 'PIA'. The full list of supported providers can be found at"
echo "https://hub.docker.com/r/haugene/transmission-openvpn/"
echo -n "VPN provider: "
read vpn_provider

echo -e "\n\033[1mEnter your VPN username\033[0m"
echo -n "VPN username: "
read vpn_user

echo -e "\n\033[1mEnter your VPN password\033[0m"
echo -n "VPN password: "
read vpn_pass

echo "Saving answers in a .env file..."

mkdir -p "${db_path}"
mkdir -p "${movies_path}"
mkdir -p "${torrents_path}"

touch .env
echo '' > .env
echo "DB_PERSISTENCE_PATH=${db_path}" >> .env
echo "MOVIE_LIBRARY_PATH=${movies_path}" >> .env
echo "TRANSMISSION_DATA_PATH=${torrents_path}" >> .env
echo "BACKEND_SECRET_KEY=${secret_key}" >> .env
echo "OPENVPN_PROVIDER=${vpn_provider}" >> .env
echo "OPENVPN_USERNAME=${vpn_user}" >> .env
echo "OPENVPN_PASSWORD=${vpn_pass}" >> .env

echo -e "\033[1mDone!\033[0m You can now start the server by running \033[1mscripts/start.sh\033[0m"
echo -e "When the server is running, run \033[1mscripts/create-user.sh\033[0m to create your"
echo "first user."