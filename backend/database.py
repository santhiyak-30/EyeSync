from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Resolve SQLite database path relative to backend folder
BASE_DIR = Path(__file__).resolve().parent
DB_FILE = BASE_DIR / "eyesync.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for obtaining database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
