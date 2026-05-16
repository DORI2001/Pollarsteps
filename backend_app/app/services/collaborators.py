from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.trip import Trip
from app.models.user import User
from app.models.collaborator import TripCollaborator, CollaboratorRole
from app.utils.errors import NotFoundError, ForbiddenError, AppException


class CollaboratorRecord:
    def __init__(self, id, user_id, username, role):
        self.id = id
        self.user_id = user_id
        self.username = username
        self.role = role


async def invite_collaborator(
    trip_id: str, owner_id: str, username: str, role: CollaboratorRole, session: AsyncSession
) -> CollaboratorRecord:
    trip_result = await session.execute(select(Trip).where(Trip.id == trip_id))
    trip = trip_result.scalar_one_or_none()
    if not trip:
        raise NotFoundError("Trip")
    if trip.user_id != owner_id:
        raise ForbiddenError("Only the trip owner can invite collaborators")

    user_result = await session.execute(select(User).where(User.username == username))
    invited_user = user_result.scalar_one_or_none()
    if not invited_user:
        raise NotFoundError(f"User '{username}'")
    if invited_user.id == owner_id:
        raise AppException(detail="Cannot invite yourself")

    existing = await session.execute(
        select(TripCollaborator).where(
            TripCollaborator.trip_id == trip_id,
            TripCollaborator.user_id == invited_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise AppException(detail="User is already a collaborator", status_code=409)

    collab = TripCollaborator(trip_id=trip_id, user_id=invited_user.id, role=role)
    session.add(collab)
    await session.commit()
    await session.refresh(collab)
    return CollaboratorRecord(id=collab.id, user_id=invited_user.id, username=invited_user.username, role=collab.role)


async def list_collaborators(trip_id: str, owner_id: str, session: AsyncSession) -> list:
    trip_result = await session.execute(select(Trip).where(Trip.id == trip_id))
    trip = trip_result.scalar_one_or_none()
    if not trip:
        raise NotFoundError("Trip")
    if trip.user_id != owner_id:
        raise ForbiddenError()

    result = await session.execute(
        select(TripCollaborator, User)
        .join(User, TripCollaborator.user_id == User.id)
        .where(TripCollaborator.trip_id == trip_id)
    )
    return [CollaboratorRecord(id=c.id, user_id=c.user_id, username=u.username, role=c.role) for c, u in result.all()]


async def remove_collaborator(trip_id: str, owner_id: str, user_id: str, session: AsyncSession) -> None:
    trip_result = await session.execute(select(Trip).where(Trip.id == trip_id))
    trip = trip_result.scalar_one_or_none()
    if not trip:
        raise NotFoundError("Trip")
    if trip.user_id != owner_id:
        raise ForbiddenError("Only the trip owner can remove collaborators")

    result = await session.execute(
        select(TripCollaborator).where(
            TripCollaborator.trip_id == trip_id,
            TripCollaborator.user_id == user_id,
        )
    )
    collab = result.scalar_one_or_none()
    if not collab:
        raise NotFoundError("Collaborator")
    await session.delete(collab)
    await session.commit()
