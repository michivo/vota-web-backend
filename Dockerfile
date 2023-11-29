FROM mcr.microsoft.com/dotnet/sdk:3.1 AS build-env

ENV DOTNET_CLI_TELEMETRY_OPTOUT true
RUN git clone https://gitlab.com/mtausig/vota.git /app

RUN useradd -ms /bin/bash builduser
RUN chown -R builduser /app
USER builduser

WORKDIR /app/Vota.CLI
RUN dotnet restore

WORKDIR /app/Vota.CLI
# todo? version is hardcoded, not taken from repo
RUN dotnet publish -c Release  -p:Version=2.1.0 -o publish/

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:3.1

RUN apt-get update -yq && apt-get upgrade -yq && apt-get install -yq curl git nano
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -yq nodejs build-essential

ENV DOTNET_CLI_TELEMETRY_OPTOUT true

RUN useradd -ms /bin/bash runuser

WORKDIR /app
COPY --from=build-env --chown=runuser /app/Vota.CLI/publish .

# ENTRYPOINT ["dotnet", "Vota.dll"]

WORKDIR /webapp
COPY package*.json /webapp
RUN npm install

ENV NODE_ENV=test

COPY . /webapp/
RUN npm run build

RUN chown -R runuser /webapp/database
RUN chmod 666 /webapp/database/*.db
RUN chown -R runuser /webapp/database/*.db

USER runuser
EXPOSE 10081
CMD ["npm", "start"]
