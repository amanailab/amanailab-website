export type ChannelStats = {
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  seriesCount: number;
};

export type Video = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
  duration?: string;
};

export type Playlist = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  url: string;
  category: string;
  level: string;
  tags: string[];
  gradientFrom: string;
  gradientTo: string;
  isNew: boolean;
};
