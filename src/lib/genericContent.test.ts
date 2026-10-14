import { describe, expect, it } from 'vitest';
import {
  formatPerson, groupHasPeople, guidelinesFromLegacy, hostInitials, hostsFromLegacy, joinNames,
  peopleGroupsFromLegacy, readGuidelines, readHosts, readPeopleGroups, readVenues, venuesFromLegacy,
} from './genericContent';
import { mergeGlobal, mergeWeddingContent } from './weddingContent';

const legacyEntourage = {
  subtitle: 'With love', title: 'Entourage',
  parents: { groom: ['Mr. G1', 'Mrs. G2'], bride: ['Mr. B1'] },
  principalSponsors: [{ ninang: { title: 'Mrs.', name: 'A' }, ninong: { title: 'Mr.', name: 'B' }, couple: true }],
  honorAttendants: { bestMan: 'Best', maidOfHonor: 'Maid' },
  bridesmaids: ['Bm1', ''], groomsmen: ['Gm1'], flowerGirls: [], ringBearers: ['Rb1'],
};

describe('hosts', () => {
  it('reads groomName / brideName as two hosts, groom first', () => {
    expect(hostsFromLegacy({ groomName: 'Hans', brideName: 'Czay' })).toEqual([
      { name: 'Hans', role: 'Groom' }, { name: 'Czay', role: 'Bride' },
    ]);
    expect(hostsFromLegacy({})).toBeNull();
  });

  it('drops unnamed hosts and falls back when none is left', () => {
    expect(readHosts([{ name: 'Ana', role: '' }, { name: ' ', role: 'x' }])).toEqual([{ name: 'Ana', role: '' }]);
    expect(readHosts([{ name: '' }])).toBeNull();
    expect(readHosts('Ana')).toBeNull();
  });

  it('prefers saved hosts over the old names in mergeGlobal', () => {
    expect(mergeGlobal({ hosts: [{ name: 'Ana', role: 'Debutante' }], groomName: 'X' }).hosts).toEqual([{ name: 'Ana', role: 'Debutante' }]);
    expect(mergeGlobal({ groomName: 'Ben', brideName: 'Cy' }).hosts.map(h => h.name)).toEqual(['Ben', 'Cy']);
  });

  it('joins names and initials for one, two or more hosts', () => {
    expect(joinNames(['Ana'])).toBe('Ana');
    expect(joinNames(['Hans', 'Czay'])).toBe('Hans & Czay');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B & C');
    expect(hostInitials([{ name: 'hans', role: '' }, { name: ' czay', role: '' }])).toEqual(['H', 'C']);
  });
});

describe('people groups', () => {
  it('turns the fixed entourage into groups in screen order, titles from site text', () => {
    const groups = peopleGroupsFromLegacy(legacyEntourage, { bestMan: 'Best Man!', maidOfHonor: '' })!;
    expect(groups.map(g => [g.id, g.layout])).toEqual([
      ['parents-bride', 'featured'], ['parents-groom', 'featured'], ['principal-sponsors', 'pairs'],
      ['maid-of-honor', 'featured'], ['best-man', 'featured'], ['bridesmaids', 'list'],
      ['groomsmen', 'list'], ['flower-girls', 'list'], ['ring-bearers', 'list'],
    ]);
    expect(groups[4].title).toBe('Best Man!');
    expect(groups[3].title).toBe('Maid of Honor');
    expect(groups[1].people.map(p => p.name)).toEqual(['Mr. G1', 'Mrs. G2']);
    expect(groups[5].people.map(p => p.name)).toEqual(['Bm1']);
    expect(groups[2].pairs).toEqual([{
      left: { title: 'Mrs.', name: 'A', role: '', photo: '' },
      right: { title: 'Mr.', name: 'B', role: '', photo: '' },
      together: true,
    }]);
  });

  it('returns null for a doc without the old lists', () => {
    expect(peopleGroupsFromLegacy({ subtitle: 'x' })).toBeNull();
  });

  it('cleans saved groups and keeps an empty list', () => {
    expect(readPeopleGroups([])).toEqual([]);
    expect(readPeopleGroups(undefined)).toBeNull();
    const [group] = readPeopleGroups([{ title: 'Speakers', layout: 'odd', people: ['Dr. X', { name: 'Y', photo: 'p.jpg' }] }])!;
    expect(group).toEqual({
      id: 'group-1', title: 'Speakers', layout: 'list', pairs: [],
      people: [{ title: '', name: 'Dr. X', role: '', photo: '' }, { title: '', name: 'Y', role: '', photo: 'p.jpg' }],
    });
  });

  it('hides groups with no names', () => {
    const [group] = readPeopleGroups([{ layout: 'pairs', pairs: [{ left: { name: ' ' }, right: {} }] }])!;
    expect(groupHasPeople(group)).toBe(false);
    expect(formatPerson({ title: 'Mr.', name: ' Larry ' })).toBe('Mr. Larry');
  });
});

