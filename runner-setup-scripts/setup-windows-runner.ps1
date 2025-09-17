# Windows Self-hosted Runner Setup Script
# Run this in PowerShell as Administrator

Write-Host "🪟 Setting up Windows self-hosted runner for Happy Desktop builds..." -ForegroundColor Green

# Install Chocolatey if not present
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install required tools
Write-Host "📦 Installing required tools..." -ForegroundColor Yellow
choco install -y nodejs --version=22.0.0
choco install -y rust-ms
choco install -y git
choco install -y visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools"

# Refresh environment
refreshenv

# Create runner directory
Write-Host "🏃 Setting up GitHub Actions runner..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "C:\actions-runner" -Force
Set-Location "C:\actions-runner"

# Download runner
Invoke-WebRequest -Uri "https://github.com/actions/runner/releases/download/v2.319.1/actions-runner-win-x64-2.319.1.zip" -OutFile "actions-runner-win-x64-2.319.1.zip"

# Validate hash
if ((Get-FileHash actions-runner-win-x64-2.319.1.zip -Algorithm SHA256).Hash.ToUpper() -ne "113E755FEF6E0A5AC3CB0F3F5E98E4E88C9B9D5B80F2AE0139D9E43DE8F8A93F") {
    throw "Hash verification failed"
}

# Extract
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD\actions-runner-win-x64-2.319.1.zip", "$PWD")

Write-Host "✅ Runner setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to: https://github.com/jeffersonwarrior/happy-coder-1.5.3/settings/actions/runners"
Write-Host "2. Click 'New self-hosted runner' and select Windows"
Write-Host "3. Copy the token and URL, then run:"
Write-Host "   .\config.cmd --url https://github.com/jeffersonwarrior/happy-coder-1.5.3 --token YOUR_TOKEN --labels windows-self-hosted"
Write-Host "4. Run the runner: .\run.cmd"
Write-Host ""
Write-Host "💡 To run as a service:"
Write-Host "   .\svc.sh install"
Write-Host "   .\svc.sh start"