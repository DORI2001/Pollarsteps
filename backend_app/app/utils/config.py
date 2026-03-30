"""Configuration and environment utilities."""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def load_env_variable(
    name: str,
    default: str = "",
    required: bool = False,
    log_prefix_len: int = 12
) -> str:
    """
    Load environment variable with consistent error handling.
    
    Args:
        name: Environment variable name
        default: Default value if not found
        required: Whether the variable is required
        log_prefix_len: Length of prefix to show in logs
    
    Returns:
        Environment variable value or default
    
    Raises:
        ValueError: If required variable is not set
    """
    value = os.getenv(name, default)
    
    if required and not value:
        raise ValueError(f"Required environment variable '{name}' not set")
    
    if value:
        logger.info(f"{name} loaded: {value[:log_prefix_len]}...")
    else:
        logger.warning(f"Environment variable '{name}' not found, using default")
    
    return value


def load_from_env_file(
    file_path: str,
    key_name: str
) -> Optional[str]:
    """
    Load a specific key from .env file.
    
    Args:
        file_path: Path to .env file
        key_name: Key to search for
    
    Returns:
        Value if found, None otherwise
    """
    try:
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith(key_name + "=") and not line.startswith("#"):
                        value = line.split("=", 1)[1].strip()
                        if value:
                            return value
    except Exception as e:
        logger.warning(f"Could not read .env file: {e}")
    
    return None
