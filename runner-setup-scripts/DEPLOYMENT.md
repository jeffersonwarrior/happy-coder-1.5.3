# Self-hosted Runners Deployment Guide

## 🎯 Quick Start

### 1. Prepare Hardware
- **Ubuntu Machine**: 8+ cores, 16GB+ RAM, 500GB+ SSD
- **Windows Machine**: 8+ cores, 16GB+ RAM, 500GB+ SSD
- **macOS Machine**: Mac with 8+ cores, 16GB+ RAM, 500GB+ SSD

### 2. Run Setup Scripts

#### Ubuntu
```bash
chmod +x setup-ubuntu-runner.sh
./setup-ubuntu-runner.sh
```

#### Windows (as Administrator)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup-windows-runner.ps1
```

#### macOS
```bash
chmod +x setup-macos-runner.sh
./setup-macos-runner.sh
```

### 3. Register Runners

For each platform:

1. Go to [Repository Settings → Actions → Runners](https://github.com/jeffersonwarrior/happy-coder-1.5.3/settings/actions/runners)
2. Click **"New self-hosted runner"**
3. Select your platform
4. Copy the token and run:

**Ubuntu:**
```bash
cd ~/actions-runner
./config.sh --url https://github.com/jeffersonwarrior/happy-coder-1.5.3 --token YOUR_TOKEN --labels ubuntu-self-hosted
./run.sh
```

**Windows:**
```cmd
cd C:\actions-runner
.\config.cmd --url https://github.com/jeffersonwarrior/happy-coder-1.5.3 --token YOUR_TOKEN --labels windows-self-hosted
.\run.cmd
```

**macOS:**
```bash
cd ~/actions-runner
./config.sh --url https://github.com/jeffersonwarrior/happy-coder-1.5.3 --token YOUR_TOKEN --labels macos-self-hosted
./run.sh
```

### 4. Install as Services (Optional)

**Ubuntu/macOS:**
```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

**Windows:**
```cmd
.\svc.sh install
.\svc.sh start
```

### 5. Update Workflow

Replace `.github/workflows/build-desktop.yml` with `build-desktop-self-hosted.yml`:

```bash
cp runner-setup-scripts/build-desktop-self-hosted.yml .github/workflows/build-desktop.yml
git add .github/workflows/build-desktop.yml
git commit -m "feat: use self-hosted runners for faster desktop builds"
git push
```

## 🔧 Troubleshooting

### Runner Not Connecting
- Check firewall settings
- Verify token hasn't expired
- Ensure proper network connectivity

### Build Failures
- Check runner system dependencies
- Verify Rust/Node.js versions
- Review runner logs

### Performance Issues
- Monitor CPU/RAM usage during builds
- Check SSD space availability
- Verify network speed

## 📊 Performance Monitoring

Track these metrics:
- Build duration per platform
- Resource utilization
- Success/failure rates
- Queue times

## 🔒 Security Considerations

- Runners run with local user permissions
- Keep runner software updated
- Monitor for suspicious activity
- Use dedicated build machines when possible

## 💰 Cost Savings

**Monthly Savings:**
- GitHub Actions minutes: $0 (free for public repos)
- Faster development cycles: Time savings
- Dedicated hardware: Better control and performance

## 🎉 Expected Results

**Build Time Improvements:**
- **Ubuntu**: 10min → 3min (70% faster)
- **Windows**: 11min → 4min (64% faster)
- **macOS**: 7min → 3min (57% faster)

**Total pipeline time: ~30min → ~10min**