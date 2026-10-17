/**
 * URL / host rules shared by the browser (direct extension requests) and the
 * server (broker, playback relay). The server adds DNS-level checks on top of
 * these (`src/server/network/safe-fetch.ts`): a hostname that *resolves* to a
 * private address is refused there too.
 */

export class UrlPolicyError extends Error {
  constructor(
    message: string,
    /** The host that needs the user's permission, when that is the only problem. */
    readonly unapprovedHost: string | null = null,
  ) {
    super(message);
    this.name = "UrlPolicyError";
  }
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function ipv4ToInt(ip: string): number | null {
  const m = IPV4.exec(ip);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return ((parts[0]! << 24) >>> 0) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!;
}

/** [network, prefix] pairs that must never be reached from a server fetch. */
const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT (incl. Alibaba metadata 100.100.100.200)
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (incl. cloud metadata 169.254.169.254)
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.88.99.0", 24], // 6to4 relay anycast
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];

const BLOCKED_V4_RANGES = BLOCKED_V4.map(([net, prefix]) => {
  const base = ipv4ToInt(net)!;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return { base: (base & mask) >>> 0, mask };
});

export function isPublicIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return false;
  return !BLOCKED_V4_RANGES.some(({ base, mask }) => ((n & mask) >>> 0) === base);
}

/** Expands an IPv6 literal (no brackets) into 8 16-bit groups, or null. */
function parseIPv6(raw: string): number[] | null {
  let ip = raw.toLowerCase();
  const zone = ip.indexOf("%");
  if (zone >= 0) ip = ip.slice(0, zone);
  // Embedded dotted IPv4 tail (::ffff:1.2.3.4).
  const lastColon = ip.lastIndexOf(":");
  const tail = ip.slice(lastColon + 1);
  if (tail.includes(".")) {
    const v4 = ipv4ToInt(tail);
    if (v4 === null) return null;
    ip = `${ip.slice(0, lastColon + 1)}${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 && missing !== 0) return null;
  if (missing < 0) return null;
  const groups = [...head, ...Array.from({ length: halves.length === 2 ? missing : 0 }, () => "0"), ...rest];
  if (groups.length !== 8) return null;
  const out: number[] = [];
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    out.push(parseInt(g, 16));
  }
  return out;
}

function embeddedV4(groups: number[], from: number): string {
  const a = groups[from]!;
  const b = groups[from + 1]!;
  return `${a >> 8}.${a & 0xff}.${b >> 8}.${b & 0xff}`;
}

export function isPublicIPv6(raw: string): boolean {
  const g = parseIPv6(raw);
  if (!g) return false;
  const [g0, g1] = [g[0]!, g[1]!];
  if (g.every((x) => x === 0)) return false; // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return false; // ::1
  // IPv4-mapped / -compatible: judge the embedded address.
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) return isPublicIPv4(embeddedV4(g, 6));
  if (g0 === 0x64 && g1 === 0xff9b) return isPublicIPv4(embeddedV4(g, 6)); // NAT64
  if (g0 === 0x2002) return isPublicIPv4(embeddedV4(g, 1)); // 6to4
  if (g0 === 0x2001 && g1 === 0) return false; // Teredo
  if (g0 === 0x2001 && g1 === 0xdb8) return false; // documentation
  if (g0 === 0x100 && g1 === 0 && g[2] === 0 && g[3] === 0) return false; // discard
  if ((g0 & 0xfe00) === 0xfc00) return false; // unique local (incl. fd00:ec2::254)
  if ((g0 & 0xffc0) === 0xfe80) return false; // link-local
  if ((g0 & 0xffc0) === 0xfec0) return false; // site-local (deprecated)
  if ((g0 & 0xff00) === 0xff00) return false; // multicast
  return true;
}

export function isIpLiteral(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "");
  return ipv4ToInt(h) !== null || parseIPv6(h) !== null;
}

export function isPublicIp(address: string): boolean {
  const a = address.replace(/^\[|\]$/g, "");
  return ipv4ToInt(a) !== null ? isPublicIPv4(a) : isPublicIPv6(a);
}

const LOCAL_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa", ".lan", ".intranet", ".corp", ".invalid", ".test", ".example"];

/** Hostnames that designate a private/local machine without needing DNS. */
export function isForbiddenHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost") return true;
  if (isIpLiteral(host)) return !isPublicIp(host);
  // Single-label names ("metadata", "router") resolve through search domains.
  if (!host.includes(".")) return true;
  return LOCAL_SUFFIXES.some((s) => host.endsWith(s));
}

export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, "");
}

/** Exact hostname, or a `*.example.com` pattern matching strict subdomains. */
export function hostMatches(host: string, patterns: readonly string[]): boolean {
  const h = normalizeHost(host);
  return patterns.some((raw) => {
    const p = normalizeHost(raw);
    if (p.startsWith("*.")) return h.endsWith(p.slice(1)) && h.length > p.length - 1;
    return h === p;
  });
}

/**
 * Approximate "site" (registrable domain) of a host: the last two labels, or
 * three for short second-level ccTLD suffixes (co.uk, com.br…). Only used to
 * relate CDN hosts referenced by an already-authorized playlist, never to
 * widen what an extension itself may call.
 */
export function siteOf(host: string): string {
  const labels = normalizeHost(host).split(".");
  if (labels.length <= 2) return labels.join(".");
  const tld = labels[labels.length - 1]!;
  const sld = labels[labels.length - 2]!;
  const take = tld.length === 2 && sld.length <= 3 ? 3 : 2;
  return labels.slice(-take).join(".");
}

export interface UrlCheckOptions {
  /** When set, the host must match one of these (exact or `*.` pattern). */
  allowedHosts?: readonly string[];
}

/**
 * Structural URL checks: https only, default port, no credentials, no
 * local/private hostnames, and (optionally) an approved host.
 */
export function assertSafeUrl(raw: string, options: UrlCheckOptions = {}): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UrlPolicyError("Adresse invalide.");
  }
  if (url.protocol !== "https:") throw new UrlPolicyError(`Protocole refusé : ${url.protocol}`);
  if (url.username || url.password) throw new UrlPolicyError("Identifiants dans l'adresse refusés.");
  if (url.port && url.port !== "443") throw new UrlPolicyError("Port non standard refusé.");
  const host = normalizeHost(url.hostname);
  if (isForbiddenHostname(host)) throw new UrlPolicyError(`Hôte local ou privé refusé : ${host}`);
  if (options.allowedHosts && !hostMatches(host, options.allowedHosts)) {
    throw new UrlPolicyError(`Hôte non autorisé : ${host}`, host);
  }
  return url;
}
