import random

async def process_payment(amount: float, user_id: str, journey_id: str) -> dict:
    """
    Mock payment gateway with an 80% success rate.
    """
    success = random.random() < 0.8
    if success:
        return {
            "status": "success",
            "transaction_id": f"txn_{random.randint(10000, 99999)}",
            "amount_paid": amount
        }
    else:
        return {
            "status": "failed",
            "reason": "Payment gateway timeout or card declined",
            "amount_attempted": amount
        }
