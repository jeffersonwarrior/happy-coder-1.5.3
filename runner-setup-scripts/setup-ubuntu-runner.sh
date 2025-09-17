#!/bin/bash
# Ubuntu Self-hosted Runner Setup Script

set -e

echo "🐧 Setting up Ubuntu self-hosted runner for Happy Desktop builds..."

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install required dependencies
echo "📦 Installing system dependencies..."
sudo apt-get install -y \
  curl \
  git \
  build-essential \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  pkg-config \
  libssl-dev

# Install Node.js 22
echo "📦 Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust
echo "🦀 Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env

# Create runner directory
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download runner
echo "🏃 Downloading GitHub Actions runner..."
curl -o actions-runner-linux-x64-2.319.1.tar.gz -L https://github.com/actions/runner/releases/download/v2.319.1/actions-runner-linux-x64-2.319.1.tar.gz

# Validate hash
echo "3f6efb7488a183e291fc2c62876e14c9ee732864173734facc85a1bfb1744464  actions-runner-linux-x64-2.319.1.tar.gz" | shasum -a 256 -c

# Extract
tar xzf ./actions-runner-linux-x64-2.319.1.tar.gz

echo "✅ Runner setup complete!"
echo ""
echo "🔑 Next steps:"
echo "1. Go to: https://github.com/jeffersonwarrior/happy-coder-1.5.3/settings/actions/runners"
echo "2. Click 'New self-hosted runner' and select Linux"
echo "3. Copy the token and URL, then run:"
echo "   ./config.sh --url https://github.com/jeffersonwarrior/happy-coder-1.5.3 --token YOUR_TOKEN --labels ubuntu-self-hosted"
echo "4. Run the runner: ./run.sh"
echo ""
echo "💡 To run as a service:"
echo "   sudo ./svc.sh install"
echo "   sudo ./svc.sh start"