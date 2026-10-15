import { describe, expect, it } from 'vitest';
import { canEditDesign, canEditDoc, canManageTeam, hasRole, isEventRole, keepsScreenOrder, type EventAccess } from './permissions';
import { DEFAULT_SCREENS } from './screens';

const owner: EventAccess = { role: 'owner', clientDesign: false };
const organizer: EventAccess = { role: 'organizer', clientDesign: false };
const client: EventAccess = { role: 'client', clientDesign: false };
const designClient: EventAccess = { role: 'client', clientDesign: true };

describe('permissions', () => {
  it('ranks owner over organizer over client', () => {
    expect(hasRole('owner', 'organizer')).toBe(true);
    expect(hasRole('organizer', 'organizer')).toBe(true);
    expect(hasRole('client', 'organizer')).toBe(false);
    expect(hasRole('client', 'client')).toBe(true);
    expect(hasRole('organizer', 'owner')).toBe(false);
  });

  it('knows the member roles only', () => {
    expect(isEventRole('organizer')).toBe(true);
    expect(isEventRole('client')).toBe(true);
    for (const bad of ['owner', 'super', 'admin', '', null]) expect(isEventRole(bad)).toBe(false);
  });

  it('locks the design for clients unless the event allows it', () => {
    expect(canEditDesign(owner)).toBe(true);
    expect(canEditDesign(organizer)).toBe(true);
    expect(canEditDesign(client)).toBe(false);
    expect(canEditDesign(designClient)).toBe(true);
    expect(canEditDoc(client, 'theme')).toBe(false);
    expect(canEditDoc(client, 'music')).toBe(false);
    expect(canEditDoc(designClient, 'theme')).toBe(true);
    for (const docId of ['welcomeScreen', 'siteText', 'globalSettings', 'screens']) {
      expect(canEditDoc(client, docId)).toBe(true);
    }
  });

  it('lets organizers and owners manage the team', () => {
    expect(canManageTeam(owner)).toBe(true);
    expect(canManageTeam(organizer)).toBe(true);
    expect(canManageTeam(designClient)).toBe(false);
  });

  it('tells a reorder from a show / hide / rename', () => {
    const current = { screens: DEFAULT_SCREENS };
    const hiddenAndRenamed = { screens: DEFAULT_SCREENS.map((s, i) => (i === 3 ? { ...s, enabled: false, label: 'Venue' } : s)) };
    const swapped = { screens: [DEFAULT_SCREENS[0], DEFAULT_SCREENS[2], DEFAULT_SCREENS[1], ...DEFAULT_SCREENS.slice(3)] };
    expect(keepsScreenOrder(hiddenAndRenamed, current)).toBe(true);
    expect(keepsScreenOrder(swapped, current)).toBe(false);
    // No doc yet = the default order.
    expect(keepsScreenOrder(current, null)).toBe(true);
    expect(keepsScreenOrder(swapped, null)).toBe(false);
  });
});
