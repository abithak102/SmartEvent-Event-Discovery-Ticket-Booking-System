
from database import Base, engine
import models

Base.metadata.create_all(bind=engine)

print("SmartEvent database tables created successfully!")
print("Database file: smartevent.db")
