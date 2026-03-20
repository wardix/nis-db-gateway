# Bandwidth Lookup API

API performa tinggi yang dibangun dengan [Bun](https://bun.sh), [Hono](https://hono.dev), dan MariaDB untuk melakukan lookup profil bandwidth pelanggan berdasarkan alamat IP (CIDR /32).

## Fitur Utama

- **Lookup Batch**: Mendukung pengecekan banyak IP sekaligus (hingga 500 per batch).
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
DB_NAME=bandwidth_db

# Authentication Security
ADMIN_TOKEN=your_admin_secret_token_here
JWT_SECRET=your_long_random_jwt_secret_here
```

## Cara Menjalankan

```bash
bun run index.ts
```

## Dokumentasi API

### 1. Autentikasi: Mendapatkan JWT Token
**Endpoint**: `GET /generate-token`  
**Auth**: `Authorization: Bearer <ADMIN_TOKEN>`

Endpoint ini digunakan untuk mendapatkan JWT yang diperlukan untuk mengakses data.

**Contoh Request**:
```bash
curl -X GET http://localhost:3000/generate-token \
  -H "Authorization: Bearer your_admin_secret_token_here"
```

**Response**:
```json
{
  "token": "eyJhbG...",
  "expires_in": "1h"
}
```

### 2. Lookup Bandwidth
**Endpoint**: `POST /lookup-bandwidth`  
**Auth**: `Authorization: Bearer <JWT_TOKEN>`

**Contoh Request**:
```bash
curl -X POST http://localhost:3000/lookup-bandwidth \
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

## Struktur Database (Tabel Terkait)

API ini melakukan JOIN pada tabel berikut:
- `CustomerServiceTechnical` (Kolom: `Network`, `CustServId`)
- `CustomerServices` (Kolom: `CustServId`, `ServiceId`)
- `ServiceShaping` (Kolom: `ServiceId`, `NormalDownCeil`, `NormalUpCeil`)
