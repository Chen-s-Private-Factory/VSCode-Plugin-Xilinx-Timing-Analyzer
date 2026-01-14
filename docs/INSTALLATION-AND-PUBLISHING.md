# Installing and Publishing the Extension

This guide explains how to install the extension for testing and how to publish it to the VSCode Marketplace.

## Table of Contents
- [Installing Locally](#installing-locally)
- [Publishing to Marketplace](#publishing-to-marketplace)
- [Creating .VSIX Package](#creating-vsix-package)
- [Version Management](#version-management)

## Installing Locally

### Method 1: Run from Source (Development)

This is the quickest way to test the extension during development.

1. **Open project in VSCode**
   ```bash
   cd C:\Users\chen\xilinx-timing-analyzer
   code .
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Compile TypeScript**
   ```bash
   npm run compile
   ```

4. **Launch Extension Development Host**
   - Press `F5` or
   - Run menu → Start Debugging → Extension
   - A new VSCode window opens with the extension loaded

5. **Test the extension**
   - Open a `.twr` file in the new window
   - Extension features are active immediately

**Reload after changes:**
- In the Extension Development Host window:
  - Press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)
  - Or `Ctrl+Shift+P` → "Developer: Reload Window"

### Method 2: Install from VSIX Package

This installs the extension permanently in your VSCode.

1. **Package the extension** (see [Creating .VSIX Package](#creating-vsix-package))

2. **Install the .vsix file**
   - Option A: Command line
     ```bash
     code --install-extension xilinx-timing-analyzer-0.1.0.vsix
     ```
   
   - Option B: VSCode GUI
     1. Open VSCode
     2. Go to Extensions view (`Ctrl+Shift+X`)
     3. Click `...` (Views and More Actions) menu
     4. Select "Install from VSIX..."
     5. Browse to the `.vsix` file and select it

3. **Reload VSCode**
   - `Ctrl+Shift+P` → "Developer: Reload Window"

4. **Verify installation**
   - Open Extensions view
   - Search for "Xilinx Timing Analyzer"
   - Should appear in the installed extensions list

### Method 3: Install from Marketplace

Once published (see [Publishing to Marketplace](#publishing-to-marketplace)):

1. **Open Extensions view** (`Ctrl+Shift+X`)
2. **Search** for "Xilinx Timing Analyzer"
3. **Click Install**
4. **Reload** VSCode if prompted

## Creating .VSIX Package

### Prerequisites

Install `vsce` (Visual Studio Code Extension manager):

```bash
npm install -g @vscode/vsce
```

### Steps to Create Package

1. **Ensure code is compiled**
   ```bash
   npm run compile
   ```

2. **Update version in package.json** (if needed)
   ```json
   {
     "version": "0.1.0"
   }
   ```

3. **Create the package**
   ```bash
   vsce package
   ```
   
   This creates `xilinx-timing-analyzer-0.1.0.vsix` in the project root.

4. **Verify package contents** (optional)
   ```bash
   vsce ls
   ```
   
   This lists all files that will be included in the package.

### Package Options

**Specific version:**
```bash
vsce package 0.2.0
```

**Pre-release version:**
```bash
vsce package --pre-release
```

**No yarn (use npm only):**
```bash
vsce package --no-yarn
```

## Publishing to Marketplace

### Prerequisites

1. **Microsoft/Azure account**
   - Sign up at https://azure.microsoft.com/

2. **Azure DevOps organization**
   - Create at https://dev.azure.com/

3. **Personal Access Token (PAT)**
   - Go to https://dev.azure.com/
   - User Settings → Personal access tokens
   - Click "New Token"
   - Name: "vsce"
   - Organization: All accessible organizations
   - Scopes: **Marketplace → Manage**
   - Click "Create"
   - **Save the token** (shown only once!)

4. **Create publisher**
   ```bash
   vsce create-publisher your-publisher-name
   ```
   
   Or create at: https://marketplace.visualstudio.com/manage

### Publishing Steps

1. **Login to vsce**
   ```bash
   vsce login your-publisher-name
   ```
   
   Enter your Personal Access Token when prompted.

2. **Update package.json with publisher**
   ```json
   {
     "publisher": "your-publisher-name",
     "version": "0.1.0"
   }
   ```

3. **Publish the extension**
   ```bash
   vsce publish
   ```
   
   Or publish a specific version:
   ```bash
   vsce publish 0.1.0
   ```
   
   Or publish with version bump:
   ```bash
   vsce publish patch   # 0.1.0 → 0.1.1
   vsce publish minor   # 0.1.0 → 0.2.0
   vsce publish major   # 0.1.0 → 1.0.0
   ```

4. **Verify publication**
   - Go to https://marketplace.visualstudio.com/
   - Search for your extension
   - Or view your publisher page: https://marketplace.visualstudio.com/publishers/your-publisher-name

### Publishing Pre-release

For beta testing:

```bash
vsce publish --pre-release
```

Users can install pre-release versions from the marketplace.

### Updating Published Extension

1. **Make changes** to code
2. **Update version** in package.json
3. **Compile and test**
   ```bash
   npm run compile
   # Test with F5
   ```
4. **Publish update**
   ```bash
   vsce publish
   ```

## Version Management

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backwards compatible (e.g., 0.1.0 → 0.2.0)
- **PATCH**: Bug fixes (e.g., 0.1.0 → 0.1.1)

### Updating Version

**Manually in package.json:**
```json
{
  "version": "0.2.0"
}
```

**Using npm:**
```bash
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0
npm version major  # 0.1.0 → 1.0.0
```

**Using vsce:**
```bash
vsce publish patch
vsce publish minor
vsce publish major
```

### Version in README.md

Update the Changelog section:

```markdown
## Changelog

### v0.2.0 (2026-01-20)
- ✨ New feature: Export timing graphs as PNG
- 🐛 Fixed: Parser issue with long paths
- 📝 Updated documentation

### v0.1.0 (2026-01-13)
- ✅ Initial release
```

## Unpublishing

**Unpublish a version:**
```bash
vsce unpublish your-publisher-name.xilinx-timing-analyzer@0.1.0
```

**Unpublish entire extension:**
```bash
vsce unpublish your-publisher-name.xilinx-timing-analyzer
```

⚠️ **Warning**: Unpublishing is permanent and cannot be undone!

## Best Practices

### Before Publishing

- ✅ Test thoroughly with `F5` (Extension Development Host)
- ✅ Test with packaged .vsix file
- ✅ Update version number
- ✅ Update CHANGELOG in README.md
- ✅ Review .vscodeignore (files to exclude)
- ✅ Run `vsce ls` to verify package contents
- ✅ Commit and push to GitHub
- ✅ Create git tag for the version

### .vscodeignore

Ensure these are excluded from the package:

```
.vscode/
.gitignore
.git/
node_modules/
src/
tsconfig.json
.vscodeignore
*.vsix
test/
docs/
*.md (except README.md)
```

Current .vscodeignore should already have these.

### Git Tags

Tag releases for version tracking:

```bash
git tag -a v0.1.0 -m "Initial release"
git push origin v0.1.0
```

### GitHub Releases

1. Go to repository → Releases → New release
2. Choose tag (v0.1.0)
3. Add release notes
4. Attach the .vsix file
5. Publish release

## Troubleshooting

### Package fails

```bash
# Check for errors in package.json
vsce verify-pat your-publisher-name

# List what will be packaged
vsce ls

# Package with verbose output
vsce package --verbose
```

### Publish fails - Not logged in

```bash
vsce logout
vsce login your-publisher-name
```

### Publish fails - PAT expired

Generate new Personal Access Token and login again.

### Extension not loading after install

```bash
# Check extension is installed
code --list-extensions | grep xilinx

# Reload VSCode
# Ctrl+Shift+P → "Developer: Reload Window"
```

### Users can't find extension

- Check extension is public (not private)
- Verify in marketplace: https://marketplace.visualstudio.com/
- Search may take a few minutes to update

## Quick Reference

```bash
# Development
npm install
npm run compile
# Press F5 to test

# Package
npm install -g @vscode/vsce
vsce package

# Install locally
code --install-extension xilinx-timing-analyzer-0.1.0.vsix

# Publish
vsce login your-publisher-name
vsce publish

# Update version and publish
vsce publish patch  # or minor/major
```

## Resources

- [VSCode Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)
- [Extension Manifest Reference](https://code.visualstudio.com/api/references/extension-manifest)
- [Azure DevOps](https://dev.azure.com/)
- [VSCode Marketplace](https://marketplace.visualstudio.com/)
