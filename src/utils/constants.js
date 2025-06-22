export const BET_TYPES = {
  SIMPLE: 'Simples',
  BACK: 'Back',
  LAY: 'Lay'
};

export const BET_STATUS = {
  PENDING: 'pending',
  WON: 'won',
  LOST: 'lost',
  CASHOUT: 'cashout'
};

export const BET_STATUS_LABELS = {
  [BET_STATUS.PENDING]: 'Pendente',
  [BET_STATUS.WON]: 'Ganho',
  [BET_STATUS.LOST]: 'Perda',
  [BET_STATUS.CASHOUT]: 'Cashout'
};

export const TICKET_CATEGORIES = {
  DOUBT: 'duvida',
  PROBLEM: 'problema',
  BUG: 'bug',
  SUGGESTION: 'sugestao',
  OTHER: 'outro'
};

export const TICKET_STATUS = {
  OPEN: 'aberto',
  ANSWERED: 'respondido',
  CLOSED: 'fechado'
};

export const DEFAULT_BET_LIMIT = 50;
export const FREE_BANKROLL_LIMIT = 3;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CANCELLED: 'cancelled'
};

export const PLAN_TYPES = {
  FREE: 'free',
  PRO: 'pro'
};