FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        git \
    && rm -rf /var/lib/apt/lists/*

# Install the timeline
ADD https://api.github.com/repos/nicbou/timeline/git/refs/heads/master version.json
WORKDIR /var/lib/timeline
RUN git clone https://github.com/nicbou/timeline.git . \
    && pip install -e .

COPY run.sh /run.sh

CMD [ "bash", "/run.sh" ]