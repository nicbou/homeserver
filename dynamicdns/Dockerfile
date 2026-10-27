FROM python:3.13-alpine
WORKDIR /usr/src
RUN pip install --no-cache-dir requests==2.34.2
COPY src/update-dns.py ./
CMD [ "python", "/usr/src/update-dns.py" ]