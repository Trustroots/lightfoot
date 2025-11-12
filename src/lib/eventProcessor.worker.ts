import { EventProcessorFactory } from './eventProcessor';

self.onmessage = async (
  event: MessageEvent<{ event: any; requestId: string }>
) => {
  const { requestId, event: eventData } = event.data;

  const processor = EventProcessorFactory.createProcessor(eventData);
  const feature = await processor.process({ ...eventData });

  self.postMessage({ requestId, feature });
};
