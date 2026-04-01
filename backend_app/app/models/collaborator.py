from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.db import Base


class CollaboratorRole(str, enum.Enum):
    viewer = "viewer"
    editor = "editor"


class TripCollaborator(Base):
    __tablename__ = "trip_collaborators"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(Enum(CollaboratorRole), nullable=False, default=CollaboratorRole.viewer)
    invited_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    trip = relationship("Trip", backref="collaborators")
    user = relationship("User")
