import os
import random
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def generate_otp():
    """Generate a random 6-digit OTP."""
    return str(random.randint(100000, 999999))


def send_otp_email(receiver_email: str, otp: str):
    """Send the generated OTP to the user's email."""

    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise ValueError("SMTP_EMAIL or SMTP_PASSWORD is missing in .env")

    message = EmailMessage()

    message["Subject"] = "LearnTwin AI Professor - Email Verification OTP"
    message["From"] = SMTP_EMAIL
    message["To"] = receiver_email

    message.set_content(
        f"""
Hello,

Your OTP for LearnTwin AI Professor email verification is:

{otp}

This OTP is valid for 10 minutes.

If you did not request this OTP, please ignore this email.

Regards,
LearnTwin AI Professor
"""
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
        smtp.send_message(message)