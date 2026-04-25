"""Local, deterministic breach-assessment stub.

No external API calls. Returns the same JSON schema the frontend expects so
the app runs fully offline. Replace `assess_breach` with a real model call
if/when you want one.
"""


def assess_breach(user_message: str) -> dict:
    text = (user_message or "").lower()

    if any(k in text for k in ("health", "medical", "biometric", "ssn", "passport")):
        rating = "critical"
    elif any(k in text for k in ("password", "credential", "financial", "card")):
        rating = "high"
    elif any(k in text for k in ("email", "name", "address", "phone")):
        rating = "medium"
    else:
        rating = "low"

    return {
        "risk_assessment": (
            "Local assessment based on submitted description. Considered scope of "
            "personal data, likelihood of harm, and Art.32/Art.33 GDPR obligations. "
            "Replace this stub with a real model call to refine."
        ),
        "risk_rating": rating,
        "key_gaps": [
            "Confirm categories of data subjects affected",
            "Confirm whether Art.9 special category data is involved",
        ],
        "notification_draft": (
            "To the competent supervisory authority,\n\n"
            "Pursuant to Art.33 GDPR we hereby notify a personal data breach. "
            "Details of the incident as currently known are described below. "
            "We will provide further information without undue delay as the "
            "investigation progresses.\n\n"
            f"Incident description: {user_message}\n"
        ),
        "internal_alert": (
            "Personal data breach detected. Containment underway. "
            "Art.33 72h clock has started. Legal + Security on point. "
            "Awaiting confirmation of affected data categories and subject count."
        ),
        "lawyer_handoff": (
            "Incident summary attached. Frameworks in scope: GDPR (Art.33/34). "
            "Open items: confirm Art.9 data, finalise subject count, decide "
            "Art.34 individual notification trigger. Privilege: treat all "
            "internal comms as legally privileged work product."
        ),
        "recommended_actions": [
            {
                "action": "Isolate affected systems and preserve forensic evidence",
                "legal_basis": "GDPR Art.32(1)(b)",
                "rationale": "Restore confidentiality and integrity of processing",
            },
            {
                "action": "Rotate credentials and revoke active sessions",
                "legal_basis": "GDPR Art.32(1)(b)",
                "rationale": "Prevent ongoing unauthorised access",
            },
        ],
        "security_playbook": [
            {
                "measure": "Enable MFA on all administrative accounts",
                "legal_basis": "GDPR Art.32(1)(b)",
                "priority": "P0",
                "rationale": "Mitigates credential-based intrusion vectors",
            },
            {
                "measure": "Review and tighten access logs / alerting",
                "legal_basis": "GDPR Art.30, Art.32",
                "priority": "P1",
                "rationale": "Required for accountability and detection",
            },
        ],
        "lawyer_packet": {
            "incident_summary": user_message[:200],
            "frameworks_triggered": ["GDPR"],
            "active_deadlines": [
                {"framework": "GDPR Art.33", "deadline": "72h from discovery", "status": "running"}
            ],
            "decisions_needed": ["Confirm Art.34 individual notification trigger"],
            "privilege_note": "Treat internal incident comms as privileged work product.",
            "open_questions": ["How many data subjects are affected?"],
        },
    }
