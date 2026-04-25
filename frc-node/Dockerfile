FROM ubuntu:22.04

RUN apt-get update && apt-get install -y python3 nodejs npm

WORKDIR /frc

COPY . .

CMD ["python3", "self_rewriting_ecosystem.py", "start"]
