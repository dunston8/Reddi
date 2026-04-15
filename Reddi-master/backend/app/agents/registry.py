# app/agents/registry.py

from app.agents.samtalebilde_agent import create_samtalebilde_activity
from app.agents.oppgaver_agent import create_oppgaver_activity
from app.agents.video_agent import create_forklaringsvideo_activity

ACTIVITY_GENERATORS = {
    "Samtalebilde": create_samtalebilde_activity,
    "Oppgaver": create_oppgaver_activity,
    "Forklaringsvideo": create_forklaringsvideo_activity,
}
