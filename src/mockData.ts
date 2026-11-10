import { Category, DeskInfo, FoundItem, NotificationItem, NotifyAlert, UserProfile } from './types';

export const CAMPUS_DESKS: Record<string, DeskInfo> = {
  'SLC Front Desk': {
    id: 'slc-desk',
    name: 'SLC Front Desk',
    building: 'Student Life Centre (SLC)',
    room: 'Level 1, Main Concourse',
    hours: 'Open 24 hours / 7 days a week',
    description: 'Central campus community hub, adjacent to Tim Hortons and Campus Police.',
    phone: '519-888-4567 ext. 33145',
  },
  'DC Library': {
    id: 'dc-library',
    name: 'DC Library',
    building: 'William G. Davis Centre (DC)',
    room: 'Information & Circulation Desk, Ground Floor',
    hours: 'Mon–Sun: 8:00 AM – 11:00 PM',
    description: 'Primary STEM and engineering library desk at Davis Centre.',
    phone: '519-888-4567 ext. 32647',
  },
  'Dana Porter Library': {
    id: 'dp-library',
    name: 'Dana Porter Library',
    building: 'Dana Porter Library (DP)',
    room: 'Main Circulation Desk, 1st Floor',
    hours: 'Mon–Sun: 8:00 AM – 11:00 PM',
    description: 'Arts, humanities, and social sciences library desk overlooking the Arts Quad.',
    phone: '519-888-4567 ext. 32281',
  },
  'PAC Equipment Desk': {
    id: 'pac-desk',
    name: 'PAC Equipment Desk',
    building: 'Physical Activities Complex (PAC)',
    room: 'Athletics Service Hub, Lower Concourse',
    hours: 'Mon–Fri: 6:30 AM – 10:30 PM, Sat–Sun: 8:00 AM – 8:00 PM',
    description: 'Gym, pool, and warrior recreation lost & found intake.',
    phone: '519-888-4567 ext. 33582',
  },
  'REV Front Desk': {
    id: 'rev-desk',
    name: 'REV Front Desk',
    building: 'Ron Eydt Village (REV)',
    room: 'Main Residence Reception Desk',
    hours: 'Open 24 hours / 7 days a week',
    description: 'Campus residence security and student service desk.',
    phone: '519-888-4567 ext. 32412',
  },
};

export const INITIAL_USER: UserProfile = {
  name: 'Lily Lu',
  email: 'lily.lu@uwaterloo.ca',
  studentId: '20894123',
  claimsUsedThisWeek: 1,
  maxWeeklyInstantClaims: 3,
  isSignedIn: true,
};

