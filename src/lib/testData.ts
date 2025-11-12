import type { NDKRawEvent } from '@nostr-dev-kit/ndk';
import type { Availability } from './types/lightfoot';

/**
 * Minimal array of example Lightfoot notes for testing purposes
 * These notes follow the Nostr event format and include both:
 * - Regular lightfoot notes (tagged with #lightfoot)
 * - Lightfoot box notes (tagged with #lightfootbox)
 */
export const exampleNotes: NDKRawEvent[] = [
  // Regular Lightfoot note - Berlin
  {
    id: 'test-note-berlin-1',
    kind: 1,
    pubkey: 'npub1test123456789abcdef',
    created_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    content:
      'Just dropped off some letters at the Berlin lightfoot box! Amazing community here. Looking forward to picking up letters heading to Prague next week. #sustainability #travel',
    tags: [
      ['t', 'lightfoot'],
      ['g', 'u33dc'], // Berlin geohash
      ['location', '52.5200,13.4050'], // Berlin coordinates
    ],
    sig: 'test-signature-berlin-1',
  },

  // Lightfoot box - Amsterdam
  {
    id: 'test-box-amsterdam-1',
    kind: 1,
    pubkey: 'npub1box123456789abcdef',
    created_at: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    content: JSON.stringify({
      availability: 'public' as Availability,
      content:
        'Lightfoot box in Amsterdam Central Library. Available 24/7, check with librarian on 2nd floor. Perfect spot for European letter exchanges!',
    }),
    tags: [
      ['t', 'lightfoot'],
      ['t', '#lightfootbox'],
      ['g', 'u173z'], // Amsterdam geohash
      ['location', '52.3676,4.9041'], // Amsterdam coordinates
    ],
    sig: 'test-signature-amsterdam-box',
  },

  // Regular Lightfoot note - Barcelona
  {
    id: 'test-note-barcelona-1',
    kind: 1,
    pubkey: 'npub1test789012345abcdef',
    created_at: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
    content:
      'Hitchhiked from Barcelona to Valencia carrying 3 lightfoot letters! Met amazing people along the way. The sustainable travel community is growing 🌱 #lightfoot #hitchhiking',
    tags: [
      ['t', 'lightfoot'],
      ['g', 'sp3e'], // Barcelona geohash
      ['location', '41.3851,2.1734'], // Barcelona coordinates
    ],
    sig: 'test-signature-barcelona-1',
  },

  // Lightfoot box - Paris (scheduled availability)
  {
    id: 'test-box-paris-1',
    kind: 1,
    pubkey: 'npub1box789012345abcdef',
    created_at: Math.floor(Date.now() / 1000) - 5400, // 1.5 hours ago
    content: JSON.stringify({
      availability: 'scheduled' as Availability,
      content:
        'Paris hackspace lightfoot box. Available Wed-Sun 14:00-20:00. Ring bell for access. Great community of makers and travelers!',
    }),
    tags: [
      ['t', 'lightfoot'],
      ['t', '#lightfootbox'],
      ['g', 'u09tv'], // Paris geohash
      ['location', '48.8566,2.3522'], // Paris coordinates
    ],
    sig: 'test-signature-paris-box',
  },

  // Regular Lightfoot note - Prague
  {
    id: 'test-note-prague-1',
    kind: 1,
    pubkey: 'npub1test345678901abcdef',
    created_at: Math.floor(Date.now() / 1000) - 900, // 15 minutes ago
    content:
      'Beautiful letter delivery in Prague old town today! The handwritten note from a grandmother to her grandchild in Vienna brought tears to my eyes. This is what lightfoot is all about ❤️',
    tags: [
      ['t', 'lightfoot'],
      ['g', 'u2edt'], // Prague geohash
      ['location', '50.0755,14.4378'], // Prague coordinates
    ],
    sig: 'test-signature-prague-1',
  },

  // Lightfoot box - Vienna (host availability)
  {
    id: 'test-box-vienna-1',
    kind: 1,
    pubkey: 'npub1box345678901abcdef',
    created_at: Math.floor(Date.now() / 1000) - 10800, // 3 hours ago
    content: JSON.stringify({
      availability: 'host' as Availability,
      content:
        'Vienna apartment lightfoot box. Contact me via nostr DM before visiting. I host travelers and maintain a small letter exchange. Couch available for lightfoot deputies!',
    }),
    tags: [
      ['t', 'lightfoot'],
      ['t', '#lightfootbox'],
      ['g', 'u2edk'], // Vienna geohash
      ['location', '48.2082,16.3738'], // Vienna coordinates
    ],
    sig: 'test-signature-vienna-box',
  },

  // Regular Lightfoot note - London
  {
    id: 'test-note-london-1',
    kind: 1,
    pubkey: 'npub1test567890123abcdef',
    created_at: Math.floor(Date.now() / 1000) - 2700, // 45 minutes ago
    content:
      'Cycled across London today delivering lightfoot letters! From Camden to Greenwich, spreading handwritten love across the city. Met a lovely elderly couple who remembered sending letters this way in the 70s 📮',
    tags: [
      ['t', 'lightfoot'],
      ['g', 'gcpvj'], // London geohash
      ['location', '51.5074,-0.1278'], // London coordinates
    ],
    sig: 'test-signature-london-1',
  },

  // Lightfoot box - Edinburgh (transient)
  {
    id: 'test-box-edinburgh-1',
    kind: 1,
    pubkey: 'npub1box567890123abcdef',
    created_at: Math.floor(Date.now() / 1000) - 14400, // 4 hours ago
    content: JSON.stringify({
      availability: 'transient' as Availability,
      content:
        'Temporary lightfoot box at Edinburgh Festival! Located at the Grassmarket hostel until end of August. Perfect for festival-goers to exchange letters with fellow travelers.',
    }),
    tags: [
      ['t', 'lightfoot'],
      ['t', '#lightfootbox'],
      ['g', 'gfzr4'], // Edinburgh geohash
      ['location', '55.9533,-3.1883'], // Edinburgh coordinates
    ],
    sig: 'test-signature-edinburgh-box',
  },

  // Regular Lightfoot note - Rome
  {
    id: 'test-note-rome-1',
    kind: 1,
    pubkey: 'npub1test901234567abcdef',
    created_at: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago
    content:
      'Just delivered a beautiful poem written on handmade paper from Florence to Rome! The recipient was so moved they immediately wrote a reply to send back north. The circle of lightfoot letters continues! 🇮🇹',
    tags: [
      ['t', 'lightfoot'],
      ['g', 'sr2y7'], // Rome geohash
      ['location', '41.9028,12.4964'], // Rome coordinates
    ],
    sig: 'test-signature-rome-1',
  },

  // Lightfoot box - Munich (public)
  {
    id: 'test-box-munich-1',
    kind: 1,
    pubkey: 'npub1box901234567abcdef',
    created_at: Math.floor(Date.now() / 1000) - 21600, // 6 hours ago
    content: JSON.stringify({
      availability: 'public' as Availability,
      content:
        'Munich central station lightfoot box! Located in the travelers lounge, 3rd floor. Open 24/7. Great connection point for letters going all over Europe and beyond.',
    }),
    tags: [
      ['t', 'lightfoot'],
      ['t', '#lightfootbox'],
      ['g', 'u281w'], // Munich geohash
      ['location', '48.1351,11.5820'], // Munich coordinates
    ],
    sig: 'test-signature-munich-box',
  },
];

/**
 * Helper function to get notes by type
 */
export const getExampleNotesByType = (type: 'all' | 'boxes' | 'regular') => {
  switch (type) {
    case 'boxes':
      return exampleNotes.filter((note) =>
        note.tags.some((tag) => tag[0] === 't' && tag[1] === '#lightfootbox')
      );
    case 'regular':
      return exampleNotes.filter(
        (note) =>
          !note.tags.some((tag) => tag[0] === 't' && tag[1] === '#lightfootbox')
      );
    case 'all':
    default:
      return exampleNotes;
  }
};

/**
 * Helper function to get notes by city
 */
export const getExampleNotesByCity = (city: string) => {
  return exampleNotes.filter(
    (note) =>
      note.content.toLowerCase().includes(city.toLowerCase()) ||
      note.id.includes(city.toLowerCase())
  );
};
