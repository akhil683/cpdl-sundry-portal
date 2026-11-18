export const CONSUMER_STORAGE_KEY = "cpdl-consumer-details-v1";
export const CONSUMER_UPDATED_EVENT = "cpdl:consumer-updated";

export interface ConsumerDetails {
  name: string;
  caNumber: string;
  address: string;
  load: string;
  division: string;
  subDivision: string;
  currentBalance: string;
  netPayable: string;
}

export const EMPTY_CONSUMER: ConsumerDetails = {
  name: "",
  caNumber: "",
  address: "",
  load: "",
  division: "",
  subDivision: "",
  currentBalance: "",
  netPayable: "",
};

export const DIVISIONS = [
  "Division 1",
  "Division 2",
  "Division 3",
  "Division 4",
] as const;

export const SUB_DIVISIONS = Array.from(
  { length: 10 },
  (_, index) => `Sub Division ${index + 1}`,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function readConsumer(): ConsumerDetails {
  if (typeof window === "undefined") return EMPTY_CONSUMER;

  try {
    const raw = window.localStorage.getItem(CONSUMER_STORAGE_KEY);
    if (!raw) return EMPTY_CONSUMER;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_CONSUMER;

    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      caNumber: typeof parsed.caNumber === "string" ? parsed.caNumber : "",
      address: typeof parsed.address === "string" ? parsed.address : "",
      load: typeof parsed.load === "string" ? parsed.load : "",
      division: typeof parsed.division === "string" ? parsed.division : "",
      subDivision:
        typeof parsed.subDivision === "string" ? parsed.subDivision : "",
      currentBalance:
        typeof parsed.currentBalance === "string" ? parsed.currentBalance : "",
      netPayable:
        typeof parsed.netPayable === "string" ? parsed.netPayable : "",
    };
  } catch {
    return EMPTY_CONSUMER;
  }
}

export function writeConsumer(details: ConsumerDetails): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(
      CONSUMER_STORAGE_KEY,
      JSON.stringify(details),
    );
    window.dispatchEvent(new Event(CONSUMER_UPDATED_EVENT));
    return true;
  } catch {
    return false;
  }
}
