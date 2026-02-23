# Welcome to MyBudget app back-end!

A personal project built to track my spending in a simple cohesive way.

## Quickstart

### 1. Install dependencies

    npm -i

### 2. Spin up POSTGres DB container

There exists a docker compose file for this purpose simply run

    docker compose -f postgres.dev.yml up -d

If you'd like to define the name of the container run

    docker compose -p SOMENAME -f postgres.dev.yml up -d

### 3. Populate `.env` file

Follow the `sample.env` file to populate required variables.

Ensure the `.env` file is located in the root directory `./mybudget-backend/.env`

### 4. Migrate 

Run the migrations for your postgres db

    npm run migrations

### 5. Start Server

Last step is to simply start up the server

    npm run dev

If you'd like to use the production version

    npm run build
    npm start
