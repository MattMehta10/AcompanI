from typing import List, Dict
from fastmcp import FastMCP

mcp = FastMCP("Email")
_sent_emails: List[Dict[str, str]] = []
_draft_emails: List[Dict[str, str]] = []


def draft_email_fn(to: str, subject: str, body: str) -> str:
    """Save an email draft without sending it externally."""
    _draft_emails.append({"to": to, "subject": subject, "body": body})
    return f"Draft saved for {to} | Subject: '{subject}'"


def send_email_fn(to: str, subject: str, body: str) -> str:
    """Send an external email (high-risk action)."""
    _sent_emails.append({"to": to, "subject": subject, "body": body})
    return f"Email sent to {to} | Subject: '{subject}'"


mcp.tool(name="draft_email")(draft_email_fn)
mcp.tool(name="send_email")(send_email_fn)

if __name__ == "__main__":
    mcp.run()
