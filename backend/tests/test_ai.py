from unittest.mock import patch


def test_assess_breach_calls_lda(client):
    fake = {"answer": "<p>ok</p>", "sources": [], "response_id": "r1"}
    with patch("app.routers.ai.assess_breach", return_value=fake) as m:
        r = client.post("/ai/assess-breach", json={"userMessage": "leak"})
    assert r.status_code == 200
    assert r.json() == fake
    m.assert_called_once_with("leak")


def test_assess_breach_propagates_error(client):
    with patch("app.routers.ai.assess_breach", side_effect=RuntimeError("nope")):
        r = client.post("/ai/assess-breach", json={"userMessage": "leak"})
    assert r.status_code == 502
