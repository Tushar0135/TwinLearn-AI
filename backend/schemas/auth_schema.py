"""
schemas/auth_schema.py

Pydantic models (a.k.a. "schemas") that define the shape of request
bodies and response payloads for authentication endpoints.

These are DIFFERENT from the SQLAlchemy models in `models/` — Pydantic
schemas describe the JSON that goes over the wire (API layer), while
SQLAlchemy models describe database tables (persistence layer).
Keeping them separate is a core clean-architecture principle.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class StudentRegisterRequest(BaseModel):
    """Request body for POST /auth/register"""
    full_name: str = Field(..., min_length=2, max_length=100, example="Aarav Sharma")
    email: EmailStr = Field(..., example="aarav@example.com")
    password: str = Field(..., min_length=6, example="strongpassword123")


class StudentLoginRequest(BaseModel):
    """Request body for POST /auth/login"""
    email: EmailStr
    password: str


class StudentResponse(BaseModel):
    """Public-facing representation of a Student (never includes password)."""
    student_id: str
    full_name: str
    email: EmailStr
    created_at: datetime

    class Config:
        # Allows Pydantic to read data directly from SQLAlchemy ORM objects
        # (e.g. `StudentResponse.from_orm(student_db_object)`).
        from_attributes = True


class TokenResponse(BaseModel):
    """Response returned after a successful login/register — a JWT token."""
    access_token: str
    token_type: str = "bearer"
    student: StudentResponse

class RegisterResponse(BaseModel):
    """Response returned after registration when OTP is sent."""
    message: str
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    """Request body for OTP verification."""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ResendOTPRequest(BaseModel):
    """Request body for resending an OTP."""
    email: EmailStr
