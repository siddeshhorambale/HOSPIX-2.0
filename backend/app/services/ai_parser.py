import re
import json
from datetime import datetime, timedelta, date
from typing import Dict, Any, List
from app.config import settings

def deterministic_fallback_parse(prompt: str) -> Dict[str, Any]:
    text = prompt.lower()
    
    # 1. Extract Items & Quantities
    # Patterns like "200 chairs", "20 tables", "15 chafing dishes"
    items: List[Dict[str, Any]] = []
    
    # Recognized resource types
    resource_patterns = [
        (r'(\d+)\s*(?:banquet\s*)?(?:dining\s*)?(chairs?|chair)', 'chairs'),
        (r'(\d+)\s*(?:dining\s*)?(?:round\s*)?(?:cocktail\s*)?(tables?|table)', 'tables'),
        (r'(\d+)\s*(?:sofas?|sofa)', 'sofas'),
        (r'(\d+)\s*(?:stools?|stool)', 'stools'),
        (r'(\d+)\s*(?:chafing\s*dishes?|chafing|food\s*warmers?)', 'chafing dishes'),
        (r'(\d+)\s*(?:plates?|dinner\s*plates?)', 'plates'),
        (r'(\d+)\s*(?:glasses?|glass)', 'glasses'),
        (r'(\d+)\s*(?:cutlery|spoons?|forks?)', 'cutlery'),
        (r'(\d+)\s*(?:tablecloths?|table\s*cloths?)', 'tablecloths'),
        (r'(\d+)\s*(?:chair\s*covers?)', 'chair covers'),
        (r'(\d+)\s*(?:tents?|shamiana)', 'tents'),
        (r'(\d+)\s*(?:lights?|lighting|led\s*lights?)', 'lighting'),
        (r'(\d+)\s*(?:speakers?|sound\s*system)', 'speakers'),
        (r'(\d+)\s*(?:projectors?)', 'projectors'),
    ]

    matched_types = set()
    for pattern, r_type in resource_patterns:
        match = re.search(pattern, text)
        if match and r_type not in matched_types:
            qty = int(match.group(1))
            items.append({"resource_type": r_type, "quantity": qty})
            matched_types.add(r_type)

    # Fallback if no items matched
    if not items:
        # Default fallback
        items = [{"resource_type": "chairs", "quantity": 100}]

    # 2. Extract Location
    cities = ["thane", "mulund", "bhiwandi", "navi mumbai", "mumbai central", "andheri", "vashi", "mumbai"]
    city_found = "Thane"
    for c in cities:
        if c in text:
            city_found = c.title()
            break
    
    # 3. Extract Date
    # Today / tomorrow / dates
    today = datetime.now()
    event_date = today + timedelta(days=1)  # Default tomorrow
    if "today" in text:
        event_date = today
    elif "tomorrow" in text:
        event_date = today + timedelta(days=1)
    elif "day after tomorrow" in text:
        event_date = today + timedelta(days=2)
    else:
        # Check for YYYY-MM-DD or DD-MM-YYYY
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', prompt)
        if date_match:
            try:
                event_date = datetime.strptime(date_match.group(1), "%Y-%m-%d")
            except Exception:
                pass

    date_str = event_date.strftime("%Y-%m-%d")

    # 4. Extract Times
    start_time = "17:00"
    end_time = "23:00"
    if "morning" in text:
        start_time = "09:00"
        end_time = "14:00"
    elif "afternoon" in text:
        start_time = "12:00"
        end_time = "17:00"

    # 5. Extract Budget
    budget = 15000.0
    budget_match = re.search(r'(?:budget|cost|price|max|under|approx|rs\.?|inr|₹)\s*:?\s*(\d+[\d,]*\d*)', text)
    if budget_match:
        try:
            cleaned_num = budget_match.group(1).replace(",", "")
            budget = float(cleaned_num)
        except Exception:
            pass

    # 6. Delivery
    delivery_required = True
    if "no delivery" in text or "pickup" in text or "self pickup" in text:
        delivery_required = False

    # 7. Event Type
    event_type = "event"
    for et in ["wedding", "conference", "party", "banquet", "reception", "meeting", "exhibition"]:
        if et in text:
            event_type = et
            break

    return {
        "items": items,
        "location": {"city": city_found},
        "date": date_str,
        "start_time": start_time,
        "end_time": end_time,
        "budget": budget,
        "delivery_required": delivery_required,
        "event_type": event_type,
    }

async def parse_requirement_prompt(prompt: str) -> Dict[str, Any]:
    if not settings.GEMINI_API_KEY:
        return deterministic_fallback_parse(prompt)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        system_instruction = (
            "You are the HOSPIX B2B Requirement Parser. Convert the hospitality resource request into pure JSON.\n"
            "Return EXACTLY this JSON format with no extra text or markdown formatting:\n"
            "{\n"
            '  "items": [{"resource_type": "chairs", "quantity": 200}, {"resource_type": "tables", "quantity": 20}],\n'
            '  "location": {"city": "Thane"},\n'
            '  "date": "2026-09-23",\n'
            '  "start_time": "17:00",\n'
            '  "end_time": "23:00",\n'
            '  "budget": 15000,\n'
            '  "delivery_required": true,\n'
            '  "event_type": "wedding"\n'
            "}"
        )

        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1,
                response_mime_type="application/json"
            )
        )
        
        parsed = json.loads(response.text)
        return parsed
    except Exception as e:
        # Fallback deterministically on any failure
        return deterministic_fallback_parse(prompt)
