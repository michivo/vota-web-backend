# vota-web-backend

# Run Dockerized version

Run

    docker built -t vota_web .

to build the Docker container. Run 

    docker run -it -p 10081:10081 --mount type=bind,source="$(pwd)"/database,target="/data" vota_web

to run the Docker container. Run

    docker exec -it [container_name] /bin/bash

to start a bash inside your Docker container.