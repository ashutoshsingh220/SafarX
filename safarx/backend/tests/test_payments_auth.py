import pytest
from fastapi import HTTPException

from app.config import settings
from app.services.auth import get_current_user
from app.services.payments import confirm_payment, create_payment_order


@pytest.mark.asyncio
async def test_mock_payment_checkout_and_confirmation(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "USE_MOCK_PAYMENTS", True)

    order = await create_payment_order(1_512.0, "booking-123")
    payment_id = await confirm_payment(order.order_id, None, None)

    assert order.is_mock is True
    assert order.amount_paise == 151_200
    assert order.order_id.startswith("mock_order_")
    assert payment_id.startswith("mock_payment_")


@pytest.mark.asyncio
async def test_mock_auth_accepts_only_configured_development_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "USE_MOCK_AUTH", True)
    monkeypatch.setattr(settings, "MOCK_AUTH_TOKEN", "test-token")

    user = await get_current_user("Bearer test-token")

    assert user.user_id == "demo_user"
    with pytest.raises(HTTPException) as exception:
        await get_current_user("Bearer wrong-token")
    assert exception.value.status_code == 401
