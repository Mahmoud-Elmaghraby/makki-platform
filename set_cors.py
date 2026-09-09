import b2sdk.v2 as b2

KEY_ID = "00357dde065f5540000000002"
APP_KEY = "K003rRUGdVNRcSYvh2AxW/bk2PZdHQ8"
BUCKET_NAME = "makki-law-videos-2026"

info = b2.InMemoryAccountInfo()
api = b2.B2Api(info)
api.authorize_account("production", KEY_ID, APP_KEY)

bucket = api.get_bucket_by_name(BUCKET_NAME)
bucket.update(cors_rules=[
    {
        "corsRuleName": "makkiLocalDev",
        "allowedOrigins": ["http://localhost:5173"],
        "allowedHeaders": ["content-type", "range"],
        "allowedOperations": ["s3_head", "s3_get", "s3_put"],
        "exposeHeaders": ["etag", "content-length", "content-range", "accept-ranges"],
        "maxAgeSeconds": 3600,
    }
])

print("CORS rule applied successfully.")