// Seed 15 items spanning the 5 campus desks with varied ages
export const INITIAL_ITEMS: FoundItem[] = [
  {
    id: 'item-1',
    title: 'WatCard - Lily Lu',
    category: 'WatCard',
    colour: 'Gold / Black',
    publicDescription: 'University of Waterloo WatCard (Undergraduate)',
    detailedDescription: 'Undergraduate WatCard belonging to Lily Lu, ID 20894123, Faculty of Math.',
    desk: 'SLC Front Desk',
    dateLogged: '2026-11-05',
    daysAgo: 1, // New (< 14 days)
    status: 'available',
    valuable: true,
    storageSpot: 'Safe Drawer 1',
    watcardName: 'Lily Lu',
    locationFound: 'SLC 2nd floor silent study table',
  },
  {
    id: 'item-2',
    title: 'Yellow Hydro Flask (32 oz)',
    category: 'bottle',
    colour: 'Yellow',
    publicDescription: '32oz yellow insulated water bottle with stickers',
    detailedDescription: 'Bright sunflower yellow Hydro Flask with a Waterloo Goose sticker and straw lid.',
    desk: 'DC Library',
    dateLogged: '2026-11-03',
    daysAgo: 3, // New (< 14 days)
    status: 'available',
    valuable: false,
    storageSpot: 'Shelf B-3',
    locationFound: 'DC Library computer pod 4',
  },
  {
    id: 'item-3',
    title: 'Apple AirPods Pro (2nd Gen)',
    category: 'electronics',
    colour: 'White',
    publicDescription: 'Wireless earbuds in charging case',
    detailedDescription: 'AirPods Pro 2nd Gen inside a matte black silicone sleeve with a small silver carabiner.',
    desk: 'Dana Porter Library',
    dateLogged: '2026-11-04',
    daysAgo: 2, // New (< 14 days)
    status: 'available',
    valuable: true,
    storageSpot: 'Lockbox Tech-1',
    locationFound: 'DP Library 5th floor study carrel',
  },
  {
    id: 'item-4',
    title: 'North Face Black Puffer Jacket',
    category: 'clothing',
    colour: 'Black',
    publicDescription: 'Black hooded puffer winter jacket (Size M)',
    detailedDescription: 'Black down-filled jacket, Mens M, with small ski pass holder in left sleeve pocket.',
    desk: 'PAC Equipment Desk',
    dateLogged: '2026-10-31',
    daysAgo: 6, // New (< 14 days)
    status: 'available',
    valuable: false,
    storageSpot: 'Hanger Rack 4',
    locationFound: 'PAC main fitness centre weight rack',
  },
  {
    id: 'item-5',
    title: 'Keys on Waterloo Engineering Lanyard',
    category: 'keys',
    colour: 'Purple / Black',
    publicDescription: 'Set of 4 keys with electronic building fob',
    detailedDescription: 'Purple UW Engineering lanyard with 3 silver house keys, 1 small mailbox key, and a black RFID fob.',
    desk: 'SLC Front Desk',
    dateLogged: '2026-10-21',
    daysAgo: 16, // 14-29 days (Yellow aging)
    status: 'available',
    valuable: false,
    storageSpot: 'Key Box B',
    locationFound: 'SLC Lower concourse piano area',
  },
  {
    id: 'item-6',
    title: 'Dark Brown Leather Bifold Wallet',
    category: 'wallet',
    colour: 'Brown',
    publicDescription: 'Brown leather bifold wallet',
    detailedDescription: 'Dark brown distressed leather Fossil wallet containing Presto card, receipts, and cash.',
    desk: 'DC Library',
    dateLogged: '2026-10-19',
    daysAgo: 18, // 14-29 days (Yellow aging)
    status: 'available',
    valuable: true,
    storageSpot: 'Safe Drawer 2',
    locationFound: 'DC Fishbowl hallway bench',
  },
  {
    id: 'item-7',
    title: 'Grey Canada Goose Knit Beanie',
    category: 'clothing',
    colour: 'Grey',
    publicDescription: 'Grey ribbed merino wool winter beanie',
    detailedDescription: 'Heather grey merino wool knit beanie with circular brand disc emblem.',
    desk: 'REV Front Desk',
    dateLogged: '2026-10-05',
    daysAgo: 32, // 30+ days (Red aging - ready to donate)
    status: 'available',
    valuable: false,
    storageSpot: 'Bin Apparel-1',
    locationFound: 'REV South Quad lounge',
  },
  {
    id: 'item-8',
    title: 'TI-84 Plus CE Graphing Calculator',
    category: 'electronics',
    colour: 'Pink',
    publicDescription: 'Graphing calculator with slide cover',
    detailedDescription: 'Rose pink TI-84 Plus CE with rechargeable battery and engraved name inside slide case.',
    desk: 'Dana Porter Library',
    dateLogged: '2026-10-16',
    daysAgo: 21, // 14-29 days (Yellow aging)
    status: 'available',
    valuable: true,
    storageSpot: 'Lockbox Tech-2',
    locationFound: 'DP 3rd floor group study room 328',
  },
  {
    id: 'item-9',
    title: 'Blue Stanley Quencher Tumbler (40oz)',
    category: 'bottle',
    colour: 'Blue',
    publicDescription: 'Large 40oz blue insulated tumbler with handle',
    detailedDescription: 'Sky blue Stanley FlowState tumbler with translucent straw and minimal scratches on base.',
    desk: 'SLC Front Desk',
    dateLogged: '2026-10-02',
    daysAgo: 35, // 30+ days (Red aging - ready to donate)
    status: 'available',
    valuable: false,
    storageSpot: 'Bin Mugs-3',
    locationFound: 'SLC Black and Gold room',
  },
  {
    id: 'item-10',
    title: 'Lenovo ThinkPad 65W USB-C Charger',
    category: 'electronics',
    colour: 'Black',
    publicDescription: 'USB-C laptop power adapter with cable',
    detailedDescription: 'Standard matte black Lenovo 65W AC power brick with 2-prong wall plug cord.',
    desk: 'DC Library',
    dateLogged: '2026-10-29',
    daysAgo: 8, // New (< 14 days)
    status: 'available',
    valuable: true,
    storageSpot: 'Safe Drawer 3',
    locationFound: 'DC Help Desk charging zone',
  },
  {
    id: 'item-11',
    title: "Arc'teryx Cormac Crew Workout Shirt",
    category: 'clothing',
    colour: 'Navy Blue',
    publicDescription: 'Navy blue athletic moisture-wicking top (Size L)',
    detailedDescription: 'Navy lightweight technical running shirt with reflective bird logo on chest.',
    desk: 'PAC Equipment Desk',
    dateLogged: '2026-10-25',
    daysAgo: 12, // New (< 14 days)
    status: 'reserved',
    valuable: false,
    storageSpot: 'Holding Shelf H-1',
    locationFound: 'PAC Squash court 2 viewing gallery',
    claim: {
      id: 'claim-101',
      itemId: 'item-11',
      claimantName: 'Lily Lu',
      claimantEmail: 'lily.lu@uwaterloo.ca',
      claimedAt: '2026-11-05T14:30:00Z',
      status: 'approved',
      pickupCode: 'WLO-204',
      holdExpiresAt: '2026-11-12T23:59:59Z',
      distinguishingDetail: 'Small white tag cut off at collar, left near locker 114.',
    },
  },
  {
    id: 'item-12',
    title: 'WatCard - Marcus Chen',
    category: 'WatCard',
    colour: 'Gold / Black',
    publicDescription: 'University of Waterloo WatCard (Undergraduate)',
    detailedDescription: 'WatCard for Marcus Chen, ID 20914852, Faculty of Engineering.',
    desk: 'REV Front Desk',
    dateLogged: '2026-11-02',
    daysAgo: 4, // New (< 14 days)
    status: 'available',
    valuable: true,
    storageSpot: 'Safe Drawer REV-1',
    watcardName: 'Marcus Chen',
    locationFound: 'REV Cafeteria tray return',
  },
  {
    id: 'item-13',
    title: 'Logitech MX Master 3S Wireless Mouse',
    category: 'electronics',
    colour: 'Grey',
    publicDescription: 'Ergonomic wireless computer mouse',
    detailedDescription: 'Graphite grey MX Master 3S with magnetic scroll wheel and small scratch on bottom foot.',
    desk: 'Dana Porter Library',
    dateLogged: '2026-10-22',
    daysAgo: 15, // 14-29 days (Yellow aging)
    status: 'under-review',
    valuable: true,
    storageSpot: 'Lockbox Tech-1',
    locationFound: 'DP 10th floor study carrel 104',
    claim: {
      id: 'claim-102',
      itemId: 'item-13',
      claimantName: 'Lily Lu',
      claimantEmail: 'lily.lu@uwaterloo.ca',
      claimedAt: '2026-11-05T19:15:00Z',
      status: 'pending',
      pickupCode: 'WLO-729',
      holdExpiresAt: '2026-11-12T23:59:59Z',
      verificationAnswer: 'It is connected to Bluetooth profile 1 with device name "Lily-MacBook", and has a tiny hairline scuff on the thumb gesture button.',
    },
  },
  {
    id: 'item-14',
    title: 'Honda Car Key Fob on Red Carabiner',
    category: 'keys',
    colour: 'Black / Red',
    publicDescription: 'Automotive remote key fob with red clip',
    detailedDescription: 'Black 4-button Honda smart key fob with red anodized aluminum climbing clip and gym barcode.',
    desk: 'PAC Equipment Desk',
    dateLogged: '2026-11-04',
    daysAgo: 2, // New (< 14 days)
    status: 'available',
    valuable: false,
    storageSpot: 'Key Box PAC-1',
    locationFound: 'PAC entrance lobby seating',
  },
  {
    id: 'item-15',
    title: 'Black Slim Cardholder Wallet',
    category: 'wallet',
    colour: 'Black',
    publicDescription: 'Black leather cardholder',
    detailedDescription: 'Black saffiano leather cardholder found in MC building.',
    desk: 'SLC Front Desk',
    dateLogged: '2026-11-06',
    daysAgo: 0, // Today
    status: 'in-transit',
    valuable: true,
    dropOffCode: 'DROP-419',
    locationFound: 'MC 3rd floor tutorial room MC 3004',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'watcard_found',
    title: 'WatCard Found at SLC Desk',
    message: 'Good news Lily! A WatCard matching your name "Lily Lu" was turned in at the SLC Front Desk.',
    timestamp: 'Yesterday at 3:45 PM',
    read: false,
    relatedItemId: 'item-1',
    actionText: 'View WatCard Details',
  },
  {
    id: 'notif-2',
    type: 'claim_approved',
    title: 'Claim Ready for Pickup',
    message: 'Your claim for the Navy Blue Arc\'teryx Shirt was approved. Show your pickup code at PAC Equipment Desk.',
    timestamp: 'Yesterday at 5:12 PM',
    read: false,
    relatedItemId: 'item-11',
    pickupCode: 'WLO-204',
    actionText: 'Show Pickup QR Code',
  },
  {
    id: 'notif-3',
    type: 'match_alert',
    title: 'Possible Match: Yellow Hydro Flask',
    message: 'A yellow insulated water bottle was logged at DC Library that matches your saved search alert.',
    timestamp: '2 days ago',
    read: true,
    relatedItemId: 'item-2',
    actionText: 'Check Item',
  },
  {
    id: 'notif-4',
    type: 'dropoff_thanks',
    title: 'Drop-off Received: Honda Key Fob',
    message: 'Thanks for keeping campus honest! The keys you dropped off at PAC were verified by staff.',
    timestamp: '3 days ago',
    read: true,
    relatedItemId: 'item-14',
  },
];

