
import os
import secrets
import base64
from io import BytesIO
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal

import qrcode
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, get_db
from models import User, Event, Booking, Ticket, Notification


app = FastAPI(
    title="SmartEvent API",
    description="Event Discovery and Ticket Booking System",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

# For local development only. Configure a secure environment variable
# before deploying this application.
SECRET_KEY = os.getenv("SMARTEVENT_SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = "local-development-key-change-before-deployment"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

bearer_scheme = HTTPBearer(
    scheme_name="BearerAuth",
    description="Enter your JWT access token",
)


# ---------- COMMON SCHEMAS ----------

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class UserResponse(ORMModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime


class EventCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=10)
    category: Literal["Music", "Tech", "Sports", "Business"]
    location: str = Field(min_length=2, max_length=150)
    event_date: datetime
    ticket_price: float = Field(ge=0)
    total_tickets: int = Field(default=100, gt=0)
    banner_image: str | None = None


class EventResponse(ORMModel):
    id: int
    title: str
    description: str
    category: str
    location: str
    event_date: datetime
    ticket_price: float
    total_tickets: int
    banner_image: str | None
    created_at: datetime


class BookingCreate(BaseModel):
    event_id: int = Field(gt=0)
    ticket_quantity: int = Field(gt=0, le=10)


class BookingResponse(ORMModel):
    id: int
    user_id: int
    event_id: int
    ticket_quantity: int
    total_price: float
    booking_status: Literal["PENDING", "CONFIRMED", "CANCELLED"]
    created_at: datetime


class TicketResponse(ORMModel):
    id: int
    booking_id: int
    ticket_code: str
    qr_code_url: str
    created_at: datetime


class NotificationResponse(ORMModel):
    id: int
    user_id: int
    title: str
    message: str
    type: Literal["EVENT", "BOOKING", "SYSTEM"]
    is_read: bool
    created_at: datetime


# ---------- AUTHENTICATION ----------

def create_access_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(
        {"sub": str(user_id), "exp": expires},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials, Depends(bearer_scheme)
    ],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = int(payload["sub"])
    except (JWTError, ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
Database = Annotated[Session, Depends(get_db)]


@app.get("/")
def home():
    return {"message": "Welcome to SmartEvent API", "status": "running"}


@app.get("/health")
def health_check(db: Database):
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")


@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register(user: UserRegister, db: Database):
    email = user.email.lower()
    username = user.username.strip()

    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    if db.query(User).filter(func.lower(User.username) == username.lower()).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    new_user = User(
        username=username,
        email=email,
        hashed_password=pwd_context.hash(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/auth/login")
def login(credentials: UserLogin, db: Database):
    user = db.query(User).filter(
        func.lower(User.email) == credentials.email.lower()
    ).first()

    if user is None or not pwd_context.verify(
        credentials.password, user.hashed_password
    ):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@app.get("/auth/me", response_model=UserResponse)
def get_profile(current_user: CurrentUser):
    return current_user


# ---------- EVENTS ----------

@app.post("/events", response_model=EventResponse, status_code=201)
def create_event(event: EventCreate, db: Database):
    new_event = Event(**event.model_dump())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@app.get("/events", response_model=list[EventResponse])
def get_events(
    db: Database,
    category: str | None = None,
    search: str | None = None,
):
    query = db.query(Event)

    if category:
        query = query.filter(func.lower(Event.category) == category.lower())

    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            Event.title.ilike(keyword) | Event.location.ilike(keyword)
        )

    return query.order_by(Event.event_date.asc()).all()


@app.get("/events/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Database):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# ---------- NOTIFICATION HELPER ----------

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: Literal["EVENT", "BOOKING", "SYSTEM"],
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False,
    )
    db.add(notification)
    return notification


# ---------- BOOKINGS ----------

@app.post("/bookings", response_model=BookingResponse, status_code=201)
def create_booking(
    booking: BookingCreate,
    current_user: CurrentUser,
    db: Database,
):
    event = db.query(Event).filter(Event.id == booking.event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.event_date <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="Bookings are closed for past events",
        )

    sold_count = (
        db.query(func.coalesce(func.sum(Booking.ticket_quantity), 0))
        .filter(
            Booking.event_id == event.id,
            Booking.booking_status == "CONFIRMED",
        )
        .scalar()
    )

    available = event.total_tickets - sold_count
    if booking.ticket_quantity > available:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available} ticket(s) available",
        )

    new_booking = Booking(
        user_id=current_user.id,
        event_id=event.id,
        ticket_quantity=booking.ticket_quantity,
        total_price=round(event.ticket_price * booking.ticket_quantity, 2),
        booking_status="CONFIRMED",
    )
    db.add(new_booking)
    db.flush()

    create_notification(
        db,
        current_user.id,
        "Booking Confirmed",
        f"Your booking #{new_booking.id} for {event.title} is confirmed.",
        "BOOKING",
    )

    db.commit()
    db.refresh(new_booking)
    return new_booking


@app.get("/bookings/my", response_model=list[BookingResponse])
def get_my_bookings(current_user: CurrentUser, db: Database):
    return (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@app.patch("/bookings/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    current_user: CurrentUser,
    db: Database,
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id,
    ).first()

    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.booking_status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    booking.booking_status = "CANCELLED"

    create_notification(
        db,
        current_user.id,
        "Booking Cancelled",
        f"Your booking #{booking.id} has been cancelled.",
        "BOOKING",
    )

    db.commit()
    db.refresh(booking)
    return booking


# ---------- TICKETS AND QR CODES ----------

def generate_qr_code(ticket_code: str) -> str:
    qr = qrcode.make(ticket_code)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


@app.post(
    "/tickets/generate/{booking_id}",
    response_model=list[TicketResponse],
    status_code=201,
)
def generate_tickets(
    booking_id: int,
    current_user: CurrentUser,
    db: Database,
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id,
    ).first()

    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.booking_status != "CONFIRMED":
        raise HTTPException(
            status_code=400,
            detail="Tickets can only be generated for confirmed bookings",
        )

    existing = db.query(Ticket).filter(
        Ticket.booking_id == booking_id
    ).all()

    if existing:
        return existing

    generated = []
    for _ in range(booking.ticket_quantity):
        ticket = Ticket(
            booking_id=booking.id,
            ticket_code=secrets.token_urlsafe(18),
            qr_code_url="",
        )
        ticket.qr_code_url = generate_qr_code(ticket.ticket_code)
        db.add(ticket)
        generated.append(ticket)

    db.commit()
    for ticket in generated:
        db.refresh(ticket)

    return generated


@app.get("/tickets/my", response_model=list[TicketResponse])
def get_my_tickets(current_user: CurrentUser, db: Database):
    return (
        db.query(Ticket)
        .join(Booking, Ticket.booking_id == Booking.id)
        .filter(Booking.user_id == current_user.id)
        .order_by(Ticket.created_at.desc())
        .all()
    )


# ---------- NOTIFICATIONS ----------

@app.get("/notifications/my", response_model=list[NotificationResponse])
def get_my_notifications(current_user: CurrentUser, db: Database):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@app.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_read(
    notification_id: int,
    current_user: CurrentUser,
    db: Database,
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification
