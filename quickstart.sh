#!/bin/sh
set -e

REPO="cardnexus"
REPO_URL="https://github.com/brightcolor/cardnexus.git"
INSTALL_DIR="/opt/${REPO}"

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { printf "${GREEN}[cardnexus]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[cardnexus]${NC} %s\n" "$*"; }
error() { printf "${RED}[cardnexus] ERROR:${NC} %s\n" "$*" >&2; exit 1; }

# ── Root check ────────────────────────────────────────────────────────────────
[ "$(id -u)" -eq 0 ] || error "Please run as root: sudo sh quickstart.sh"

# ── Dependency checks ─────────────────────────────────────────────────────────
command -v docker  >/dev/null 2>&1 || error "Docker not found. Install it first: https://get.docker.com"
command -v git     >/dev/null 2>&1 || error "git not found. Install it: apt install git / yum install git"

# ── Clone or update ───────────────────────────────────────────────────────────
if [ -d "${INSTALL_DIR}/.git" ]; then
  info "Repository already exists at ${INSTALL_DIR} — pulling latest..."
  git -C "${INSTALL_DIR}" pull --ff-only
else
  info "Creating ${INSTALL_DIR} and cloning repository..."
  mkdir -p "${INSTALL_DIR}"
  git clone "${REPO_URL}" "${INSTALL_DIR}"
fi

cd "${INSTALL_DIR}"

# ── Generate secret if .env doesn't exist ────────────────────────────────────
if [ ! -f .env ]; then
  info "Generating .env with a random BETTER_AUTH_SECRET..."
  SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
  cat > .env << EOF
BETTER_AUTH_SECRET=${SECRET}
APP_URL=http://$(hostname -I | awk '{print $1}'):3000
EOF
  info ".env created."
else
  warn ".env already exists — skipping secret generation."
fi

# ── Create data directories (bind mounts) ────────────────────────────────────
mkdir -p data uploads
info "Data directory:    ${INSTALL_DIR}/data"
info "Uploads directory: ${INSTALL_DIR}/uploads"

# ── Start ─────────────────────────────────────────────────────────────────────
info "Starting CardNexus via Docker Compose..."
docker compose pull
docker compose up -d

# ── Done ─────────────────────────────────────────────────────────────────────
IP=$(hostname -I | awk '{print $1}')
printf "\n${GREEN}✓ CardNexus is running!${NC}\n"
printf "  URL:      http://${IP}:3000\n"
printf "  Login:    admin@example.com\n"
printf "  Password: admin123\n"
printf "  Dir:      ${INSTALL_DIR}\n\n"
warn "Change the admin password after first login!"
