#!/bin/bash

# Microfrontends Template Setup Script
# Usage: ./setup.sh <project-name> <org-name> [port]

set -e

# Si estamos dentro de .opencode/, ir al directorio padre
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ "$SCRIPT_DIR" == *"/.opencode" ]]; then
    cd "$SCRIPT_DIR/.."
    echo "📁 Working directory: $(pwd)"
fi

if [ -z "$1" ]; then
  echo "Usage: ./setup.sh <project-name> <org-name> [port]"
  echo ""
  echo "Arguments:"
  echo "  project-name  Name of your microfrontend (e.g., 'clients', 'dashboard')"
  echo "  org-name     Your organization name (e.g., 'kbd', 'mycompany')"
  echo "  port         Port for dev server (default: 8500)"
  echo ""
  echo "Example:"
  echo "  ./setup.sh clients kbd 8500"
  echo "  ./setup.sh productos kbd"
  exit 1
fi

PROJECT_NAME=$1
ORG_NAME=${2:-myorg}
PORT=${3:-8500}
TEMPLATE_DIR="${SCRIPT_DIR}/templates"

echo "🚀 Setting up microfrontend: @${ORG_NAME}/${PROJECT_NAME}"
echo ""

# Create project directory
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Copy React microfrontend template
cp -r "$TEMPLATE_DIR/microfrontend-react/"* .

# Rename entry point file BEFORE sed replacements
mv "src/ORG_NAME-mi-microfrontend.jsx" "src/${ORG_NAME}-${PROJECT_NAME}.jsx"

# Replace placeholders in file contents
echo "📝 Replacing placeholders..."
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.ejs" \) -exec sed -i "s/ORG_NAME/${ORG_NAME}/g" {} \;
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.ejs" \) -exec sed -i "s/mi-microfrontend/${PROJECT_NAME}/g" {} \;

# Update port in package.json and webpack.config.js
sed -i "s/--port [0-9]*/--port ${PORT}/g" package.json
sed -i "s/port: [0-9]*/port: ${PORT}/g" webpack.config.js

# Rename App.jsx to match project name (e.g., KbdProductos.jsx)
APP_JSX="${ORG_NAME^}${PROJECT_NAME^}.jsx"
mv "src/App.jsx" "src/${APP_JSX}" 2>/dev/null || true

# Update App import in root.component.jsx if renamed
if [ -f "src/${APP_JSX}" ]; then
  sed -i "s/import App from \"\.\/App\"/import App from \".\/${APP_JSX}\"/g" src/root.component.jsx
fi

echo "✅ Setup complete!"
echo ""
echo "Project: @${ORG_NAME}/${PROJECT_NAME}"
echo "Port: ${PORT}"
echo ""
echo "Next steps:"
echo "  1. cd $PROJECT_NAME"
echo "  2. npm install"
echo "  3. npm start"
echo ""
echo "Then register in root-config/src/index.ejs:"
echo "  \"@${ORG_NAME}/${PROJECT_NAME}\": \"//localhost:${PORT}/${ORG_NAME}-${PROJECT_NAME}.js\""
echo ""
echo "And in root-config/src/root-config.js:"
echo "  registerApplication({ name: \"@${ORG_NAME}/${PROJECT_NAME}\", ... activeWhen: [\"/${PROJECT_NAME}\"] })"
