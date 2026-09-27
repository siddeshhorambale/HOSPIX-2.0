import urllib.request
import json
import uuid

API_KEY = "nugen-fc518b23c82aee13"
headers = {"Authorization": f"Bearer {API_KEY}"}

domain_text = """HOSPIX DOMAIN SPECIFICATION: HOSPITALITY RESOURCE LOGISTICS & WEATHER DISRUPTION REASONING
HOSPIX is a B2B hospitality resource exchange connecting banquet venues, event planners, and suppliers across Mumbai, Thane, Mulund, and Navi Mumbai.

Weather Impact Operational Protocol:
1. Low Rain (0-15mm): Routine operation. Minor traffic delays of 10-20 minutes. Standard tarpaulin coverings required for linen and electronic audio rigs.
2. Moderate Rain (16-35mm): Increased transit delay (30-60 mins). High water damage risk for untreated banquet upholstery and dining tables. Single-provider fulfillment may face local vehicle gridlock; pooling from closer local hubs recommended.
3. Heavy Rain / Monsoonal Downpour (>35mm): Severe waterlogging along Ghodbunder Road and Western Express Highway. High delivery cancellation probability. Outdoor banquet setups require immediate contingency relocation to indoor halls. Pooled co-fulfillment across sub-5km radius providers required to meet event deadlines without double-booking.

Resource Preservation Protocols:
- Banquet Chairs & Tables: Plastic shrink-wrap required during transit if rainfall > 20mm.
- Chafing Dishes & Food Warmers: Electrical buffet warmers require dry sheltered power hubs.
- Fine Dinnerware & Glassware: Wet road vibrations increase transit breakage risk by 40%.
- Event Tents & Canopies: Wind speeds > 30 km/h require sandbag ballast reinforcement.

Multi-Provider Resource Pooling Strategy:
When primary provider is impaired by localized weather flooding or stock limits, HOSPIX algorithms partition demand into proximate clusters, routing items through suppliers within 4km radii with verified covered transport.
"""

# Upload document
boundary = uuid.uuid4().hex
parts = [
    f"--{boundary}".encode("utf-8"),
    b'Content-Disposition: form-data; name="files"; filename="hospix_weather_logistics_corpus.txt"',
    b"Content-Type: text/plain",
    b"",
    domain_text.encode("utf-8"),
    f"--{boundary}--".encode("utf-8"),
]
body = b"\r\n".join(parts)

req = urllib.request.Request(
    "https://api.nugen.in/api/v3/documents/create",
    data=body,
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    },
)

try:
    with urllib.request.urlopen(req) as resp:
        doc_res = json.loads(resp.read().decode())
        print("Document Upload Success:", doc_res)
        doc_id = doc_res.get("document_ids", [None])[0]
        print("Uploaded Doc ID:", doc_id)
except Exception as e:
    print("Doc upload notice:", e)
    doc_id = None
    if hasattr(e, "read"):
        err_body = e.read().decode()
        print(err_body)
        try:
            err_json = json.loads(err_body)
            if "detail" in err_json and isinstance(err_json["detail"], dict) and "document_id" in err_json["detail"]:
                doc_id = err_json["detail"]["document_id"]
                print("Using existing document_id:", doc_id)
        except Exception:
            pass

# If document was uploaded, attempt alignment creation
if doc_id:
    align_payload = {
        "alignment_name": "HOSPIX Weather & Logistics Alignment",
        "base_model_id": "llama-v3p2-3b-reasoning",
        "document_ids": [doc_id],
        "description": "Hospitality resource exchange weather disruption and pooling alignment",
    }
    req2 = urllib.request.Request(
        "https://api.nugen.in/api/v3/alignment-projects/create",
        data=json.dumps(align_payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req2) as resp2:
            align_res = json.loads(resp2.read().decode())
            print("Alignment Project Success:", align_res)
    except Exception as e:
        print("Alignment creation failed:", e)
        if hasattr(e, "read"):
            print(e.read().decode())
