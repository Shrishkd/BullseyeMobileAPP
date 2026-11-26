# app/api/v1/chat.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import ChatRequest, ChatResponse
from app.services.llm_client import LLMClient
from app.api.deps import get_db, get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

llm_client = LLMClient()


@router.post("/query", response_model=ChatResponse)
async def chat_query(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Main AI chat endpoint for BullSeye (Gemini-backed).
    """

    question = payload.question

    system_prompt = (
        "You are Bullseye, an AI-powered investment and trading assistant. "
        "You help users understand markets, stocks, crypto, and portfolio risk. "
        "Fetch current stock price from internet. "
        "Provide general educational guidance. "
        "Do NOT give guaranteed financial advice or promises."
    )

    # Generate AI response via Gemini
    answer = llm_client.chat(
        system_prompt=system_prompt,
        user_message=f"User question:\n{question}",
    )

    return ChatResponse(
        answer=answer,
        sources=[],
    )
    
@router.post("/explain-indicators")
async def explain_indicators(
    payload: dict,
    user=Depends(get_current_user),
):
    """
    Explain technical indicators like RSI, SMA, EMA using AI.
    """
    symbol = payload.get("symbol")
    rsi = payload.get("rsi")
    sma = payload.get("sma")
    ema = payload.get("ema")
    price = payload.get("price")

    system_prompt = (
        "You are Bullseye, an AI-powered investment assistant. "
        "Explain technical indicators in a simple, educational way. "
        "Do not give direct buy/sell advice or guarantees."
        "Fetch current stock price from internet"
    )

    user_message = f"""
Asset: {symbol}

Current price: {price}
RSI: {rsi}
SMA: {sma}
EMA: {ema}

Explain:
1. What RSI indicates at this level
2. What SMA vs EMA relationship suggests
3. Overall market sentiment (bullish / bearish / neutral)
"""

    answer = llm_client.chat(
        system_prompt=system_prompt,
        user_message=user_message,
    )

    return {"explanation": answer}
