from pydantic import BaseModel

class TranscribeRequest(BaseModel):
    file_path: str
