from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.user import User, Business, UserRole
from app.models.resource import Resource, ResourceCategory, ResourceStatus, AvailabilityStatus
from app.services.auth_service import hash_password

router = APIRouter(prefix="/seed", tags=["Database Seeding"])

SEED_DATA = [
    {
        "email": "provider1@royalbanquets.com",
        "name": "Rajesh Sharma",
        "business_name": "Royal Banquets",
        "business_type": "hotel",
        "city": "Thane",
        "address": "Ghodbunder Road, Thane West",
        "pan_number": "ROYAL1234B",
        "latitude": 19.2183,
        "longitude": 72.9781,
        "trust_score": 95.0,
        "resources": [
            {
                "name": "Banquet Dining Chairs",
                "category": ResourceCategory.FURNITURE.value,
                "description": "Standard padded gold/maroon banquet chairs, stackable and sturdy.",
                "total_quantity": 100,
                "available_quantity": 100,
                "price": 30.0,
                "price_unit": "per_day",
                "condition": "Excellent",
                "delivery_available": True,
                "delivery_charge": 500.0,
            },
            {
                "name": "Round Dining Tables (6-seater)",
                "category": ResourceCategory.FURNITURE.value,
                "description": "Heavy-duty 5ft round wooden banquet tables.",
                "total_quantity": 10,
                "available_quantity": 10,
                "price": 200.0,
                "price_unit": "per_day",
                "condition": "Excellent",
                "delivery_available": True,
                "delivery_charge": 600.0,
            },
            {
                "name": "Stainless Steel Chafing Dishes",
                "category": ResourceCategory.HOSPITALITY_EQUIPMENT.value,
                "description": "Roll-top buffet chafing dishes with dual fuel burners.",
                "total_quantity": 15,
                "available_quantity": 15,
                "price": 180.0,
                "price_unit": "per_day",
                "condition": "Excellent",
                "delivery_available": True,
                "delivery_charge": 300.0,
            }
        ]
    },
    {
        "email": "provider2@eventease.com",
        "name": "Karan Mehra",
        "business_name": "EventEase Rentals",
        "business_type": "rental",
        "city": "Mulund",
        "address": "LBS Marg, Mulund West",
        "pan_number": "EVENT1234E",
        "latitude": 19.1726,
        "longitude": 72.9565,
        "trust_score": 90.0,
        "resources": [
            {
                "name": "Chiavari Event Chairs",
                "category": ResourceCategory.FURNITURE.value,
                "description": "White resin Chiavari chairs with soft cushions.",
                "total_quantity": 80,
                "available_quantity": 80,
                "price": 28.0,
                "price_unit": "per_day",
                "condition": "Good",
                "delivery_available": True,
                "delivery_charge": 450.0,
            },
            {
                "name": "Rectangular Buffet Tables",
                "category": ResourceCategory.FURNITURE.value,
                "description": "6ft foldable steel-frame buffet display tables.",
                "total_quantity": 10,
                "available_quantity": 10,
                "price": 220.0,
                "price_unit": "per_day",
                "condition": "Good",
                "delivery_available": True,
                "delivery_charge": 500.0,
            },
            {
                "name": "Satin White Tablecloths",
                "category": ResourceCategory.LINEN.value,
                "description": "Crisp pressed premium satin tablecloths for 5ft round tables.",
                "total_quantity": 40,
                "available_quantity": 40,
                "price": 45.0,
                "price_unit": "per_day",
                "condition": "Excellent",
                "delivery_available": True,
                "delivery_charge": 200.0,
            }
        ]
    },
    {
        "email": "provider3@partyhub.com",
        "name": "Sunil Varma",
        "business_name": "PartyHub Events",
        "business_type": "rental",
        "city": "Bhiwandi",
        "address": "Kalyan Road, Bhiwandi",
        "pan_number": "PARTY1234H",
        "latitude": 19.3002,
        "longitude": 73.0635,
        "trust_score": 88.0,
        "resources": [
            {
                "name": "Standard Folding Chairs",
                "category": ResourceCategory.FURNITURE.value,
                "description": "Durable metal frame padded folding event chairs.",
                "total_quantity": 50,
                "available_quantity": 50,
                "price": 25.0,
                "price_unit": "per_day",
                "condition": "Good",
                "delivery_available": True,
                "delivery_charge": 400.0,
            },
            {
                "name": "Square Cocktail Tables",
                "category": ResourceCategory.FURNITURE.value,
                "description": "High-top standing cocktail tables for welcome drinks.",
                "total_quantity": 5,
                "available_quantity": 5,
                "price": 200.0,
                "price_unit": "per_day",
                "condition": "Good",
                "delivery_available": True,
                "delivery_charge": 400.0,
            },
            {
                "name": "LED Par Event Lighting Kit",
                "category": ResourceCategory.EVENT_EQUIPMENT.value,
                "description": "RGB ambient stage & banquet mood lights with controller.",
                "total_quantity": 8,
                "available_quantity": 8,
                "price": 350.0,
                "price_unit": "per_day",
                "condition": "Good",
                "delivery_available": True,
                "delivery_charge": 300.0,
            }
        ]
    },
    {
        "email": "provider4@grandcaterers.com",
        "name": "Vikram Singhania",
        "business_name": "Grand Caterers",
        "business_type": "caterer",
        "city": "Navi Mumbai",
        "address": "Vashi Sector 17, Navi Mumbai",
        "pan_number": "GRAND1234C",
        "latitude": 19.0330,
        "longitude": 73.0297,
        "trust_score": 93.0,
        "resources": [
            {
                "name": "Premium Banquet Chairs",
                "category": ResourceCategory.FURNITURE.value,
                "description": "Ergonomic high-back cushioned chairs for luxury receptions.",
                "total_quantity": 150,
                "available_quantity": 150,
                "price": 35.0,
                "price_unit": "per_day",
                "condition": "Excellent",
                "delivery_available": True,
                "delivery_charge": 700.0,
            },
            {
                "name": "Round Dining Tables (8-seater)",
                "category": ResourceCategory.FURNITURE.value,
                "description": "Large round dining tables with wooden polish finish.",
                "total_quantity": 20,
                "available_quantity": 20,
                "price": 250.0,
                "price_unit": "per_day",
                "condition": "Excellent",
                "delivery_available": True,
                "delivery_charge": 800.0,
            },
            {
                "name": "Porcelain Dinner Plates (Set of 50)",
                "category": ResourceCategory.DINING.value,
                "description": "White porcelain microwave-safe fine dinner plates.",
                "total_quantity": 20,
                "available_quantity": 20,
                "price": 300.0,
                "price_unit": "per_day",
                "condition": "Excellent",
                "delivery_available": True,
                "delivery_charge": 300.0,
            }
        ]
    }
]

