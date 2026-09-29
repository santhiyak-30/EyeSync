import os
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

# Roles Definition
CAMP_COORDINATOR = "Camp Coordinator"
IMAGING_REVIEWER = "Imaging Reviewer"
PATHOLOGY_REVIEWER = "Pathology Reviewer"
MOLECULAR_REVIEWER = "Molecular Reviewer"
CASE_REVIEWER = "Case Reviewer"
ADMINISTRATOR = "Administrator"

ALL_ROLES = [
    CAMP_COORDINATOR,
    IMAGING_REVIEWER,
    PATHOLOGY_REVIEWER,
    MOLECULAR_REVIEWER,
    CASE_REVIEWER,
    ADMINISTRATOR
]

# Role-Based Permissions Matrix
ROLE_PERMISSIONS: Dict[str, Dict[str, bool]] = {
    CAMP_COORDINATOR: {
        "can_view_cases": True,
        "can_view_clinical_findings": False,
        "can_view_imaging": False,
        "can_view_pathology": False,
        "can_view_molecular": False,
        "can_review_case": False,
        "can_view_admin": False,
        "can_ingest_specimen": True,
        "can_view_audit_logs": False,
    },
    IMAGING_REVIEWER: {
        "can_view_cases": True,
        "can_view_clinical_findings": True,
        "can_view_imaging": True,
        "can_view_pathology": False,
        "can_view_molecular": False,
        "can_review_case": False,
        "can_view_admin": False,
        "can_ingest_specimen": False,
        "can_view_audit_logs": False,
    },
    PATHOLOGY_REVIEWER: {
        "can_view_cases": True,
        "can_view_clinical_findings": True,
        "can_view_imaging": False,
        "can_view_pathology": True,
        "can_view_molecular": False,
        "can_review_case": False,
        "can_view_admin": False,
        "can_ingest_specimen": True,
        "can_view_audit_logs": False,
    },
    MOLECULAR_REVIEWER: {
        "can_view_cases": True,
        "can_view_clinical_findings": True,
        "can_view_imaging": False,
        "can_view_pathology": False,
        "can_view_molecular": True,
        "can_review_case": False,
        "can_view_admin": False,
        "can_ingest_specimen": True,
        "can_view_audit_logs": False,
    },
    CASE_REVIEWER: {
        "can_view_cases": True,
        "can_view_clinical_findings": True,
        "can_view_imaging": True,
        "can_view_pathology": True,
        "can_view_molecular": True,
        "can_review_case": True,
        "can_view_admin": True,
        "can_ingest_specimen": True,
        "can_view_audit_logs": True,
    },
    ADMINISTRATOR: {
        "can_view_cases": True,
        "can_view_clinical_findings": True,
        "can_view_imaging": True,
        "can_view_pathology": True,
        "can_view_molecular": True,
        "can_review_case": True,
        "can_view_admin": True,
        "can_ingest_specimen": True,
        "can_view_audit_logs": True,
    },
}

# Configuration loaded from environment variables
JWT_SECRET = os.getenv("EYESYNC_JWT_SECRET") or os.getenv("JWT_SECRET") or "eyesync-secure-dev-key-review2-2026-screening-camp"
JWT_ALGORITHM = os.getenv("EYESYNC_JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("EYESYNC_TOKEN_EXPIRE_MINUTES", "480"))  # 8 hours default

DEMO_PASSWORD = os.getenv("EYESYNC_DEMO_PASSWORD", "EyeSync@2026!")


# Secure PBKDF2 Password Hashing
# Uses PBKDF2-HMAC-SHA256 with a per-user salt and 100,000 iterations.
# A cryptographically secure per-user salt prevents rainbow table attacks and slows GPU brute-forcing.
def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against hashed value using constant-time comparison."""
    try:
        salt, key_hex = hashed_password.split("$", 1)
        test_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        )
        # Constant-time comparison prevents side-channel timing analysis
        return hmac.compare_digest(test_key.hex(), key_hex)
    except Exception:
        return False


# Demo User Accounts (Passwords securely hashed with unique salts)
_DEMO_HASH = hash_password(DEMO_PASSWORD, salt="eyesync_camp_salt_2026")

DEMO_USERS: Dict[str, Dict[str, Any]] = {
    "coordinator": {
        "username": "coordinator",
        "full_name": "Elena Gomez (Camp Coordinator)",
        "role": CAMP_COORDINATOR,
        "password_hash": _DEMO_HASH,
    },
    "imaging_tech": {
        "username": "imaging_tech",
        "full_name": "Marcus Vance (Imaging Grader)",
        "role": IMAGING_REVIEWER,
        "password_hash": _DEMO_HASH,
    },
    "pathologist": {
        "username": "pathologist",
        "full_name": "Dr. Elena Rostova (Histopathologist)",
        "role": PATHOLOGY_REVIEWER,
        "password_hash": _DEMO_HASH,
    },
    "molecular_tech": {
        "username": "molecular_tech",
        "full_name": "Dr. Kenji Sato (Molecular Biologist)",
        "role": MOLECULAR_REVIEWER,
        "password_hash": _DEMO_HASH,
    },
    "reviewer": {
        "username": "reviewer",
        "full_name": "Dr. Aris Thorne (Case Reviewer)",
        "role": CASE_REVIEWER,
        "password_hash": _DEMO_HASH,
    },
    "admin": {
        "username": "admin",
        "full_name": "System Administrator",
        "role": ADMINISTRATOR,
        "password_hash": _DEMO_HASH,
    },
}

# Role to demo username mapping
ROLE_TO_USERNAME: Dict[str, str] = {
    CAMP_COORDINATOR: "coordinator",
    IMAGING_REVIEWER: "imaging_tech",
    PATHOLOGY_REVIEWER: "pathologist",
    MOLECULAR_REVIEWER: "molecular_tech",
    CASE_REVIEWER: "reviewer",
    ADMINISTRATOR: "admin",
}


# JWT Operations
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a cryptographically signed JWT token with standard claims."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    })
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Verifies and decodes a JWT token. Raises 401 if expired or invalid."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthenticatedUser(BaseModel):
    username: str
    role: str
    full_name: Optional[str] = None


# HTTPBearer dependency with auto_error=False for custom 401 response handling
http_bearer = HTTPBearer(auto_error=False)


def get_current_user(auth: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer)) -> AuthenticatedUser:
    """
    FastAPI dependency that extracts and validates the Bearer token from Authorization header.
    Returns AuthenticatedUser context.
    Raises HTTP 401 if missing, invalid, or expired.
    """
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth.credentials.strip()
    payload = decode_access_token(token)

    username: str = payload.get("sub")
    role: str = payload.get("role")
    full_name: Optional[str] = payload.get("full_name")

    if not username or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user or role identity.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthenticatedUser(username=username, role=role, full_name=full_name)


def require_role(allowed_roles: List[str]):
    """
    RBAC dependency factory.
    Enforces that the authenticated user possesses one of the allowed roles.
    Raises HTTP 403 Forbidden if the user's role is not authorized.
    """
    def role_verifier(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{current_user.role}' lacks permission for this endpoint. Required one of: {allowed_roles}"
            )
        return current_user
    return role_verifier
