FROM python:3.11-alpine

RUN pip install requests==2.31.0

COPY search.py search.py
EXPOSE 80
CMD [ "python", "./search.py" ]
