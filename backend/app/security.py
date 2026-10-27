"""Secret masking for untrusted ticket text.

Ticket text is masked BEFORE it is stored and BEFORE it is sent to the AI, so
leaked passwords (e.g. "Maryam@1402") never reach the database or a third party.
"""
import re

MASK = "[REDACTED]"

_EMAIL = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$")
_URL = re.compile(r"^(https?://|www\.)", re.IGNORECASE)

# "password: xyz", "pwd=xyz", "رمز: xyz", "رمز عبور = xyz"
_KEYED = re.compile(
    r"(?P<key>\b(?:password|passwd|pwd|pass|secret|token|api[_-]?key)\b|رمز(?:\s*عبور)?|پسورد|گذرواژه)"
    r"(?P<sep>\s*[:=]\s*)(?P<val>\S+)",
    re.IGNORECASE,
)
# Common credential formats: OpenAI-style keys, bearer tokens, long hex/base64 blobs.
_TOKEN_PATTERNS = [
    re.compile(r"\bsk-[A-Za-z0-9_-]{16,}\b"),
    re.compile(r"\bBearer\s+[A-Za-z0-9._~+/-]{16,}=*", re.IGNORECASE),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b"),
]
_SPECIAL = set("@#$%^&*!?_+=~")


def _looks_like_password(token: str) -> bool:
    t = token.strip(".,;:()[]{}\"'«»،؛")
    if len(t) < 6 or len(t) > 64:
        return False
    if _EMAIL.match(t) or _URL.match(t) or any(c in '<>"\'()/\\' for c in t):
        return False
    has_letter = any(c.isascii() and c.isalpha() for c in t)
    has_digit = any(c.isdigit() for c in t)
    has_special = any(c in _SPECIAL for c in t)
    return has_letter and has_digit and has_special


def mask_secrets(text: str) -> str:
    if not text:
        return text
    out = _KEYED.sub(lambda m: f"{m.group('key')}{m.group('sep')}{MASK}", text)
    for pat in _TOKEN_PATTERNS:
        out = pat.sub(MASK, out)
    parts = re.split(r"(\s+)", out)
    return "".join(MASK if (not p.isspace() and p != MASK and _looks_like_password(p)) else p for p in parts)
