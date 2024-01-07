FROM python:3-slim
WORKDIR /usr/src
RUN pip install --no-cache-dir requests==2.31.0
COPY src/update-dns.py ./
CMD [ "python", "/usr/src/update-dns.py" ]