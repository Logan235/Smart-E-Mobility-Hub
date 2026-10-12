import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SharedEV, EVStatus } from './entities/shared-ev.entity.js';
import { INITIAL_SHARED_EVS } from '../../mock/shared-ev.mock.js';

@Injectable()
export class SharedEvService {
  // Lưu trữ dữ liệu trực tiếp trong mảng JS (In-memory Data Store) được tách ra file riêng
  private evs: SharedEV[] = [...INITIAL_SHARED_EVS];

  // Lấy tất cả xe
  findAll(): SharedEV[] {
    return this.evs;
  }

  // Lấy xe theo Hub
  findByHub(hubId: string): SharedEV[] {
    return this.evs.filter((ev) => ev.hubId === hubId);
  }

  // Đặt giữ xe (Xử lý nghiệp vụ Đặt xe & đếm ngược 15 phút)
  reserveEv(evId: string, studentId: string) {
    const ev = this.evs.find((item) => item.id === evId);
    if (!ev) throw new NotFoundException('Không tìm thấy xe');
    if (ev.status !== EVStatus.AVAILABLE) {
      throw new BadRequestException('Xe hiện không có sẵn để đặt');
    }

    // Cập nhật trạng thái xe thành RESERVED
    ev.status = EVStatus.RESERVED;
    ev.currentReservationId = `res-${Date.now()}-${studentId}`;

    // Giả lập FR-AUTO-01: Tự động hủy sau 15 phút nếu không check-in (demo dùng 30 giây)
    setTimeout(() => {
      if (ev.status === EVStatus.RESERVED) {
        ev.status = EVStatus.AVAILABLE;
        ev.currentReservationId = null;
        console.log(`[Auto-Expire] Đã tự động nhả xe ${ev.code} do hết hạn check-in`);
      }
    }, 30000); // 30s cho demo

    return {
      message: 'Đặt xe thành công',
      reservationId: ev.currentReservationId,
      ev,
    };
  }
}

