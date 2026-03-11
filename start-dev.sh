#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic
exec npx next dev --port 3000
