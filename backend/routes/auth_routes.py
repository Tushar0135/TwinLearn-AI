"""
routes/auth_routes.py

HTTP endpoints for student registration and login.

These routes are intentionally "thin" — they only handle HTTP concerns
(request/response shapes, status codes) and delegate all real logic to
`services/auth_service.py`.
"""

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from models.student import Student
from sqlalchemy.orm import Session

from database.db import get_db

from schemas.auth_schema import (
StudentRegisterRequest,
StudentLoginRequest,
TokenResponse,
RegisterResponse,
VerifyOTPRequest,
ResendOTPRequest,
)

from services.auth_service import (
    register_student,
    authenticate_student,
    create_access_token,
    resend_otp
)
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=RegisterResponse,
    summary="Register a new student and send OTP",
    status_code=201,
)
def register(
    payload: StudentRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registers a student and sends an OTP to their email.

    The account must be verified using /auth/verify-otp
    before the student can log in.
    """

    student = register_student(
        db,
        payload.full_name,
        payload.email,
        payload.password,
    )

    return RegisterResponse(
        message="Registration successful. OTP sent to your email.",
        email=student.email,
    )

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in with email and password",
)
def login(payload: StudentLoginRequest, db: Session = Depends(get_db)):
    """
    Verifies student credentials and returns a JWT access token.
    The frontend should send this token as:
        Authorization: Bearer <access_token>
    on every subsequent request to protected endpoints (/upload, /history).
    """
    student = authenticate_student(db, payload.email, payload.password)
    token = create_access_token({"sub": student.student_id})
    return TokenResponse(access_token=token, student=student)

@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    summary="Verify email using OTP",
)
def verify_otp(
    payload: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    """
    Verifies the OTP sent to the student's email.

    If the OTP is correct and has not expired,
    the student's email is marked as verified and
    a JWT access token is returned.
    """

    student = (
        db.query(Student)
        .filter(Student.email == payload.email)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student account not found.",
        )

    if student.email_verified:
        raise HTTPException(
            status_code=400,
            detail="Email is already verified.",
        )

    if not student.otp_code:
        raise HTTPException(
            status_code=400,
            detail="No OTP found. Please request a new OTP.",
        )

    if not student.otp_expires_at:
        raise HTTPException(
            status_code=400,
            detail="OTP expiry information is missing.",
        )

    if datetime.utcnow() > student.otp_expires_at:
        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Please request a new OTP.",
        )

    if payload.otp != student.otp_code:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP.",
        )

    student.email_verified = True
    student.otp_code = None
    student.otp_expires_at = None

    db.commit()
    db.refresh(student)

    token = create_access_token(
        {"sub": student.student_id}
    )

    logger.info(
        "Email verified successfully: %s",
        student.email,
    )

    return TokenResponse(
        access_token=token,
        student=student,
    )

@router.post(
    "/resend-otp",
    response_model=RegisterResponse,
    summary="Resend OTP email"
)
def resend_otp_route(
    payload: ResendOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Sends a new OTP to the student's email.
    """

    student = resend_otp(
        db,
        payload.email
    )

    return RegisterResponse(
        message="New OTP sent successfully.",
        email=student.email
    )
