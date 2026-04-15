from pydantic import BaseModel, Field
from typing import List, Literal, Union, Annotated, Optional

class Lesson(BaseModel):
    id: int
    title: str
    subject: Literal["Matte", "Naturfag"]
    grade: int
    duration: int
    template: Literal["Introduksjonsøkt", "Fag-dag", "Oppsummering"]
    description: str


class ActivityDraft(BaseModel):
    type: Literal["Samtalebilde", "Oppgaver", "Forklaringsvideo"]
    mode: Literal["Helklasse", "Grupper", "Individuelt"]
    duration: int


class BaseActivity(BaseModel):
    id: Optional[str] = None
    type: str
    mode: Literal["Helklasse", "Grupper", "Individuelt"]
    duration: int
    position: int

    selected_variant_index: int = 0



class BildeAsset(BaseModel):
    url: str
    prompt: str

class SamtalebildeContent(BaseModel):
    image: BildeAsset
    questions: List[str]

class SamtalebildeActivity(BaseActivity):
    type: Literal["Samtalebilde"]
    variants: List[SamtalebildeContent]


class ForklaringsvideoContent(BaseModel):
    video_url: str

class ForklaringsvideoActivity(BaseActivity):
    type: Literal["Forklaringsvideo"]
    variants: List[ForklaringsvideoContent]




class Oppgave(BaseModel):
    question: str
    difficulty: Literal["Lett", "Middels", "Vanskelig"]
    answer: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None

class OppgaverContent(BaseModel):
    tasks: List[Oppgave]  

class OppgaverActivity(BaseActivity):
    type: Literal["Oppgaver"]
    variants: List[OppgaverContent]



Activity = Annotated[
    Union[
        SamtalebildeActivity,
        ForklaringsvideoActivity,
        OppgaverActivity
    ],
    Field(discriminator="type")
]


class ActivityDB(BaseModel):
    id: Optional[str]
    lesson_id: str
    type: str
    mode: str
    duration: int
    position: int
    variants: list[dict]
    selected_variant_index: int



class SnippetSource(BaseModel):
    document_id: int
    subject: str


class LessonRequest(BaseModel):
    lesson: Lesson
    activities: List[Activity]