@router.post("")
async def seed_database(db: AsyncSession = Depends(get_db)):
    from app.database import init_db
    await init_db()
    created_businesses = []
    
    # 1. Seed Seeker business if not exists
    stmt_seeker = select(User).where(User.email == "seeker@apexevents.com")
    existing_seeker = (await db.execute(stmt_seeker)).scalar_one_or_none()
    if not existing_seeker:
        seeker_user = User(
            email="seeker@apexevents.com",
            hashed_password=hash_password("Password123!"),
            full_name="Ananya Desai",
            role=UserRole.SEEKER,
            phone="+91 98333 44556"
        )
        db.add(seeker_user)
        await db.flush()

        seeker_biz = Business(
            user_id=seeker_user.id,
            name="Apex Event Planners",
            business_type="event_planner",
            contact_person="Ananya Desai",
            phone="+91 98333 44556",
            address="Kopri, Thane East",
            city="Thane",
            pan_number="APEXE1234P",
            is_verified=True,
            latitude=19.1872,
            longitude=72.9664,
            trust_score=94.0
        )
        db.add(seeker_biz)
        await db.flush()
    else:
        stmt_sbiz = select(Business).where(Business.user_id == existing_seeker.id)
        sbiz = (await db.execute(stmt_sbiz)).scalar_one_or_none()
        if sbiz:
            sbiz.pan_number = "APEXE1234P"
            sbiz.is_verified = True
            await db.flush()

    # 2. Seed the 4 mandatory Mumbai/Thane providers
    for item in SEED_DATA:
        stmt_user = select(User).where(User.email == item["email"])
        user = (await db.execute(stmt_user)).scalar_one_or_none()
        
        if not user:
            user = User(
                email=item["email"],
                hashed_password=hash_password("Password123!"),
                full_name=item["name"],
                role=UserRole.PROVIDER,
                phone="+91 98200 " + str(10000 + len(created_businesses))
            )
            db.add(user)
            await db.flush()

            biz = Business(
                user_id=user.id,
                name=item["business_name"],
                business_type=item["business_type"],
                contact_person=item["name"],
                phone=user.phone,
                address=item["address"],
                city=item["city"],
                pan_number=item.get("pan_number", "ROYAL1234B"),
                is_verified=True,
                latitude=item["latitude"],
                longitude=item["longitude"],
                trust_score=item["trust_score"]
            )
            db.add(biz)
            await db.flush()
        else:
            stmt_biz = select(Business).where(Business.user_id == user.id)
            biz = (await db.execute(stmt_biz)).scalar_one()
            biz.pan_number = item.get("pan_number", "ROYAL1234B")
            biz.is_verified = True
            await db.flush()

        created_businesses.append(biz.name)

        # Seed resources for business or reset inventory for demo idempotency
        stmt_res = select(Resource).where(Resource.provider_id == biz.id)
        existing_res = (await db.execute(stmt_res)).scalars().all()
        if not existing_res:
            for r_data in item["resources"]:
                resource = Resource(
                    provider_id=biz.id,
                    name=r_data["name"],
                    category=r_data["category"],
                    description=r_data["description"],
                    total_quantity=r_data["total_quantity"],
                    available_quantity=r_data["total_quantity"],
                    price=r_data["price"],
                    price_unit=r_data.get("price_unit", "per_day"),
                    minimum_rental_period=1,
                    condition=r_data.get("condition", "Excellent"),
                    location=biz.city,
                    latitude=biz.latitude,
                    longitude=biz.longitude,
                    delivery_available=r_data["delivery_available"],
                    delivery_charge=r_data["delivery_charge"],
                    status=ResourceStatus.ACTIVE.value,
                    availability=AvailabilityStatus.AVAILABLE.value,
                    images=[]
                )
                db.add(resource)
            await db.flush()
        else:
            # Reset available quantities to total for demo
            for res in existing_res:
                res.available_quantity = res.total_quantity
                res.availability = AvailabilityStatus.AVAILABLE.value
            await db.flush()

    await db.commit()
    return {
        "success": True,
        "message": "Mandatory Mumbai/Thane businesses and resources seeded successfully",
        "seeded_providers": created_businesses,
        "seeker": "Apex Event Planners (Thane)"
    }
