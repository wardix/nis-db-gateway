# NIS Database Gateway API

API performa tinggi yang dibangun dengan [Bun](https://bun.sh), [Hono](https://hono.dev), dan MariaDB untuk menyediakan integrasi dan akses data pelanggan yang aman (termasuk profil bandwidth, informasi customer, dan subscriber) dari database utama.

## Fitur Utama

- **Arsitektur Berlapis (3-Tier)**: Struktur kode modular yang memisahkan Route, Service, dan Repository.
- **Bandwidth Lookup**: Mendukung pengecekan banyak IP sekaligus (hingga 500 per batch).
- **Customer Lookup**: Pencarian Customer ID berdasarkan alamat email.
- **Subscriber Lookup**: Pencarian ID subscriber dan nama akun berdasarkan nomor telepon secara fleksibel.
- **Subscriber Graph Sync**: Sinkronisasi data graph ID secara massal ke tabel `CustomerServicesZabbixGraph` dengan pencatatan otomatis user pembuat (`UpdatedBy`).
- **Dual-Layer Auth**: Proteksi Admin (Bearer Token) untuk generate JWT, dan proteksi JWT untuk akses data.
- **SQL Performa Tinggi**: Menggunakan driver SQL bawaan Bun yang sangat cepat.
- **Transformasi Data Otomatis**: Konversi otomatis dari IP murni ke format CIDR `/32` untuk pencocokan database.

## Persiapan

Pastikan Anda telah menginstal [Bun](https://bun.sh) (v1.1+ direkomendasikan).

### Instalasi Dependensi

```bash
bun install
```

## Konfigurasi

Salin file contoh `.env.example` menjadi `.env` dan sesuaikan variabelnya:

```bash
cp .env.example .env
```

Sesuaikan isi file `.env` Anda:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=nis

# Authentication Security
ADMIN_TOKEN=your_admin_secret_token_here
JWT_SECRET=your_long_random_jwt_secret_here
```

## Cara Menjalankan

```bash
bun run src/index.ts
```
*(Catatan: Entry point sekarang berada di `src/index.ts` setelah refactoring ke Arsitektur Berlapis).*

## Dokumentasi API

### 1. Autentikasi: Mendapatkan JWT Token
**Endpoint**: `POST /auth/token`
**Auth**: `Authorization: Bearer <ADMIN_TOKEN>`

Endpoint ini digunakan untuk mendapatkan JWT yang diperlukan untuk mengakses data.

**Request Body (JSON)**:
- `exp` (Optional): Masa berlaku token dalam detik. Jika tidak diisi, token berlaku selamanya.
- `role` (Optional): Role klien (default: `operator`).
- `user` (Optional): Identitas pengguna (default: `nis`).

**Contoh Request**:
```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Authorization: Bearer your_admin_secret_token_here" \
  -H "Content-Type: application/json" \
  -d '{"user": "admin_jaya", "role": "admin", "exp": 3600}'
```

**Response**:
```json
{
  "token": "eyJhbG...",
  "expires_in": "1h"
}
```

### 2. Lookup Bandwidth
**Endpoint**: `POST /bandwidth/search`
**Auth**: `Authorization: Bearer <JWT_TOKEN>`

**Contoh Request**:
```bash
curl -X POST http://localhost:3000/bandwidth/search \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"ips": ["10.20.30.41", "10.20.30.42"]}'
```

**Request Body**:
```json
{
  "ips": ["10.20.30.41", "10.20.30.42"]
}
```

**Response**:
```json
[
  {
    "ip": "10.20.30.41",
    "download_rate": 10000000,
    "upload_rate": 5000000,
    "unit": "bps",
    "subscription_package": "Gold-Fiber-10M"
  }
]
```

### 3. Lookup Customer ID (by Email)
**Endpoint**: `GET /customers/lookup`  
**Auth**: `Authorization: Bearer <JWT_TOKEN>`

**Contoh Request**:
```bash
curl -G "http://localhost:3000/customers/lookup" \
  --data-urlencode "email=user@example.com" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response**:
```json
[
  {
    "customer_id": "CUST-12345"
  }
]
```

### 4. Lookup Subscriber (by Phone Number)
**Endpoint**: `GET /subscribers/lookup`  
**Auth**: `Authorization: Bearer <JWT_TOKEN>`

**Contoh Request**:
```bash
curl -G "http://localhost:3000/subscribers/lookup" \
  --data-urlencode "phone=08123456789" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response**:
```json
[
  {
    "subscriber_id": "SUB-12345",
    "account_name": "John Doe"
  }
]
```

### 5. Subscriber Graph Sync
**Endpoint**: `POST /subscribers/graph/sync`  
**Auth**: `Authorization: Bearer <JWT_TOKEN>`

**Contoh Request**:
```bash
curl -X POST http://localhost:3000/subscribers/graph/sync \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      { "subscriber_id": "123", "graph_id": "abc" },
      { "subscriber_id": "456", "graph_id": "def" }
    ]
  }'
```

**Response**:
```json
{
  "message": "Sync successful",
  "processed": 2
}
```

## Struktur Database (Tabel Terkait)

API ini melakukan JOIN atau interaksi pada tabel berikut:
- `CustomerServiceTechnical` (Kolom: `Network`, `CustServId`)
- `CustomerServices` (Kolom: `CustServId`, `ServiceId`, `CustAccName`, `CustStatus`)
- `ServiceShaping` (Kolom: `ServiceId`, `NormalDownCeil`, `NormalUpCeil`)
- `sms_phonebook` (Kolom: `phone`, `CustId`)
- `CustomerServicesZabbixGraph` (Kolom: `CustServId`, `GraphId`, `UpdatedBy`, `UpdatedTime`)
- `Customer` (Kolom: `CustEmail`, `CustTechCPEmail`, `CustBillCPEmail`)
