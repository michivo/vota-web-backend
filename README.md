# Vota Web Backend

# Dockerized version

## Prerequisistes

Before running the VOTA backend service, you have to prepare the configuration file. Check config/example.json for 
a sample config file:

```json
{
    "server": {
        "port": 10081
    },
    "database": {
        "path": "/data/TODO.db"
    },
    "auth": {
        "privateKeyFile": "/keys/TODO.key",
        "publicKeyFile": "/keys/TODO.key.pub",
        "keyId": "TODO"
    },
    "email": {
        "apiKey": "TODO",
        "senderAddress": "michael@daredevels.com",
        "replyToAddress": "noreply@daredevels.com",
        "frontendUrl": "https://vota.gruene.at",
        "mode": "SMTP | SendGrid",
        "smtpHost": "TODO",
        "smtpPort": 587,
        "smtpUser": "TODO",
        "smtpPass": "TODO",
        "smtpSecure": false
    },
    "vota": {
        "cliPath": "/app/Vota.CLI.dll",
        "tempFolder": "/tmp"
    }
}
```

You'll have to 
- specify a server port
- a path to the database file. Make sure that the file exists and that you have permissions to read and write the file
- specify settings required for creating and verifying JWTs (see details below)
- specify email settings (see details below)
- specify a path to the Vota CLI (see https://gitlab.com/mtausig/vota ). When you're running a dockerized version of Vota Web, this is not required, since the build process will also download and build Vota for you

### Create JWT Tokens

Run `ssh-keygen -t rsa -b 4096 -m PEM -f vota.key` to create a private key (no passphrase), then 
`openssl rsa -in vota.key -pubout -outform PEM -out vota.key.pub` to create the corresponding public key and
`openssl rsa -in vota.key | sed 's/--.*$//g' | base64 --decode | sha1sum` to create a key id.

Place the public and private key files in a folder and mount it into the docker container as a volume. Update your config
file accordingly.

### Email settings

You can either use Sendgrid or any SMTP server to send mails to users. In case you want to use a Sendgrid account, you
have to specify the `apiKey` for your account in the config file. If you want to use SMTP, you'll have to specify all
config settings starting with `smtp`.

## Mounting Volumes

You'll have to mount one or more volumes to provide the Docker container access to the
database (read and write access), config file (read access) and key files (read access).

You can use the config files in the Docker container or you use one in a volume mounted from your host machine.
If you want to mount one from your host machine, you need to set the `NODE_CONFIG_DIR` environment variable
to specify the volume name.

When using docker compose, the respective sections in your compose file may look like this:

```yml
    environment:
      - NODE_CONFIG_DIR=/vota_config
    volumes:
      - /var/vota-web-backend/config:/vota_config
      - /var/vota-web-backend/database:/data
      - /var/vota-web-backend/keys:/keys
```

## Running the Dockerized version

Run

    docker build -t vota_backend .

to build the Docker container. Run 

    docker run -it -p 10081:10081 --mount type=bind,source="$(pwd)"/database,target="/data" vota_backend

to run the Docker container. Run

    docker exec -it [container_name] /bin/bash

to start a bash inside your Docker container.