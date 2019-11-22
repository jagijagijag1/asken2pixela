# Use the official lightweight Node.js 10 image.
# https://hub.docker.com/_/node
FROM node:10-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package.json yarn.lock ./

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install puppeteer so it's available in the container.
RUN yarn add puppeteer \
    # Add user so we don't need --no-sandbox.
    # same layer as npm install to keep re-chowned files from using up several hundred MBs more space
    && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser ./node_modules

# Set environment variables
ENV TZ Asia/Tokyo
ENV PORT 8080
ENV ASKEN_URL http://asken.jp/login
ENV ASKEN_EMAIL <your-login-email-address
ENV ASKEN_PASS <your-login-password>
ENV PIXELA_USER <your-pixela-user-id
ENV PIXELA__GRAPH <your-pixela-graph-id
ENV PIXELA_TOKEN <your-pixela-token>

# Install production dependencies.
RUN yarn install --production

# Copy local code to the container image.
COPY index.js ./
RUN chown -R pptruser:pptruser ./*

# Run everything after as non-privileged user.
USER pptruser

# Run the web service on container startup.
EXPOSE 8080
CMD [ "yarn", "run", "server" ]
