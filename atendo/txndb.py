from sqlalchemy import Column, Integer, DateTime, Numeric, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Txn(Base):
    __tablename__ = 'txn'
    hash_id = Column(String(64), nullable=False, primary_key=True)
    queried = Column(DateTime(timezone=False), nullable=False, index=True)
    received = Column(DateTime(timezone=False), nullable=False, index=True)
    fee = Column(Numeric(precision=24, scale=12), nullable=False)
    size = Column(Integer, nullable=False)
    inputs = Column(Integer, nullable=False)
    outputs = Column(Integer, nullable=False)
    ring = Column(Integer, nullable=False)
    version = Column(Integer, nullable=False)


class TxnStat(Base):
    __tablename__ = 'txnstat'
    queried = Column(DateTime(timezone=False), primary_key=True)
    txns = Column(Integer, nullable=False)
    sumfee = Column(Numeric(precision=24, scale=12), nullable=False)
    sumsize = Column(Integer, nullable=False)
    avgsize = Column(Integer, nullable=False)
    avgfee = Column(Numeric(precision=24, scale=12), nullable=True)
    avgfeeperkb = Column(Numeric(precision=24, scale=12), nullable=True)
    maxage = Column(Numeric(precision=16, scale=8), nullable=False)


def create_tables(url):
    engine = create_engine(url)
    Base.metadata.create_all(engine)


def mksession(url):
    engine = create_engine(url)
    Base.metadata.bind = engine
    DBSession = sessionmaker(bind=engine)
    return DBSession()
