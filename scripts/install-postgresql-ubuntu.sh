
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

echo "PostgreSQL installation complete!"
echo ""
echo "Database Details:"
echo "- Database Name: fair_chance_navigator_local"
echo "- Username: navigator_user"
echo "- Host: localhost"
echo "- Port: 5432"
echo ""
echo "You can now update your .env.local file with the database URL:"
echo "DATABASE_URL=postgresql://navigator_user:your_password@localhost:5432/fair_chance_navigator_local"
