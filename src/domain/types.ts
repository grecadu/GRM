export type MusicContract = {
  artist: string;
  title: string;
  usages: string[]; 
  startDate: string; 
  endDate?: string; 
};

export type PartnerUsage = {
  partner: string;
  usage: string;
};

export type ActiveContractRow = {
  artist: string;
  title: string;
  usage: string;
  startDate: string;
  endDate?: string;
};
