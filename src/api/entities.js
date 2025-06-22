import { base44 } from './base44Client';

// Create safe entity wrappers that handle undefined base44.entities
const createSafeEntity = (entityName) => {
  return new Proxy({}, {
    get(target, prop) {
      if (!base44.entities || !base44.entities[entityName]) {
        throw new Error(`Entity ${entityName} is not available. Please ensure you are logged in.`);
      }
      return base44.entities[entityName][prop];
    }
  });
};

export const Bankroll = base44.entities?.Bankroll || createSafeEntity('Bankroll');

export const Bet = base44.entities?.Bet || createSafeEntity('Bet');

export const Bookie = base44.entities?.Bookie || createSafeEntity('Bookie');

export const Sport = base44.entities?.Sport || createSafeEntity('Sport');

export const Ticket = base44.entities?.Ticket || createSafeEntity('Ticket');

export const Tutorial = base44.entities?.Tutorial || createSafeEntity('Tutorial');

// auth sdk:
export const User = base44.auth;