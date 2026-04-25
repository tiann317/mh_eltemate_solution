def test_incident_crud(client):
    # empty list
    assert client.get("/incidents").json() == []

    # create
    r = client.post("/incidents", json={"title": "Leaky bucket", "summary": "S3 public"})
    assert r.status_code == 201
    inc = r.json()
    assert inc["title"] == "Leaky bucket"
    inc_id = inc["id"]

    # get
    r = client.get(f"/incidents/{inc_id}")
    assert r.status_code == 200
    assert r.json()["summary"] == "S3 public"

    # patch
    r = client.patch(f"/incidents/{inc_id}", json={"risk_rating": "high"})
    assert r.status_code == 200
    assert r.json()["risk_rating"] == "high"

    # list has one
    assert len(client.get("/incidents").json()) == 1

    # delete
    assert client.delete(f"/incidents/{inc_id}").status_code == 204
    assert client.get(f"/incidents/{inc_id}").status_code == 404


def test_get_missing_returns_404(client):
    r = client.get("/incidents/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