export const INITIAL_NOTIFY_ALERTS: NotifyAlert[] = [
  {
    id: 'alert-1',
    category: 'bottle',
    colour: 'Yellow',
    brandOrKeyword: 'Hydro Flask',
    locationLost: 'DC Library or MC hallway',
    dateLost: '2026-11-02',
    createdAt: '2026-11-03',
    active: true,
  },
  {
    id: 'alert-2',
    category: 'wallet',
    colour: 'Black',
    brandOrKeyword: 'Cardholder',
    locationLost: 'Math & Computer building (MC)',
    dateLost: '2026-11-06',
    createdAt: '2026-11-06',
    active: true,
  },
];

export function getNearestDesk(buildingName: string): { desk: string; reason: string } {
  const b = buildingName.toLowerCase();
  if (b.includes('mc') || b.includes('dc') || b.includes('math') || b.includes('m3') || b.includes('cph')) {
    return { desk: 'DC Library', reason: 'Closest to DC, MC, and Math & Computing quad.' };
  }
  if (b.includes('dp') || b.includes('hh') || b.includes('al') || b.includes('ml') || b.includes('arts') || b.includes('ev') || b.includes('pas')) {
    return { desk: 'Dana Porter Library', reason: 'Closest to Arts Quad, Environment, and Porter.' };
  }
  if (b.includes('pac') || b.includes('cif') || b.includes('bmh') || b.includes('ahs') || b.includes('gym')) {
    return { desk: 'PAC Equipment Desk', reason: 'Closest to Athletics, PAC gym, and Applied Health.' };
  }
  if (b.includes('rev') || b.includes('v1') || b.includes('uwp') || b.includes('cmh') || b.includes('mkv') || b.includes('residence')) {
    return { desk: 'REV Front Desk', reason: 'Closest to Campus Residences on the west side.' };
  }
  // Default to SLC
  return { desk: 'SLC Front Desk', reason: 'Central 24/7 desk located in the Student Life Centre.' };
}

export function generatePickupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 3; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WLO-${randomPart}`;
}

export function generateDropOffCode(): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `DROP-${num}`;
}

export function getRetentionPolicyDays(valuable: boolean): number {
  return valuable ? 60 : 30;
}

export function getDaysUntilDeskTransfer(daysAgo: number, valuable: boolean): number {
  const maxDaysAtDesk = 14;
  const remaining = maxDaysAtDesk - daysAgo;
  return remaining > 0 ? remaining : 0;
}
