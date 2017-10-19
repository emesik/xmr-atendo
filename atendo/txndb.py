from sqlalchemy import Column, Integer, DateTime, Numeric, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Txn(Base):
    __tablename__ = 'txn'
    id = Column(Integer, primary_key=True)
    queried = Column(DateTime(timezone=False), nullable=False, index=True)
    received = Column(DateTime(timezone=False), nullable=False, index=True)
    fee = Column(Numeric(precision=12), nullable=False)
    size = Column(Integer, nullable=False)
    inputs = Column(Integer, nullable=False)
    outputs = Column(Integer, nullable=False)
    ring = Column(Integer, nullable=False)
    version = Column(Integer, nullable=False)
    hash_id = Column(String(64), nullable=False)


def create_tables(url):
    engine = create_engine(url)
    Base.metadata.create_all(engine)


def mksession(url):
    engine = create_engine(url)
    Base.metadata.bind = engine
    DBSession = sessionmaker(bind=engine)
    return DBSession()
