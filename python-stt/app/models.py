from enum import Enum
from pydantic import BaseModel

class PiiMode(str, Enum):
    turbo = "turbo"
    smart = "smart"

class TranscribeRequest(BaseModel):
    file_path: str
    mode: PiiMode = PiiMode.turbo