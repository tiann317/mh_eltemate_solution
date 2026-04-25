from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import item as crud_item
from app.db.session import get_db
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=list[ItemRead])
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return crud_item.list_items(db, skip=skip, limit=limit)


@router.post("", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, db: Session = Depends(get_db)):
    return crud_item.create_item(db, payload)


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = crud_item.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(item_id: int, payload: ItemUpdate, db: Session = Depends(get_db)):
    item = crud_item.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return crud_item.update_item(db, item, payload)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = crud_item.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    crud_item.delete_item(db, item)
    return None
