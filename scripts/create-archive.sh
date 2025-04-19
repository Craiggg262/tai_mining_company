#!/bin/bash

# Run the node script to create the archive
echo "Creating archive of all code files..."
node scripts/create-archive.cjs

# Output success message
echo "Archive creation completed."
echo "The zip file is located at: ./crypto-mining-platform.zip"
echo "You can download this file and deploy it to any web server."