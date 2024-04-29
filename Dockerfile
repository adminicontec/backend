# Use the recommended version of Node.js
FROM node:10.15.3

# Set the working directory in the Docker container
WORKDIR /app

# Install TypeScript, ts-node, and Node.js types globally
RUN npm install -g typescript ts-node @types/node

# Copy the package.json and package-lock.json (or yarn.lock) files
COPY package*.json ./

# Install project dependencies
RUN npm install --production

# Copy the project source code into the Docker container
COPY . .

# Install scnode_cli from the given repository
#RUN npm install -g @screeps/scnode_cli

# Use scnode_cli to deploy the project
#RUN scnode_cli --deploy prod --dist ./dist

# Change to the directory containing the production build
WORKDIR /app/dist

# Install any necessary production dependencies in the distribution directory
RUN npm install --production

# Specify the command to start the app in production
CMD ["npm", "start"]
