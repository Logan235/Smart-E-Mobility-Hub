# API Specification & Mock Data Documentation

Tài liệu này mô tả các API endpoint, mock data, kèm theo Request và Response tương ứng cho bài tập lớn môn Công nghệ phần mềm (Smart E-Mobility Hub).

---

## 1. Mock Data (Dữ liệu mẫu)
Dữ liệu được lưu trữ trong file `apps/backend/src/mock/shared-ev.mock.ts`:

```typescript
export const INITIAL_SHARED_EVS = [
  { id: 'ev-1', code: 'EV-001', hubId: 'hub-metro', batteryLevel: 85, status: 'AVAILABLE' },
  { id: 'ev-2', code: 'EV-002', hubId: 'hub-metro', batteryLevel: 15, status: 'CHARGING' },
  { id: 'ev-3', code: 'EV-003', hubId: 'hub-ktxb', batteryLevel: 90, status: 'AVAILABLE' },
  { id: 'ev-4', code: 'EV-004', hubId: 'hub-ktxb', batteryLevel: 45, status: 'AVAILABLE' },
];
```

---

## 2. API Endpoints

### 2.1. Lấy danh sách tất cả phương tiện (Shared EVs)
- **URL:** `GET /shared-ev`
- **Description:** Lấy toàn bộ danh sách xe điện dùng chung tại các trạm.
- **Request:** Không có Body hoặc Query params.
- **Response (200 OK):**
```json
[
  {
    "id": "ev-1",
    "code": "EV-001",
    "hubId": "hub-metro",
    "batteryLevel": 85,
    "status": "AVAILABLE"
  },
  {
    "id": "ev-2",
    "code": "EV-002",
    "hubId": "hub-metro",
    "batteryLevel": 15,
    "status": "CHARGING"
  },
  {
    "id": "ev-3",
    "code": "EV-003",
    "hubId": "hub-ktxb",
    "batteryLevel": 90,
    "status": "AVAILABLE"
  },
  {
    "id": "ev-4",
    "code": "EV-004",
    "hubId": "hub-ktxb",
    "batteryLevel": 45,
    "status": "AVAILABLE"
  }
]
```

---

### 2.2. Lấy danh sách xe theo Trạm (Hub)
- **URL:** `GET /shared-ev/hub/:hubId`
- **Description:** Lọc danh sách xe theo mã trạm (ví dụ: `hub-metro`).
- **Path Parameters:**
  - `hubId` (string): Mã định danh trạm (VD: `hub-metro`, `hub-ktxb`)
- **Request:** Không có Body.
- **Response (200 OK):**
```json
[
  {
    "id": "ev-1",
    "code": "EV-001",
    "hubId": "hub-metro",
    "batteryLevel": 85,
    "status": "AVAILABLE"
  }
]
```

---

### 2.3. Đặt chỗ xe điện (Reserve EV)
- **URL:** `POST /shared-ev/:id/reserve`
- **Description:** Thực hiện đặt trước xe điện trong 15 phút (chuyển trạng thái từ `AVAILABLE` sang `RESERVED`).
- **Path Parameters:**
  - `id` (string): ID của xe (VD: `ev-1`)
- **Request Body (JSON):**
```json
{
  "studentId": "STU123456"
}
```
- **Response (201 Created / 200 OK):**
```json
{
  "message": "Đặt xe thành công",
  "reservationId": "res-1718293848123-STU123456",
  "ev": {
    "id": "ev-1",
    "code": "EV-001",
    "hubId": "hub-metro",
    "batteryLevel": 85,
    "status": "RESERVED",
    "currentReservationId": "res-1718293848123-STU123456"
  }
}
```
- **Response lỗi (400 Bad Request - Khi xe không sẵn sàng):**
```json
{
  "message": "Xe hiện không có sẵn để đặt",
  "error": "Bad Request",
  "statusCode": 400
}
```
