import { Timestamp } from 'firebase/firestore';

export type CodeStatus = 'unused' | 'used';
export type AttendanceStatus = 'Yes' | 'No';

export interface Guest {
  id?: string; // Document ID (usually the inviteCode itself if we use it as ID, or separate)
  inviteCode: string;
  codeStatus: CodeStatus;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  willAttend?: AttendanceStatus;
  proxyName?: string;
  message?: string;
  submittedAt?: Date | Timestamp; // Firestore Timestamp
  createdAt: Date | Timestamp; // Firestore Timestamp
}

export interface RegistryGift {
  id?: string;
  name: string;
  link: string;
  maxCount: number;
  currentCount: number;
  isFull: boolean;
  createdAt: Date | Timestamp; // Firestore Timestamp
}

export interface GiftSelection {
  id?: string;
  giftId: string;
  giftName: string;
  fullName: string;
  email: string;
  message?: string;
  selectedAt: Date | Timestamp; // Firestore Timestamp
}

export interface AdminUser {
  id?: string; // Firebase Auth UID
  email: string;
  name: string;
  addedAt: Date | Timestamp; // Firestore Timestamp
}
