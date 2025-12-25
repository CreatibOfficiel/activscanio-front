declare module 'workbox-window' {
  export interface WorkboxEventMap {
    controlling: Event;
    waiting: Event;
    installed: Event;
    activated: Event;
  }

  export interface WorkboxLifecycleEvent extends Event {
    isUpdate?: boolean;
  }

  export interface WorkboxOptions {
    scope?: string;
  }

  export class Workbox {
    constructor(scriptURL: string, options?: WorkboxOptions);
    register(): Promise<ServiceWorkerRegistration | undefined>;
    addEventListener<K extends keyof WorkboxEventMap>(
      type: K,
      listener: (event: WorkboxLifecycleEvent) => void
    ): void;
    messageSwWaiting(message: unknown): Promise<unknown>;
  }
}
