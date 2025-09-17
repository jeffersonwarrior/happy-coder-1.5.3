#!/bin/bash
# macOS Self-hosted Runner Setup Script

set -e

echo "🍎 Setting up macOS self-hosted runner for Happy Desktop builds..."

# Install Homebrew if not present
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install required dependencies
echo "📦 Installing system dependencies..."
brew install node@22
brew install rust
brew install git

# Make Node 22 default
brew link --force node@22

# Install Xcode Command Line Tools
echo "🔨 Installing Xcode Command Line Tools..."
xcode-select --install || true  # May already be installed

# Create runner directory
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download runner
echo "🏃 Downloading GitHub Actions runner..."
curl -o actions-runner-osx-x64-2.319.1.tar.gz -L https://github.com/actions/runner/releases/download/v2.319.1/actions-runner-osx-x64-2.319.1.tar.gz

# Validate hash
echo "bb39f5c28b212f298932e4536570bb7c9d5c9a8906c7c4e5bd5ad4b75001d005  actions-runner-osx-x64-2.319.1.tar.gz" | shasum -a 256 -c

# Extract
tar xzf ./actions-runner-osx-x64-2.319.1.tar.gz

echo "✅ Runner setup complete!"
echo ""
echo "🔑 Next steps:"
echo "1. Go to: https://github.com/jeffersonwarrior/happy-coder-1.5.3/settings/actions/runners"
echo "2. Click 'New self-hosted runner' and select macOS"
echo "3. Copy the token and URL, then run:"
echo "   ./config.sh --url https://github.com/jeffersonwarrior/happy-coder-1.5.3 --token YOUR_TOKEN --labels macos-self-hosted"
echo "4. Run the runner: ./run.sh"
echo ""
echo "💡 To run as a service (requires sudo):"
echo "   sudo ./svc.sh install"
echo "   sudo ./svc.sh start"