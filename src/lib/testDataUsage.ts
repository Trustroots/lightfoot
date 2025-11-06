/**
 * Example usage of test data for Lightfoot notes
 * This file demonstrates how to use the test data in your application
 */

import { exampleNotes, getExampleNotesByType, getExampleNotesByCity } from './testData';
import minimalTestNotes from './minimalTestData';
import { EventProcessorWorkerManager } from './eventProcessor';

/**
 * Example: Process test notes for use in the map
 */
export async function loadTestNotesForMap() {
  const workerManager = new EventProcessorWorkerManager();
  const processedNotes = [];

  for (const note of exampleNotes) {
    try {
      const processed = await workerManager.processWithWorker(note);
      if (processed) {
        processedNotes.push(processed);
      }
    } catch (error) {
      console.warn('Failed to process test note:', note.id, error);
    }
  }

  return {
    type: 'FeatureCollection' as const,
    features: processedNotes
  };
}

/**
 * Example: Get test notes for development mode
 * Add this to your +page.svelte to load test data in development
 */
export async function maybeLoadTestData() {
  // Only load test data in development mode
  if (import.meta.env.DEV) {
    const testData = await loadTestNotesForMap();
    console.log('Loaded test data:', testData.features.length, 'features');
    return testData;
  }
  return null;
}

/**
 * Example: Filter test notes by type
 */
export function getTestDataExamples() {
  return {
    allNotes: getExampleNotesByType('all'),
    boxesOnly: getExampleNotesByType('boxes'), 
    regularNotesOnly: getExampleNotesByType('regular'),
    berlinNotes: getExampleNotesByCity('berlin'),
    parisNotes: getExampleNotesByCity('paris'),
    minimal: minimalTestNotes
  };
}

/**
 * Example: Simulate real-time note arrival for testing
 */
export function simulateNoteStream(callback: (note: any) => void, intervalMs = 5000) {
  let noteIndex = 0;
  const notes = exampleNotes;

  const interval = setInterval(() => {
    if (noteIndex >= notes.length) {
      clearInterval(interval);
      console.log('Finished simulating note stream');
      return;
    }

    callback(notes[noteIndex]);
    noteIndex++;
  }, intervalMs);

  return () => clearInterval(interval);
}

/**
 * Example integration for +page.svelte:
 * 
 * // In your <script> section:
 * import { maybeLoadTestData } from '$lib/testDataUsage';
 * 
 * onMount(async () => {
 *   // Load test data in development
 *   const testData = await maybeLoadTestData();
 *   if (testData) {
 *     notesOnMap = testData;
 *   }
 *   
 *   // Then load real data from Nostr
 *   ndk.subscribe(...);
 * });
 */