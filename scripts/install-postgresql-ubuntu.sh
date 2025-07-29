#!/bin/bash

echo "Installing PostgreSQL on Ubuntu..."

# Update package index
sudo apt update

# Install PostgreSQL and additional contributed packages
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create a database user for your application
sudo -u postgres createuser --interactive --pwprompt navigator_user

# Create the database
sudo -u postgres createdb fair_chance_navigator_local

# Grant privileges to the user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fair_chance_navigator_local TO navigator_user;"

echo "Installing pgAdmin4..."

# Install required packages for pgAdmin4
sudo apt install -y curl ca-certificates gnupg

# Add pgAdmin4 APT repository
curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub | sudo gpg --dearmor -o /usr/share/keyrings/packages-pgadmin-org.gpg

# Add the repository configuration
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/packages-pgadmin-org.gpg] https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list'

# Update package list
sudo apt update

# Install pgAdmin4 web version
sudo apt install -y pgadmin4-web

# Configure pgAdmin4 web setup (non-interactive)
sudo /usr/pgadmin4/bin/setup-web.py --yes --email pgadmin@local.com --password admin123

echo "PostgreSQL and pgAdmin4 installation complete!"
echo ""
echo "Database Details:"
echo "- Database Name: fair_chance_navigator_local"
echo "- Username: navigator_user"
echo "- Host: localhost"
echo "- Port: 5432"
echo ""
echo "pgAdmin4 Web UI has been installed and configured:"
echo "- Access URL: http://localhost/pgadmin4"
echo "- Username: pgadmin@local.com"
echo "- Password: admin123"
echo ""
echo "To connect to your database in pgAdmin4:"
echo "1. Open http://localhost/pgadmin4 in your browser"
echo "2. Login with the credentials above"
echo "3. Add new server with these settings:"
echo "   - Name: Fair Chance Navigator Local"
echo "   - Host: localhost"
echo "   - Port: 5432"
echo "   - Database: fair_chance_navigator_local"
echo "   - Username: navigator_user"
echo "   - Password: (the password you set during installation)"
echo ""
echo "You can now update your .env.local file with the database URL:"
echo "DATABASE_URL=postgresql://navigator_user:your_password@localhost:5432/fair_chance_navigator_local"
echo ""
echo "After updating your .env.local file with the correct password, run:"
echo "cd server && npm run db:push"
echo "This will create the required tables (users and organizations) in your database."