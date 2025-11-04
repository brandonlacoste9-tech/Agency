#!/bin/bash
echo "Installing GitHub CLI to /usr/local/bin/"
sudo cp gh /usr/local/bin/gh-custom
sudo chmod +x /usr/local/bin/gh-custom
echo ""
echo "GitHub CLI installed to /usr/local/bin/gh-custom"
echo "You can now use 'gh-custom' command"
