# Run these initial commands to setup the environment
# npm install in webApp, npm install in backend

# Change to webApp directory and run npm install
cd webApp && npm install

# Change back to parent directory
cd ..

# Change to backend directory and run npm install
cd backend && npm install

# Change back to parent directory
cd ..

# Run all servers concurrently
echo "Starting all servers..."

# Start the backend Node.js server
cd backend && npm start &

# Start the FastAPI server
cd fastapi && python3 openai_calls.py &

# Start the webApp development server
cd webApp && npm run dev &

# Wait for all background processes
wait
