FROM node:20-alpine AS build
WORKDIR /app

# Build-time args (VITE_ vars are inlined into the bundle during `npm run build`)
ARG VITE_OPENAI_API_KEY
ARG VITE_LDA_CLIENT_ID
ARG VITE_LDA_CLIENT_SECRET
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_LDA_CLIENT_ID=$VITE_LDA_CLIENT_ID
ENV VITE_LDA_CLIENT_SECRET=$VITE_LDA_CLIENT_SECRET
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage — only ship the static dist
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
