"""Email service for sending registration confirmations and notifications"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import get_settings
import asyncio


async def send_welcome_email(user_email: str, user_name: str) -> bool:
    """
    Send a welcome email to the user after signup
    
    Args:
        user_email: User's email address
        user_name: User's name or username
        
    Returns:
        True if email sent successfully, False otherwise
    """
    try:
        settings = get_settings()
        
        if not settings.smtp_user or not settings.smtp_password:
            print("⚠️  Email configuration not set. Skipping email notification.")
            return False
        
        # Run email sending in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, 
            _send_email, 
            user_email, 
            user_name, 
            settings.smtp_host, 
            settings.smtp_port, 
            settings.smtp_user, 
            settings.smtp_password, 
            settings.smtp_from_email, 
            settings.smtp_from_name
        )
    except Exception as e:
        print(f"❌ Failed to send welcome email: {str(e)}")
        # Don't raise - let signup succeed even if email fails
        return False


def _send_email(
    user_email: str, 
    user_name: str, 
    smtp_host: str, 
    smtp_port: int, 
    smtp_user: str, 
    smtp_password: str, 
    smtp_from_email: str, 
    smtp_from_name: str
) -> bool:
    """
    Synchronous email sending function to run in thread executor
    """
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Welcome to Polarsteps! 🗺️"
        msg["From"] = f"{smtp_from_name} <{smtp_from_email}>"
        msg["To"] = user_email
        
        # HTML content with greeting
        html = f"""
        <html>
            <head></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #1D1D1D;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🗺️</div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Welcome to Polarsteps!</h1>
                    </div>
                    
                    <!-- Main Content -->
                    <div style="background: #F5F5F7; border-radius: 16px; padding: 30px; margin-bottom: 20px;">
                        <p style="margin-top: 0; font-size: 16px;">
                            Hello <strong>{user_name}</strong> 👋
                        </p>
                        
                        <p style="margin: 16px 0; font-size: 15px;">
                            Welcome to Polarsteps! We're thrilled to have you join our community of travel enthusiasts.
                        </p>
                        
                        <p style="margin: 16px 0; font-size: 15px;">
                            Your account has been successfully created with the email <strong>{user_email}</strong>. 
                            You can now start tracking your trips, pinning locations on your map, and sharing your travel stories.
                        </p>
                        
                        <p style="margin: 16px 0; font-size: 15px;">
                            <strong>What's next?</strong>
                        </p>
                        <ul style="margin: 10px 0; padding-left: 20px; font-size: 15px;">
                            <li>Create your first trip</li>
                            <li>Pin locations and add memories</li>
                            <li>Explore your travel journey</li>
                        </ul>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin-bottom: 20px;">
                        <a href="http://localhost:3000" style="display: inline-block; background: #007AFF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">
                            Start Your Journey
                        </a>
                    </div>
                    
                    <!-- Footer -->
                    <div style="border-top: 1px solid #E5E5EA; padding-top: 20px; text-align: center; font-size: 13px; color: #86868B;">
                        <p style="margin: 5px 0;">
                            Polarsteps - Track Your Travel Adventures
                        </p>
                        <p style="margin: 5px 0;">
                            © 2026. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Create text alternative
        text = f"""
        Hello {user_name},
        
        Welcome to Polarsteps! We're thrilled to have you join our community.
        
        Your account has been successfully created with the email {user_email}.
        You can now start tracking your trips and sharing your travel stories.
        
        Start your journey: http://localhost:3000
        
        ---
        Polarsteps - Track Your Travel Adventures
        © 2026. All rights reserved.
        """
        
        # Attach both plain text and HTML
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email via SMTP
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from_email, user_email, msg.as_string())
        
        print(f"✅ Welcome email sent to {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending email: {str(e)}")
        # Return False but don't raise - let the signup process continue
        return False
