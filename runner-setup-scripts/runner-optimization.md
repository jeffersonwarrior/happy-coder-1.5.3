# Self-hosted Runner Optimization Guide

## 🚀 Performance Optimizations

### Hardware Optimizations
- **SSD Storage**: Use NVMe SSDs for fastest I/O
- **RAM**: 32GB+ for parallel builds and caching
- **CPU**: High core count (16+ cores) for Rust compilation
- **Network**: Stable internet for downloading dependencies

### Software Optimizations

#### Rust Compilation
```bash
# Set in runner environment
export CARGO_INCREMENTAL=1
export CARGO_TARGET_DIR=/tmp/cargo-target  # Use fast temp storage
export RUSTC_WRAPPER=sccache  # Optional: distributed compilation cache
```

#### Node.js Optimizations
```bash
# Use faster package manager
npm install -g pnpm
# Or use Yarn v3/4 for faster installs
npm install -g yarn
```

#### Pre-installed Dependencies
Keep these installed on runners:
- Node.js 22
- Rust stable toolchain
- Platform-specific build tools
- System dependencies (GTK, WebKit, etc.)

### Caching Strategy

#### Rust Dependencies
- Cache `~/.cargo/registry`
- Cache `~/.cargo/git`
- Cache `src-tauri/target/` between builds

#### Node.js Dependencies
- Cache `node_modules/` with proper invalidation
- Use `npm ci` instead of `npm install`
- Consider using `pnpm` for faster installs

### Runner Labels

Use specific labels for routing:
- `ubuntu-self-hosted` - Linux builds
- `windows-self-hosted` - Windows builds
- `macos-self-hosted` - macOS builds
- `fast-build` - High-performance runners
- `parallel-build` - Multi-core optimized

### Monitoring

Track build performance:
- Build duration trends
- Resource utilization (CPU, RAM, disk)
- Cache hit rates
- Network usage

### Expected Performance

**Current (GitHub-hosted):**
- Ubuntu: ~10 minutes
- Windows: ~11 minutes
- macOS: ~7 minutes

**Self-hosted (optimized):**
- Ubuntu: 2-4 minutes
- Windows: 3-5 minutes
- macOS: 2-3 minutes

**Performance gain: 2-5x faster builds**