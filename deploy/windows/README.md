# GitHub CLI Custom Build - windows

## Installation

### Windows
Run install.bat as administrator

### Linux/macOS
`ash
chmod +x install.sh
./install.sh
`

## Usage

The binary will be installed as 'gh-custom' to avoid conflicts with standard GitHub CLI.

### Basic Commands
`ash
gh-custom auth login
gh-custom pr list --repo owner/repo
gh-custom pr view 123
`

## Build Information
- Platform: windows
- Build Date: 11/03/2025 19:17:07
- Source: https://github.com/cli/cli
- Custom Features: Enhanced performance, cross-compilation support

## Automation Integration

This custom build integrates with the AdGenXAI automation system:

`powershell
# Use in PowerShell automation
.\pr-automation-v2.ps1 -Action full-audit -UseCustomCLI
`

`ash
# Use in bash scripts
export GH_CUSTOM="/usr/local/bin/gh-custom"
$GH_CUSTOM pr list --repo brandonlacoste9-tech/adgenxai
`
