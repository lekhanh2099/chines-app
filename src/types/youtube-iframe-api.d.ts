interface YoutubePlayerVars {
 playsinline?: number;
 rel?: number;
}

interface YoutubePlayerEvent {
 target: YoutubePlayerInstance;
}

interface YoutubePlayerStateChangeEvent {
 target: YoutubePlayerInstance;
 data: number;
}

interface YoutubePlayerErrorEvent {
 target: YoutubePlayerInstance;
 data: number;
}

interface YoutubePlayerEvents {
 onReady?: (event: YoutubePlayerEvent) => void;
 onStateChange?: (event: YoutubePlayerStateChangeEvent) => void;
 onError?: (event: YoutubePlayerErrorEvent) => void;
}

interface YoutubePlayerOptions {
 videoId: string;
 playerVars?: YoutubePlayerVars;
 events?: YoutubePlayerEvents;
}

interface YoutubePlayerInstance {
 playVideo(): void;
 pauseVideo(): void;
 seekTo(seconds: number, allowSeekAhead?: boolean): void;
 getCurrentTime(): number;
 getDuration(): number;
 getPlayerState(): number;
 setPlaybackRate(suggestedRate: number): void;
 destroy(): void;
}

interface YoutubePlayerConstructor {
 new (element: HTMLElement, options: YoutubePlayerOptions): YoutubePlayerInstance;
}

interface YoutubePlayerStateConstants {
 readonly UNSTARTED: number;
 readonly ENDED: number;
 readonly PLAYING: number;
 readonly PAUSED: number;
 readonly BUFFERING: number;
 readonly CUED: number;
}

interface YoutubeIframeApi {
 readonly Player: YoutubePlayerConstructor;
 readonly PlayerState: YoutubePlayerStateConstants;
}

interface Window {
 YT?: YoutubeIframeApi;
 onYouTubeIframeAPIReady?: () => void;
}
