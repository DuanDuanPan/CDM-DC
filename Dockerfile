# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy all files (needed for postinstall script)
COPY . .

# Install dependencies
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy from deps
COPY --from=deps /app ./

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production runner with nginx as reverse proxy
FROM node:20-alpine AS runner
WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/docs ./docs

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Set permissions
RUN chown -R nextjs:nodejs /app

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'nginx' >> /start.sh && \
    echo 'exec node server.js' >> /start.sh && \
    chmod +x /start.sh

# Expose both ports
EXPOSE 80 3000

# Start both nginx and Node.js
CMD ["/start.sh"]
