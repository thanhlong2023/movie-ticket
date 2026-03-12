export interface TheaterType {
  id: number;
  name: string;
  address: string;
  hotline: string;
  region?: string;
  userId?: number;
  created_at?: string;
}

export interface TheaterInput {
  id?: number;
  name: string;
  address: string;
  hotline: string;
  region?: string;
  userId?: number;
  created_at?: string;
}

export interface RegionType {
  id: number;
  name: string;
  slug: string;
}

export interface ScreenType {
  id: number;
  theaterId: number;
  name: string;
  type: string;
  capacity?: number;
}
