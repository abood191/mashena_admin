FROM kenanalshagory1/nexora-web-node:latest

## Create non-root user and use existing 'www-data' group
RUN useradd -u 1001 -ms /bin/bash -g www-data www && chown -R www:www-data /var/www

# Set working directory
WORKDIR /var/www

# Copy only package files (to cache npm install)
COPY --chown=www:www-data ./package*.json ./

# Install dependencies (will be cached if package files don’t change)
RUN npm install --legacy-peer-deps
RUN npm install @mui/system @mui/material @emotion/react @emotion/styled

# Copy the rest of the app
COPY --chown=www:www-data ./ .

# Build the project
RUN npm run build

# Expose port and start app
EXPOSE 3000
ENTRYPOINT ["npm", "run", "start"]
