import resend
from pydentic_config import settings

resend.api_key = settings.resend_api_key


def password_reset_email(email: str, reset_link: str):
    """Send a password reset email using the Resend service."""
    if not settings.resend_api_key:
        raise RuntimeError("Resend email service is not configured")

    return resend.Emails.send(
        {
            "from": settings.resend_from_email,
            "to": [email],
            "subject": "Reset your password",
            "html": (
                "<p>We received a password reset request.</p>"
                f"<p><a href='{reset_link}'>Reset your password</a></p>"
                "<p>This link expires in 15 minutes.</p>"
            ),
        }
    )
