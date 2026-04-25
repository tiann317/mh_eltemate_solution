def test_audit_log_flow(client):
    inc = client.post("/incidents", json={"title": "x"}).json()
    inc_id = inc["id"]

    r = client.post("/audit-logs", json={"incident_id": inc_id, "message": "hello"})
    assert r.status_code in (200, 201)

    logs = client.get(f"/audit-logs?incident_id={inc_id}").json()
    assert len(logs) == 1
    assert logs[0]["message"] == "hello"
