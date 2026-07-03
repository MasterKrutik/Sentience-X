/**
 * Last manually verified on: 2026-07-02
 * CRITICAL SAFETY WARNING: These resources MUST be manually re-verified by phone
 * before each and every production deployment.
 */

export interface CrisisResource {
  name: string;
  number: string;
  hours: string;
  source: string;
}

export const crisisResources: CrisisResource[] = [
  {
    name: "NIMHANS Helpline",
    number: "1800-891-4416",
    hours: "24/7 Support",
    source: "Government-backed · Free & Confidential"
  },
  {
    name: "iCall Helpline (TISS)",
    number: "9152987821",
    hours: "Mon-Sat, 8am-10pm",
    source: "Professional Counselors · Confidential"
  },
  {
    name: "Kiran Helpline",
    number: "1800-599-0019",
    hours: "24/7 Support",
    source: "Ministry of Social Justice & Empowerment · Free"
  }
];
