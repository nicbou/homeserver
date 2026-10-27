FROM python:3.13-alpine

RUN pip install requests==2.34.2

COPY search.py search.py
EXPOSE 80
CMD [ "python", "./search.py" ]
