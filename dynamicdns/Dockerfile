FROM python:3-slim
WORKDIR /usr/src/app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY src/update-dns.py ./
CMD [ "python", "./src/update-dns.py" ]
