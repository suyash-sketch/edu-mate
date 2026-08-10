from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = BACKEND_DIR.parent

# --- SECURITY & JWT CONFIGURATION ---
SECRET_KEY = "super_secret_edumate_key"  # Keep this safe!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours for normal login
RESET_TOKEN_EXPIRE_MINUTES = 15     # 15 minutes to reset password

FRONTEND_DIST_DIR = PROJECT_DIR / "frontend" / "dist"
LEGACY_HTML_PATH = PROJECT_DIR / "index2.html"
UPLOADS_DIR = PROJECT_DIR / "uploads"