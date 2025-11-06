/**
 * Minimal test data with just essential properties for quick testing
 * Use this when you need lightweight test data without all the metadata
 */

export const minimalTestNotes = [
  // Simple lightfoot note
  {
    id: 'minimal-1',
    kind: 1,
    pubkey: 'test-pubkey-1',
    created_at: 1699123456,
    content: 'Delivered letters from Berlin to Prague by train! #sustainabletravel',
    tags: [
      ['t', 'lightfoot'],
      ['location', '52.5200,13.4050']
    ]
  },

  // Simple lightfoot box
  {
    id: 'minimal-box-1', 
    kind: 1,
    pubkey: 'test-pubkey-2',
    created_at: 1699123456,
    content: '{"availability":"public","content":"Test lightfoot box in Amsterdam"}',
    tags: [
      ['t', 'lightfoot'],
      ['t', '#lightfootbox'],
      ['location', '52.3676,4.9041']
    ]
  },

  // Another simple note
  {
    id: 'minimal-2',
    kind: 1,  
    pubkey: 'test-pubkey-3',
    created_at: 1699123456,
    content: 'Hitchhiked with 5 letters from Paris to Barcelona! Amazing journey.',
    tags: [
      ['t', 'lightfoot'],
      ['location', '48.8566,2.3522']
    ]
  }
];

export default minimalTestNotes;