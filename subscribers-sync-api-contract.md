# Subscribers Sync API Contract (v1.0)

Ringkasan
- Tujuan: spesifikasi endpoint eksternal yang dipanggil oleh proses `subscribers-sync` agar sinkronisasi subscriber/ circuit berjalan andal.
- Auth: Bearer token via Authorization header (required). Example: `Authorization: Bearer <token>`.
- Base URL: nilai environment `SUBSCRIBER_API_BASE` harus menunjuk ke endpoint yang menerima query params (mis. `https://api.vendor.example/subscribers`).

Endpoint
- Method: GET
- URL: {SUBSCRIBER_API_BASE}?page={page}&page_size={page_size}

Query parameters
- page (int): halaman permintaan, default 1.
- page_size (int): ukuran halaman, default 100 (server dapat menolak nilai di luar batas).

Authentication
- Header: `Authorization: Bearer <token>` pada setiap request.
- 401 Unauthorized jika header Authorization hilang atau invalid.

Response (200 OK)
- Body JSON (utama):
  {
    "results": [ <Subscriber> ],
    "next_page": <integer|null>,    // optional
    "total_pages": <integer>       // optional
  }

- Alias allowed: klien juga menerima `data` sebagai nama array jika vendor memakai konvensi berbeda.

Subscriber object (schema)
- subscriber_id (string) — required. Unique identifier for subscriber.
- subscriber_name (string|null)
- circuit_id (string) — required. Identik dengan `circuit_id` yang dipakai di sistem kita.
- additional fields allowed (vendor-specific) — ignored by sync process.

Contoh respons
```
GET /subscribers?page=1&page_size=2

200 OK
{
  "results": [
    { "subscriber_id":"sub-001", "subscriber_name":"PT Contoh", "circuit_id":"CRT2511009110" },
    { "subscriber_id":"sub-002", "subscriber_name":"Ibu Budi", "circuit_id":"CRT2511009111" }
  ],
  "next_page": 2,
  "total_pages": 10
}
```

Pagination semantics
- Jika `results` kosong atau tidak ada elemen, anggap itu akhir list.
- Prefer `next_page` (integer) atau `total_pages`, tetapi klien akan fallback ke empty-array termination.

Errors
- 400 Bad Request: parameter invalid.
- 401 Unauthorized: missing/invalid `X-API-Key`.
- 429 Too Many Requests: sertakan `Retry-After` header (seconds).
- 500+ Server Error: klien harus retry dengan exponential backoff.

Rate-limiting & performance
- Vendor harus mendokumentasikan limit riil; klien akan menerapkan retry/backoff.
- Untuk keamanan, disarankan page_size <= 1000; klien akan menghentikan ketika menerima empty page.

Idempotency & semantics
- Endpoint harus read-only and idempotent.
- Perubahan pada subscriber (name/circuit mapping) harus tercermin pada response selanjutnya; klien akan melakukan upsert ke tabel `subscribers`.

Mapping / Flexibility
- Klien akan mencari fields dengan nama: `subscriber_id` or `id` or `customer_id` for subscriber_id; `subscriber_name` or `name` for subscriber_name; `circuit_id` or `customerID`/`customer_id` for circuit_id.
- Jika vendor menggunakan naming berbeda, mohon informasikan agar mapping dapat disesuaikan.

Change log
- v1.0: initial contract — paginated GET with `results` array, bearer token auth (Authorization header).

Notes untuk vendor
- Harap sediakan predictable pagination (page + page_size or next_page token).
- Sertakan `Retry-After` pada 429 responses.
- Berikan contoh respons dengan field `circuit_id` agar client dapat langsung melakukan mapping.
