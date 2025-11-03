# AdGenXAI Project Cleanup Guide

## ✅ **Completed Cleanup Tasks**

### **1. Dependencies & TypeScript**
- ✅ Installed missing dependencies (`npm install`)
- ✅ Fixed all TypeScript compilation errors
- ✅ All tests passing (37 passed, 4 skipped)
- ✅ Fixed vitest path aliases to match tsconfig.json

### **2. Project Organization**
- ✅ **BEE-SHIP Documentation**: Moved to `docs/bee-ship/` folder
- ✅ **Deployment Scripts**: Organized in `scripts/deployment/` folder
- ✅ **Build Artifacts**: Cleaned `.next/` and `out/` directories

### **3. File Structure Cleanup**
```
Before:
├── BEE_SHIP_*.md (17 files in root)
├── *.bat, *.ps1 (12 deployment scripts in root)
├── .next/ (build artifacts)
├── out/ (export artifacts)

After:
├── docs/
│   ├── bee-ship/
│   │   ├── BEE_SHIP_API_DOCS.md
│   │   ├── BEE_SHIP_COMPLETE_GUIDE.md
│   │   └── ... (all BEE-SHIP docs)
│   └── CLEANUP_GUIDE.md (this file)
├── scripts/
│   └── deployment/
│       ├── SHIP_BEE_SWARM_NOW.bat
│       ├── SHIP_IT_NOW_COMPLETE.bat
│       └── ... (all deployment scripts)
```

## 🧹 **Regular Cleanup Commands**

### **Quick Development Cleanup**
```bash
# Clean build artifacts
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .next, out

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install

# Run tests and type checking
npm run typecheck
npm run test
```

### **Comprehensive Cleanup**
```bash
# 1. Clean all artifacts
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .next, out, node_modules

# 2. Fresh install
npm install

# 3. Validate everything works
npm run typecheck
npm run build
npm run test

# 4. Clean up git
git clean -fd  # Remove untracked files
```

## 🔧 **Security & Dependencies**

### **Current Vulnerabilities**
- **esbuild ≤0.24.2**: Moderate severity (development only)
- **Recommendation**: Monitor for esbuild updates, doesn't affect production

### **Dependency Maintenance**
```bash
# Check for outdated packages
npm outdated

# Update non-breaking changes
npm update

# Audit security vulnerabilities
npm audit
npm audit fix  # Apply safe fixes
```

## 📁 **Project Structure Guidelines**

### **Keep Organized**
- 📝 **Documentation**: Always in `docs/` folder
- 🚀 **Scripts**: Always in `scripts/` folder with subfolders
- 🧪 **Tests**: Keep in `__tests__/` folders next to components
- 📦 **Build Artifacts**: Auto-cleaned by scripts, don't commit

### **BEE-SHIP Deployment**
- Use scripts in `scripts/deployment/` for one-click deploys
- Main deployment: `scripts/deployment/SHIP_BEE_SWARM_NOW.bat`
- Alternative: `scripts/deployment/SHIP_IT_NOW_COMPLETE.bat`

## ⚡ **Performance Optimization**

### **Next.js Build**
- ✅ Static export configured (`output: 'export'`)
- ✅ Tailwind purging enabled
- ✅ TypeScript strict mode enabled

### **Testing Performance**
- ✅ Vitest with jsdom environment
- ✅ Coverage reporting configured
- ✅ Path aliases properly configured

## 🚨 **Cleanup Triggers**

Run cleanup when:
- TypeScript errors appear
- Tests fail unexpectedly  
- Build process fails
- After major dependency updates
- Before important deployments
- When switching between projects

## 📋 **Cleanup Checklist**

- [ ] Remove build artifacts (`.next/`, `out/`)
- [ ] Check for TypeScript errors (`npm run typecheck`)
- [ ] Run tests (`npm run test`)
- [ ] Verify build works (`npm run build`)
- [ ] Check for security vulnerabilities (`npm audit`)
- [ ] Commit organized changes
- [ ] Deploy to verify everything works

---

*Last updated: November 1, 2025*
*Cleanup completed: Dependencies ✅ | Organization ✅ | Tests ✅*