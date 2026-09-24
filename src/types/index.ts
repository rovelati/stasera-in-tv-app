export type CategoryType = 'Tutti' | 'Film' | 'Serie TV' | 'Sport' | 'Intrattenimento' | 'Informazione' | 'Bambini' | 'Documentari';

export interface ChannelGeo {
  city: string;
  province?: string;
  region: string;
  country: string;
  coverage: string;
  isLocal: boolean;
  badge?: string;
  latitude: number;
  longitude: number;
}

export interface ChannelStream {
  url: string;
  label?: string;
  loginRequired?: boolean;
  geoIt?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  number: number;
  logo: string;
  type?: string;
  position?: number;
  stream?: ChannelStream | null;
  geo?: ChannelGeo | null;
}

export interface Program {
  id: string;
  title: string;
  description?: string;
  category?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  startSec?: number;
  endSec?: number;
  startTimeFormatted?: string;
  endTimeFormatted?: string;
  posterUrl?: string | null;
  isPrimaSerata?: boolean;
  isSecondaSerata?: boolean;
  channelId?: string;
  channelName?: string;
  channelLogo?: string;
  channelNumber?: number;
  streamUrl?: string | null;
  streamLabel?: string | null;
}

export interface ChannelSchedule {
  channel: {
    id: string;
    name: string;
    number: number;
    logo: string;
    streamUrl?: string | null;
    streamLabel?: string | null;
    geo?: ChannelGeo | null;
  };
  programs: Program[];
}

export interface ReminderItem {
  id: string;
  programId: string;
  programTitle: string;
  channelName: string;
  channelLogo: string;
  startTime: string;
  notificationId?: string;
  scheduledAt: string;
}

export type TabType = 'stasera' | 'ora' | 'domani' | 'canali' | 'preferiti';
