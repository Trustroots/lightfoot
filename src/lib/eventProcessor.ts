import type { Feature as GeoJSONFeature, Geometry } from 'geojson';
import { IEventProcessor } from './processors/BaseProcessor';
import { LightfootBoxProcessor } from './processors/LightfootBoxProcessor';
import type {
  LocationData,
  ProcessedContent,
  ProcessedData,
  SingleProperties,
  UserProfile,
} from './processors/types';

// EventProcessorFactory class
class EventProcessorFactory {
  private static processors: Map<number, new () => IEventProcessor> = new Map();

  static register(
    kind: number,
    processorClass: new () => IEventProcessor
  ): void {
    this.processors.set(kind, processorClass);
  }

  static createProcessor(event: any): IEventProcessor {
    const ProcessorClass = this.processors.get(event.kind);
    if (ProcessorClass) {
      return new ProcessorClass();
    }
    return new LightfootBoxProcessor();
  }
}

class EventProcessorWorkerManager {
  private workers: Worker[] = [];
  private nextWorkerIndex = 0;
  private pendingPromises: Map<string, Promise<any>> = new Map();

  // Initialize workers based on hardware concurrency
  // Reserve a few for cache and other things.
  constructor(workerCount: number = navigator.hardwareConcurrency - 5 || 4) {
    if (typeof window === 'undefined' || !window.Worker) {
      console.warn('Web Workers are not supported in this environment.');
      return;
    }

    for (let i = 0; i < workerCount; i++) {
      this.workers.push(
        new Worker(new URL('./eventProcessor.worker.ts', import.meta.url), {
          type: 'module',
        })
      );
    }
  }

  private getNextWorker(): Worker | undefined {
    if (this.workers.length === 0) return undefined;
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  processWithWorker(
    event: any
  ): Promise<GeoJSONFeature<Geometry, SingleProperties> | null> {
    const worker = this.getNextWorker();

    if (!worker || !window.Worker) {
      if (!window.Worker) {
        console.warn('Web Workers are not supported in this environment.');
      } else {
        console.warn('No available workers to process the event.');
      }

      // Fallback to direct processing if no worker is available
      const processor = EventProcessorFactory.createProcessor(event);
      return processor.process(event);
    }

    // Use a unique requestId to map responses to requests
    const requestId = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    if (!(worker as any)._listeners) {
      (worker as any)._listeners = new Map<
        string,
        { resolve: Function; reject: Function }
      >();
    }
    const listeners: Map<string, { resolve: Function; reject: Function }> = (
      worker as any
    )._listeners;

    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (typeof data !== 'object' || !data.requestId) return;
      const listener = listeners.get(data.requestId);
      if (listener) {
        listener.resolve(data.feature);
        listeners.delete(data.requestId);
        this.pendingPromises.delete(data.requestId);
      }
    };

    const handleError = (err: ErrorEvent) => {
      console.log('Worker error:', err, requestId);
      const listener = listeners.get(requestId);
      if (listener) {
        listener.reject(err);
        listeners.delete(requestId);
        this.pendingPromises.delete(requestId);
      }
    };

    // Attach the message handler only once per worker
    if (!(worker as any)._hasGlobalListener) {
      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);
      (worker as any)._hasGlobalListener = true;
    }

    const promise = new Promise<GeoJSONFeature<
      Geometry,
      SingleProperties
    > | null>((resolve, reject) => {
      listeners.set(requestId, { resolve, reject });

      worker.postMessage({
        requestId,
        event: {
          tags: event.tags,
          kind: event.kind,
          content: event.content,
          created_at: event.created_at,
          id: event.id,
          pubkey: event.pubkey,
        },
      });
    });

    this.pendingPromises.set(requestId, promise);

    return promise;
  }
}

export {
  EventProcessorFactory,
  EventProcessorWorkerManager,
  IEventProcessor,
  LightfootBoxProcessor,
  type LocationData,
  type ProcessedContent,
  type ProcessedData,
  type UserProfile,
};
