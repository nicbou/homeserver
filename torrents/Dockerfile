FROM haugene/transmission-openvpn:1.13

# Kill container when connection to VPN fails
# https://github.com/haugene/docker-transmission-openvpn/issues/144
ENV OPENVPN_OPTS "--inactive 3600 --ping 10 --ping-exit 60"
