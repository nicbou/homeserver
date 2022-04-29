FROM python:3-slim
WORKDIR /usr/src
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY src/update-dns.py ./
CMD [ "python", "/usr/src/update-dns.py" ]
