"""Error handling utilities for consistent API responses."""
from fastapi import HTTPException, status
from typing import Optional


class AppException(HTTPException):
    """Base application exception with consistent formatting."""
    
    def __init__(
        self,
        detail: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        headers: Optional[dict] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class NotFoundError(AppException):
    """Resource not found error."""
    
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            detail=f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND
        )


class ForbiddenError(AppException):
    """Forbidden/unauthorized access error."""
    
    def __init__(self, detail: str = "Access forbidden"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_403_FORBIDDEN
        )


class ValidationError(AppException):
    """Validation error."""
    
    def __init__(self, detail: str):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


def check_ownership(
    resource_user_id: str,
    current_user_id: str,
    resource_name: str = "Resource"
) -> None:
    """
    Verify that current user owns the resource.
    
    Args:
        resource_user_id: User ID of resource owner
        current_user_id: Current user's ID
        resource_name: Name of resource for error message
    
    Raises:
        ForbiddenError: If user doesn't own the resource
    """
    if str(resource_user_id) != str(current_user_id):
        raise ForbiddenError(f"You don't have permission to access this {resource_name}")
