import re
from pydantic import BaseModel, EmailStr, field_validator

_PASSWORD_MIN = 8
_PASSWORD_RE = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$')


def _check_password(v: str) -> str:
    if len(v) < _PASSWORD_MIN:
        raise ValueError(f'Password must be at least {_PASSWORD_MIN} characters')
    if len(v) > 72:
        raise ValueError('Password must be 72 characters or less (bcrypt limit)')
    if not _PASSWORD_RE.match(v):
        raise ValueError('Password must contain at least one uppercase letter, one lowercase letter, and one digit')
    return v


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

    @field_validator('password')
    def validate_password(cls, v):
        return _check_password(v)


class LoginRequest(BaseModel):
    email_or_username: str
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator('new_password')
    def validate_new_password(cls, v):
        return _check_password(v)
