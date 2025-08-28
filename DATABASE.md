# EV Calculator Database Setup

This document explains how to set up and run the PostgreSQL database for the EV Calculator application using Docker Compose and Prisma ORM.

## Quick Start

### 1. Setup Database (Recommended)

```bash
# Run the setup script (sets up DB + Prisma)
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

### 2. Manual Setup

```bash
# Start only the PostgreSQL database
docker-compose up postgres -d

# Generate Prisma client and setup schema
npm run db:generate
npm run db:push
npm run db:seed

# Check if the database is running
docker-compose ps
```

### 3. Run Full Stack (Database + App)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data)
docker-compose down -v
```

## Services

### PostgreSQL Database
- **Container**: `ev-calculator-postgres`
- **Port**: `5432` (exposed on host)
- **Database**: `ev_calculator`
- **Username**: `postgres`
- **Password**: `postgres123`
- **Connection String**: `postgresql://postgres:postgres123@localhost:5432/ev_calculator`



### Next.js Application
- **Container**: `ev-calculator-app`
- **Port**: `3000` (exposed on host)
- **URL**: http://localhost:3000

## Database Schema

The database includes a simple, focused schema:

### Core Table
- **users**: User accounts and authentication with roles

### Sample Data
The database is automatically populated with:
- 3 test user accounts (admin, user, demo)

## Environment Variables

Create a `.env.local` file with:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/ev_calculator

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Environment
NODE_ENV=development
```

## Development Workflow

### Connect to Database

```bash
# Using psql command line
docker exec -it ev-calculator-postgres psql -U postgres -d ev_calculator

# Using Docker Compose
docker-compose exec postgres psql -U postgres -d ev_calculator
```

### Backup Database

```bash
# Create backup
docker exec ev-calculator-postgres pg_dump -U postgres ev_calculator > backup.sql

# Restore backup
docker exec -i ev-calculator-postgres psql -U postgres ev_calculator < backup.sql
```

### View Database Logs

```bash
# View PostgreSQL logs
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f postgres
```

## Database Management

### Using Prisma Studio (Recommended)

```bash
# Open Prisma Studio - Web-based database browser
npm run db:studio
# Opens http://localhost:5555
```

### Using Prisma CLI

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Seed database with sample data
npm run db:seed

# Reset database (⚠️ Deletes all data)
npm run db:reset
```

### Using Command Line
```bash
# Connect to database
docker exec -it ev-calculator-postgres psql -U postgres -d ev_calculator

# List tables
\dt

# Describe table structure
\d users

# Run query
SELECT * FROM users;

# Exit
\q
```

## Production Considerations

⚠️ **Important**: Before deploying to production:

1. **Change passwords**: Update all default passwords
2. **Use secrets**: Store sensitive data in Docker secrets or environment files
3. **Enable SSL**: Configure SSL/TLS for database connections
4. **Backup strategy**: Implement regular database backups
5. **Monitoring**: Add database monitoring and alerting
6. **Resource limits**: Set appropriate CPU and memory limits

## Troubleshooting

### Database Won't Start
```bash
# Check logs
docker-compose logs postgres

# Remove volumes and restart
docker-compose down -v
docker-compose up postgres -d
```

### Connection Issues
```bash
# Test connection
docker exec ev-calculator-postgres pg_isready -U postgres

# Check network
docker network ls
docker network inspect ev-calculator_ev-calculator-network
```

### Reset Everything
```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all -v

# Start fresh
docker-compose up -d
```

## Test Credentials

### Application Users
- **Admin**: `admin@evcalculator.com` / `password`
- **User**: `user@evcalculator.com` / `password`
- **Demo**: `demo@evcalculator.com` / `password`

### Database Access
- **PostgreSQL**: `postgres` / `postgres123`