describe('venues', () => {
  const details = {
    ceremony: { title: 'The Ceremony', time: 'old', location: 'old', address: 'Church St', mapLink: 'm' },
    reception: { title: 'The Reception', time: '6 PM' },
  };

  it('turns ceremony + reception into venues, Global Settings winning for time/location/address', () => {
    const venues = venuesFromLegacy(details, { ceremonyTime: '3 PM', ceremonyLocation: 'Church', ceremonyAddress: '' })!;
    expect(venues.map(v => [v.id, v.title, v.time, v.location, v.address])).toEqual([
      ['ceremony', 'The Ceremony', '3 PM', 'Church', 'Church St'],
      ['reception', 'The Reception', '6 PM', '', ''],
    ]);
    expect(venuesFromLegacy({ header: {} }, {})).toBeNull();
  });

  it('reads saved venues with every field a string', () => {
    expect(readVenues([{ title: 'Hall', time: 9 }])).toEqual([{
      id: 'venue-1', title: 'Hall', subtitle: '', time: '', location: '', address: '',
      description: '', mapLink: '', calendarStart: '', calendarLoc: '', calendarDesc: '',
    }]);
  });
});

describe('guidelines', () => {
  it('turns ladies / gentlemen into two guidelines', () => {
    expect(guidelinesFromLegacy({ ladiesGuideline: 'Gowns', gentlemenGuideline: 'Suits' }, { ladies: 'Ladies' })).toEqual([
      { id: 'ladies', title: 'Ladies', text: 'Gowns' },
      { id: 'gentlemen', title: 'For Gentlemen', text: 'Suits' },
    ]);
    expect(guidelinesFromLegacy({ title: 'x' })).toBeNull();
    expect(readGuidelines([{ title: 'All', text: 'Smart casual' }])).toEqual([{ id: 'guideline-1', title: 'All', text: 'Smart casual' }]);
  });
});

describe('mergeWeddingContent', () => {
  it('reads old-shape docs into the new shape', () => {
    const content = mergeWeddingContent({
      globalSettings: { groomName: 'Ben', brideName: 'Cy', receptionTime: '7 PM' },
      entourage: legacyEntourage,
      details: { ceremony: { title: 'C' }, reception: { title: 'R', time: '6 PM' } },
      dressCode: { ladiesGuideline: 'Gowns', gentlemenGuideline: 'Suits' },
      siteText: { entourage: { bridesmaids: 'Ladies in Waiting' }, dressCode: { gentlemen: 'Men' } },
    });
    expect(content.global.hosts.map(h => h.name)).toEqual(['Ben', 'Cy']);
    expect(content.entourage.groups.find(g => g.id === 'bridesmaids')?.title).toBe('Ladies in Waiting');
    expect(content.details.venues.map(v => [v.title, v.time])).toEqual([['C', ''], ['R', '7 PM']]);
    expect(content.dressCode.guidelines.map(g => g.title)).toEqual(['For Ladies', 'Men']);
  });

  it('prefers the new fields when a doc has both shapes', () => {
    const content = mergeWeddingContent({
      entourage: { ...legacyEntourage, groups: [{ id: 'g', title: 'Speakers', layout: 'list', people: [{ name: 'X' }] }] },
      details: { ...{ ceremony: { title: 'C' } }, venues: [] },
      dressCode: { ladiesGuideline: 'Gowns', guidelines: [{ id: 'a', title: 'All', text: 'Smart' }] },
    });
    expect(content.entourage.groups.map(g => g.title)).toEqual(['Speakers']);
    expect(content.details.venues).toEqual([]);
    expect(content.dressCode.guidelines.map(g => g.title)).toEqual(['All']);
  });

  it('uses the JSON defaults without docs', () => {
    const content = mergeWeddingContent({});
    expect(content.global.hosts.length).toBeGreaterThan(0);
    expect(content.entourage.groups.length).toBeGreaterThan(0);
    expect(content.details.venues.length).toBeGreaterThan(0);
  });
});
