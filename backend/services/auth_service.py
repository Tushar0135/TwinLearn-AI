"""
services/auth_service.py

Business logic for student authentication:
- Password hashing / verification
- JWT access-token creation and decoding
- Registration with email OTP verification
- Login
- Current-student authentication
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from database.db import get_db
from models.student import Student
from services.otp_service import generate_otp, send_otp_email
from utils.logger import get_logger

logger = get_logger(__name__)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

security = HTTPBearer()


def hash_password(plain_password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(plain_password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """Verify a password against its bcrypt hash."""
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_access_token(data: dict) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def register_student(
    db: Session,
    full_name: str,
    email: str,
    password: str
) -> Student:
    """
    Register a student and send a real OTP
    to their email address.
    """

    existing = (
        db.query(Student)
        .filter(Student.email == email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered."
        )

    # Create student
    student = Student(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        email_verified=False
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    # Generate 6-digit OTP
    otp = generate_otp()

    # OTP valid for 10 minutes
    student.otp_code = otp
    student.otp_expires_at = (
        datetime.utcnow() + timedelta(minutes=10)
    )

    db.commit()
    db.refresh(student)

    # Send actual OTP email
    try:
        send_otp_email(
            student.email,
            otp
        )
    except Exception as exc:
        logger.exception(
            "Failed to send OTP email to %s",
            student.email
        )

        # Remove the account if email sending fails
        db.delete(student)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Could not send verification email."
        )

    logger.info(
        "New student registered and OTP sent: %s",
        student.email
    )

    return student


def authenticate_student(
    db: Session,
    email: str,
    password: str
) -> Student:
    """
    Verify email/password and ensure email
    verification has been completed.
    """

    student = (
        db.query(Student)
        .filter(Student.email == email)
        .first()
    )

    if not student or not verify_password(
        password,
        student.hashed_password
    ):
        logger.warning(
            "Login failed for email: %s",
            email
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # OTP verification check
    if not student.email_verified:
        logger.warning(
            "Login blocked. Email not verified: %s",
            email
        )
        raise HTTPException(
            status_code=403,
            detail="Email is not verified. Please verify the OTP sent to your email."
        )

    logger.info(
        "Student logged in: %s (%s)",
        student.email,
        student.student_id
    )

    return student


def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Student:
    """
    Decode JWT and return the authenticated student.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print("DEBUG - JWT payload:", payload)

        student_id: Optional[str] = payload.get("sub")

        print("DEBUG - student_id from token:", student_id)

        if student_id is None:
            print("DEBUG - JWT does not contain sub")
            raise credentials_exception

    except JWTError as exc:
        print("DEBUG - JWT decode error:", repr(exc))
        raise credentials_exception

    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    print("DEBUG - student found:", student)

    if student is None:
        print("DEBUG - Student ID does not exist in database")
        raise credentials_exception

    return student

def resend_otp(
    db: Session,
    email: str
) -> Student:
    """
    Generate and send a new OTP for email verification.
    """

    student = (
        db.query(Student)
        .filter(Student.email == email)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student account not found."
        )

    if student.email_verified:
        raise HTTPException(
            status_code=400,
            detail="Email is already verified."
        )

    # Generate new OTP
    otp = generate_otp()

    student.otp_code = otp
    student.otp_expires_at = (
        datetime.utcnow() + timedelta(minutes=10)
    )

    db.commit()
    db.refresh(student)

    # Send OTP email again
    send_otp_email(
        student.email,
        otp
    )

    logger.info(
        "OTP resent successfully: %s",
        student.email
    )

    return student