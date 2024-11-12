# Dockerfile for the Fragments UI

# Stage 0: Install alpine Linux + node + dependencies
# Use node version 20.10.0
FROM node:20.10.0-alpine3.19@sha256:9e38d3d4117da74a643f67041c83914480b335c3bd44d37ccf5b5ad86cd715d1 AS dependencies

# Use /app as our working directory
WORKDIR /app

COPY package*.json /app/

# Install exact node devDependencies (especially the amplify can cause conflict)
RUN npm ci

#######################################################################

# Stage 1: Build the application
FROM node:20.10.0-alpine3.19@sha256:9e38d3d4117da74a643f67041c83914480b335c3bd44d37ccf5b5ad86cd715d1 AS builder 
    
WORKDIR /app

ARG API_URL 
ARG AWS_COGNITO_POOL_ID 
ARG AWS_COGNITO_CLIENT_ID
ARG AWS_COGNITO_HOSTED_UI_DOMAIN
ARG OAUTH_SIGN_IN_REDIRECT_URL
ARG OAUTH_SIGN_OUT_REDIRECT_URL

ENV API_URL=${API_URL}
ENV AWS_COGNITO_POOL_ID=${AWS_COGNITO_POOL_ID}
ENV AWS_COGNITO_CLIENT_ID=${AWS_COGNITO_CLIENT_ID}
ENV AWS_COGNITO_HOSTED_UI_DOMAIN=${AWS_COGNITO_HOSTED_UI_DOMAIN}
ENV OAUTH_SIGN_IN_REDIRECT_URL=${OAUTH_SIGN_IN_REDIRECT_URL}
ENV OAUTH_SIGN_OUT_REDIRECT_URL=${OAUTH_SIGN_OUT_REDIRECT_URL}

# Copy cached dependencies from previous stage so we don't have to download
COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=dependencies /app/package*.json /app/

# Copy src to /app/src/
COPY ./src ./src
COPY ./index.html /app/

RUN npm run build

#######################################################################

# Stage 2: Final Image with using nginx
FROM nginx:1.27.2-alpine3.20@sha256:2140dad235c130ac861018a4e13a6bc8aea3a35f3a40e20c1b060d51a7efd250

LABEL maintainer="Zoey Lin <zlin104@myseneca.ca>" \
      description="Fragments node.js microservice"

WORKDIR /usr/local/src/fragments-ui

ENV PORT=80 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false

#copy from builder
COPY --from=builder /app/dist/. /usr/share/nginx/html/

# We run our service on port 8080
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
