export type Source = {
  file: string;
  label?: string;
  originalLabel?: string;
  type?: string | 'hls' | 'dash' | 'mp4';
  status?: 'ok' | 'fail' | 'checking' | null;
  statusCode?: number | null;
  provider?: string;
    headers?: Record<string, string>;
    useProxy?: boolean;
    flag?: string;
  };

export type Subtitle = {
  file: string;
  lang: string;
  language: string;
};

export type Audio = {
  lang: string;
  language: string;
};

const shortcuts = [
  'play',
  'pause',
  'forward',
  'backward',
  'subtitle',
  'fullscreen',
  'volume',
] as const;

export type Shortcut = string | string[];
export type Shortcuts = Record<typeof shortcuts[number], Shortcut>;

export type HotKey = {
  fn: (videoEl: HTMLVideoElement) => void;
  name: string;
  hotKey: string | string[];
  preventDefault?: boolean;
};
