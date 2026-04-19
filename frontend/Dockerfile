# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .



# Expose the port Next.js dev server runs on
EXPOSE 3000

# Command to run the development server
CMD ["npm", "run", "dev"]
