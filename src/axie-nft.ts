import { TowerType } from './tower-defense-types';

export type AxieClass = 'Plant' | 'Beast' | 'Aqua' | 'Bird' | 'Bug' | 'Reptile' | 'Mech' | 'Dawn' | 'Dusk';

export type VisualMode = 'billboard_25d' | 'mascot_3d';

export interface AxiePart {
  id: string;
  name: string;
  type: string;
  class: string;
}

export interface AxieNFT {
  id: string;
  name: string;
  class: AxieClass;
  image: string;
  parts?: AxiePart[];
  specialType?: 'Mystic' | 'Origin' | 'Japan' | 'Xmas' | 'Normal';
  level?: number;
  breedCount?: number;
  isCustom?: boolean;
}

export interface AxieLoadout {
  slots: Record<TowerType, AxieNFT | null>;
  visualMode: VisualMode;
  roninAddress: string | null;
}

const STORAGE_KEY_LOADOUT = 'axie_defense_loadout_v1';
const STORAGE_KEY_SAVED_AXIES = 'axie_defense_saved_axies_v1';

// Official Ronin Mainnet RPC & Verified Axie ERC-721 Contract
const RONIN_RPC = 'https://api.roninchain.com/rpc';
const AXIE_CONTRACT = '0x32950db2a7164ae833121501c797d79e7b79d74c';

/**
 * Official Sky Mavis CDN dynamic transparent render for any Axie NFT ID.
 * Hosted on axiecdn.axieinfinity.com (200 OK with transparent PNG & permissive CORS).
 */
export function getAxieImageUrl(axieId: string | number): string {
  const cleanId = String(axieId).replace(/[^0-9]/g, '');
  return `https://axiecdn.axieinfinity.com/axies/${cleanId}/axie/axie-full-transparent.png`;
}

/**
 * Normalizes any Ronin / Ethereum address variant (ronin:0x..., 0x..., ronin:..., uppercase, spaces)
 */
export function normalizeRoninAddress(address: string): { cleanHex: string; rawHex: string; roninAddr: string; paddedWord: string } {
  const cleanHex = address.trim().toLowerCase().replace(/^(ronin:)?(0x)?/, '');
  return {
    cleanHex,
    rawHex: '0x' + cleanHex,
    roninAddr: 'ronin:' + cleanHex,
    paddedWord: cleanHex.padStart(64, '0')
  };
}

/**
 * Migrates old legacy/blocked domains (assets.axieinfinity.com) to modern axiecdn.
 */
export function sanitizeAxieImageUrl(url: string, axieId?: string | number): string {
  if (!url || url.includes('assets.axieinfinity.com')) {
    if (axieId) return getAxieImageUrl(axieId);
    return (url || '').replace('assets.axieinfinity.com', 'axiecdn.axieinfinity.com');
  }
  return url;
}

/**
 * Curated Demo Axies for instant 1-click testing (ideal for Vibeathon judges & players without Ronin).
 */
export const DEMO_AXIES: AxieNFT[] = [
  {
    id: '482910',
    name: 'Sprout King',
    class: 'Plant',
    image: getAxieImageUrl('482910'),
    specialType: 'Normal',
    level: 12,
    parts: [
      { id: 'horn-cactus', name: 'Cactus', type: 'horn', class: 'Plant' },
      { id: 'mouth-serious', name: 'Serious', type: 'mouth', class: 'Plant' },
      { id: 'back-pumpkin', name: 'Pumpkin', type: 'back', class: 'Plant' },
      { id: 'tail-carrot', name: 'Carrot', type: 'tail', class: 'Plant' }
    ]
  },
  {
    id: '10492',
    name: 'Crimson Claw',
    class: 'Beast',
    image: getAxieImageUrl('10492'),
    specialType: 'Origin',
    level: 25,
    parts: [
      { id: 'horn-dual-blade', name: 'Dual Blade', type: 'horn', class: 'Beast' },
      { id: 'mouth-nut-cracker', name: 'Nut Cracker', type: 'mouth', class: 'Beast' },
      { id: 'back-ronin', name: 'Ronin', type: 'back', class: 'Beast' },
      { id: 'tail-hare', name: 'Hare', type: 'tail', class: 'Beast' }
    ]
  },
  {
    id: '8291',
    name: 'Deep Torrent',
    class: 'Aqua',
    image: getAxieImageUrl('8291'),
    specialType: 'Origin',
    level: 18,
    parts: [
      { id: 'horn-anemone', name: 'Anemone', type: 'horn', class: 'Aqua' },
      { id: 'mouth-risky-fish', name: 'Risky Fish', type: 'mouth', class: 'Aqua' },
      { id: 'back-goldfish', name: 'Goldfish', type: 'back', class: 'Aqua' },
      { id: 'tail-nimo', name: 'Nimo', type: 'tail', class: 'Aqua' }
    ]
  },
  {
    id: '94812',
    name: 'Solar Zephyr',
    class: 'Bird',
    image: getAxieImageUrl('94812'),
    specialType: 'Normal',
    level: 15,
    parts: [
      { id: 'horn-kestrel', name: 'Kestrel', type: 'horn', class: 'Bird' },
      { id: 'mouth-pigeon-post', name: 'Pigeon Post', type: 'mouth', class: 'Bird' },
      { id: 'back-tri-feather', name: 'Tri Feather', type: 'back', class: 'Bird' },
      { id: 'tail-post-fight', name: 'Post Fight', type: 'tail', class: 'Bird' }
    ]
  },
  {
    id: '100',
    name: 'Mystic Centurion #100',
    class: 'Beast',
    image: getAxieImageUrl('100'),
    specialType: 'Mystic',
    level: 30,
    parts: [
      { id: 'horn-bumpy', name: 'Bumpy', type: 'horn', class: 'Beast' },
      { id: 'mouth-axie-kiss', name: 'Axie Kiss', type: 'mouth', class: 'Beast' }
    ]
  },
  {
    id: '18502',
    name: 'Chrysalis Mech',
    class: 'Mech',
    image: getAxieImageUrl('18502'),
    specialType: 'Normal',
    level: 10,
    parts: [
      { id: 'horn-hero', name: 'Hero', type: 'horn', class: 'Beast' },
      { id: 'back-furball', name: 'Furball', type: 'back', class: 'Beast' }
    ]
  }
];

export class AxieNFTManager {
  private loadout: AxieLoadout = {
    slots: {
      pomodoro: null,
      kotaro: null,
      bing: null,
      tripp: null
    },
    visualMode: 'billboard_25d',
    roninAddress: null
  };

  private availableAxies: AxieNFT[] = [...DEMO_AXIES];
  private walletTotalAxies: number = 0;
  private onUpdateCallbacks: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public subscribe(cb: () => void): () => void {
    this.onUpdateCallbacks.push(cb);
    return () => {
      this.onUpdateCallbacks = this.onUpdateCallbacks.filter(c => c !== cb);
    };
  }

  private notify(): void {
    this.saveToStorage();
    this.onUpdateCallbacks.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Error in AxieNFTManager notify callback:', e);
      }
    });
  }

  public getLoadout(): AxieLoadout {
    return this.loadout;
  }

  public getAvailableAxies(): AxieNFT[] {
    return this.availableAxies;
  }

  public getWalletAxies(): AxieNFT[] {
    return this.availableAxies.filter(a => a.isCustom);
  }

  public getDemoAxies(): AxieNFT[] {
    return this.availableAxies.filter(a => !a.isCustom);
  }

  public getWalletTotalAxies(): number {
    return this.walletTotalAxies;
  }

  public hasMoreWalletAxies(): boolean {
    return this.getWalletAxies().length < this.walletTotalAxies;
  }

  public getAxieForTowerType(type: TowerType): AxieNFT | null {
    return this.loadout.slots[type] || null;
  }

  public setVisualMode(mode: VisualMode): void {
    this.loadout.visualMode = mode;
    this.notify();
  }

  public assignAxieToSlot(slot: TowerType, axie: AxieNFT | null): void {
    this.loadout.slots[slot] = axie;
    this.notify();
  }

  public clearSlot(slot: TowerType): void {
    this.loadout.slots[slot] = null;
    this.notify();
  }

  public resetToDefaults(): void {
    this.loadout.slots = {
      pomodoro: null,
      kotaro: null,
      bing: null,
      tripp: null
    };
    this.notify();
  }

  public loadDemoTeam(): void {
    this.loadout.slots = {
      pomodoro: DEMO_AXIES[0],
      kotaro: DEMO_AXIES[1],
      bing: DEMO_AXIES[2],
      tripp: DEMO_AXIES[3]
    };
    this.notify();
  }

  public isRoninInstalled(): boolean {
    const w = window as any;
    return !!(w.ronin?.provider || (w.ronin && typeof w.ronin.request === 'function') || w.ethereum?.isRonin);
  }

  public async connectRonin(): Promise<{ address: string; axieCount: number; axies: AxieNFT[] }> {
    const w = window as any;
    const provider = w.ronin?.provider || (w.ronin && typeof w.ronin.request === 'function' ? w.ronin : null) || (w.ethereum?.isRonin ? w.ethereum : null);

    if (!provider) {
      throw new Error('No se detectó la extensión Ronin Wallet. Puedes escribir tu dirección o cargar por ID.');
    }

    const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No se autorizó ninguna cuenta en Ronin Wallet.');
    }

    const { roninAddr } = normalizeRoninAddress(accounts[0]);
    this.loadout.roninAddress = roninAddr;

    // Fetch on-chain Axies
    const axies = await this.fetchAxiesForAddress(roninAddr);
    this.notify();
    return { address: roninAddr, axieCount: axies.length, axies };
  }

  public disconnectRonin(): void {
    this.loadout.roninAddress = null;
    this.walletTotalAxies = 0;
    this.notify();
  }

  public async refreshWalletAxies(): Promise<AxieNFT[]> {
    if (!this.loadout.roninAddress) {
      throw new Error('No hay ninguna billetera Ronin conectada para refrescar.');
    }
    return this.fetchAxiesForAddress(this.loadout.roninAddress, 0, 40);
  }

  public async fetchMoreWalletAxies(count: number = 40): Promise<AxieNFT[]> {
    if (!this.loadout.roninAddress) {
      throw new Error('No hay ninguna billetera conectada.');
    }
    const currentCount = this.getWalletAxies().length;
    return this.fetchAxiesForAddress(this.loadout.roninAddress, currentCount, count);
  }

  /**
   * Helper to perform raw RPC call to Ronin mainnet
   */
  private async callRoninRPC(method: string, params: any[]): Promise<any> {
    const resp = await fetch(RONIN_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    });
    if (!resp.ok) {
      throw new Error(`Ronin RPC HTTP ${resp.status}`);
    }
    const json = await resp.json();
    if (json.error) {
      throw new Error(json.error.message || 'Error en Ronin RPC');
    }
    return json.result;
  }

  /**
   * Worker pool to perform parallel RPC calls with concurrency control.
   * Note: Ronin RPC public endpoint returns HTTP 400 "Too many requests" if batch array has > 3 calls.
   * Concurrently executing single calls avoids this restriction completely and handles 50+ calls smoothly.
   */
  private async poolRoninRPC(calls: { id: number; method: string; params: any[] }[], concurrency: number = 5): Promise<any[]> {
    const results: any[] = [];
    let index = 0;
    const worker = async () => {
      while (index < calls.length) {
        const current = calls[index++];
        try {
          const res = await this.callRoninRPC(current.method, current.params);
          results.push({ id: current.id, result: res });
        } catch (err: any) {
          results.push({ id: current.id, error: err.message || 'Error en llamada RPC' });
        }
      }
    };
    const workers = Array.from({ length: Math.min(concurrency, calls.length) }, () => worker());
    await Promise.all(workers);
    return results;
  }

  /**
   * Decode Axie class from 512-bit genetics returned by getAxie(uint256)
   */
  private decodeAxieGenetics(rawHex: string): { axieClass: AxieClass; level: number; breedCount: number } {
    if (!rawHex || rawHex === '0x' || rawHex.length < 448) {
      return { axieClass: 'Plant', level: 1, breedCount: 0 };
    }

    const hex = rawHex.startsWith('0x') ? rawHex.slice(2) : rawHex;
    // Slot 3 (index 192..256): genes.x
    const genesXHex = hex.slice(192, 256);
    const breedCount = parseInt(hex.slice(320, 384), 16) || 0;
    const level = parseInt(hex.slice(384, 448), 16) || 1;

    // First nibble of genes.x indicates class
    const classCode = parseInt(genesXHex[0], 16);
    const classMap: Record<number, AxieClass> = {
      0: 'Beast',
      1: 'Bug',
      2: 'Bird',
      3: 'Plant',
      4: 'Aqua',
      5: 'Reptile',
      6: 'Mech',
      7: 'Dawn',
      8: 'Dusk'
    };

    const axieClass = classMap[classCode] || 'Plant';
    return { axieClass, level, breedCount };
  }

  /**
   * Fetch Axies directly from the Ronin Blockchain RPC (100% reliable, zero API keys, no 403 blocks)
   * Supports pagination via offset and count.
   */
  public async fetchAxiesForAddress(roninAddress: string, offset: number = 0, count: number = 40): Promise<AxieNFT[]> {
    const { cleanHex, paddedWord } = normalizeRoninAddress(roninAddress);
    if (!cleanHex || cleanHex.length < 40) {
      throw new Error('Dirección de Ronin no válida. Debe ser una dirección de 40 caracteres hexadecimales.');
    }

    try {
      // 1. Get Axie count: balanceOf(address) -> selector 0x70a08231
      const balHex = await this.callRoninRPC('eth_call', [
        { to: AXIE_CONTRACT, data: '0x70a08231' + paddedWord },
        'latest'
      ]);

      const totalOwned = parseInt(balHex, 16);
      this.walletTotalAxies = totalOwned;
      if (!totalOwned || totalOwned === 0) {
        return [];
      }

      // 2. Fetch token IDs using worker pool (concurrency 5)
      const limit = Math.min(Math.max(0, totalOwned - offset), count);
      if (limit <= 0) return [];

      const idCalls = [];
      for (let i = offset; i < offset + limit; i++) {
        const idxHex = i.toString(16).padStart(64, '0');
        idCalls.push({
          id: i + 1,
          method: 'eth_call',
          params: [{ to: AXIE_CONTRACT, data: '0x2f745c59' + paddedWord + idxHex }, 'latest']
        });
      }

      const idResults = await this.poolRoninRPC(idCalls, 5);
      const tokenIds: string[] = [];
      // Match each call by ID in order
      for (let i = 0; i < idCalls.length; i++) {
        const callId = idCalls[i].id;
        const resp = idResults.find(r => r && r.id === callId);
        if (resp && resp.result && resp.result !== '0x') {
          try {
            tokenIds.push(BigInt(resp.result).toString());
          } catch (e) {
            console.warn('Could not parse token ID:', resp.result);
          }
        }
      }

      if (tokenIds.length === 0) return [];

      // 3. Fetch details for each Axie in worker pool (concurrency 5)
      const detailCalls = tokenIds.map((tid, idx) => ({
        id: idx + 100,
        method: 'eth_call',
        params: [
          { to: AXIE_CONTRACT, data: '0xa6472906' + BigInt(tid).toString(16).padStart(64, '0') },
          'latest'
        ]
      }));

      const detailResults = await this.poolRoninRPC(detailCalls, 5);

      const fetchedAxies: AxieNFT[] = [];
      for (let i = 0; i < detailCalls.length; i++) {
        const callId = detailCalls[i].id;
        const tid = tokenIds[i];
        const resp = detailResults.find(d => d && d.id === callId);
        const rawData = resp?.result || '';
        const { axieClass, level, breedCount } = this.decodeAxieGenetics(rawData);

        fetchedAxies.push({
          id: tid,
          name: `Axie #${tid}`,
          class: axieClass,
          image: getAxieImageUrl(tid),
          specialType: parseInt(tid, 10) <= 4088 ? 'Origin' : 'Normal',
          level,
          breedCount,
          isCustom: true
        });
      }

      // Insert at the top of available Axies and refresh existing
      const existingMap = new Map(this.availableAxies.map(a => [a.id, a]));
      for (let i = fetchedAxies.length - 1; i >= 0; i--) {
        const fa = fetchedAxies[i];
        if (existingMap.has(fa.id)) {
          const ex = existingMap.get(fa.id)!;
          ex.image = fa.image;
          ex.class = fa.class;
          ex.level = fa.level;
          ex.breedCount = fa.breedCount;
        } else {
          this.availableAxies.unshift(fa);
          existingMap.set(fa.id, fa);
        }
      }

      this.notify();
      return fetchedAxies;
    } catch (err) {
      console.warn('Ronin on-chain Axie fetch error:', err);
      throw err;
    }
  }

  /**
   * Load either a single Axie ID OR an entire Ronin Address entered in the input field!
   */
  public async addAxieByIdOrAddress(input: string): Promise<AxieNFT[] | AxieNFT> {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Por favor introduce un ID de Axie (ej. 482910) o una dirección Ronin (ronin:... o 0x...).');
    }

    // Check if input is a Ronin/Ethereum wallet address
    const cleanLower = trimmed.toLowerCase();
    if (cleanLower.startsWith('ronin:') || cleanLower.startsWith('0x') || cleanLower.length >= 40) {
      const { roninAddr } = normalizeRoninAddress(trimmed);
      this.loadout.roninAddress = roninAddr;
      const axies = await this.fetchAxiesForAddress(roninAddr);
      this.notify();
      return axies;
    }

    // Otherwise, treat as numeric Axie ID
    const cleanId = trimmed.replace(/[^0-9]/g, '');
    if (!cleanId) {
      throw new Error('ID de Axie no válido. Debe ser numérico (ej. 5569467) o una dirección Ronin.');
    }

    // Check if already present
    const existing = this.availableAxies.find(a => a.id === cleanId);
    if (existing) {
      existing.image = getAxieImageUrl(cleanId);
      this.notify();
      return existing;
    }

    // Query on-chain getAxie(uint256)
    try {
      const idHex = BigInt(cleanId).toString(16).padStart(64, '0');
      const rawHex = await this.callRoninRPC('eth_call', [
        { to: AXIE_CONTRACT, data: '0xa6472906' + idHex },
        'latest'
      ]);

      const { axieClass, level, breedCount } = this.decodeAxieGenetics(rawHex);

      const newAxie: AxieNFT = {
        id: cleanId,
        name: `Axie #${cleanId}`,
        class: axieClass,
        image: getAxieImageUrl(cleanId),
        specialType: parseInt(cleanId, 10) <= 4088 ? 'Origin' : 'Normal',
        level,
        breedCount,
        isCustom: true
      };

      this.availableAxies.unshift(newAxie);
      this.notify();
      return newAxie;
    } catch (e) {
      // Fallback with official CDN
      const newAxie: AxieNFT = {
        id: cleanId,
        name: `Axie #${cleanId}`,
        class: 'Plant',
        image: getAxieImageUrl(cleanId),
        isCustom: true
      };
      this.availableAxies.unshift(newAxie);
      this.notify();
      return newAxie;
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_LOADOUT, JSON.stringify(this.loadout));
      const customAxies = this.availableAxies.filter(a => a.isCustom);
      localStorage.setItem(STORAGE_KEY_SAVED_AXIES, JSON.stringify(customAxies));
    } catch (e) {
      console.warn('Could not save loadout to localStorage:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      // Always sanitize default demo axie URLs
      this.availableAxies.forEach(a => {
        a.image = sanitizeAxieImageUrl(a.image, a.id);
      });

      const savedAxiesStr = localStorage.getItem(STORAGE_KEY_SAVED_AXIES);
      if (savedAxiesStr) {
        const savedAxies: AxieNFT[] = JSON.parse(savedAxiesStr);
        const existingIds = new Set(this.availableAxies.map(a => a.id));
        savedAxies.forEach(sa => {
          sa.image = sanitizeAxieImageUrl(sa.image, sa.id);
          if (!existingIds.has(sa.id)) {
            this.availableAxies.unshift(sa);
            existingIds.add(sa.id);
          }
        });
      }

      // Cuartel is in 'Under Construction' for v1.1 demo release.
      // Default all slots to null so the official 3D Starters (Pomodoro, Kotaro, Bing, Tripp) are active.
      this.loadout.slots = {
        pomodoro: null,
        kotaro: null,
        bing: null,
        tripp: null
      };
      this.loadout.visualMode = 'mascot_3d';
      try {
        localStorage.removeItem(STORAGE_KEY_LOADOUT);
      } catch (_) {}
    } catch (e) {
      console.warn('Could not load loadout from localStorage:', e);
    }
  }
}

export const axieNFTManager = new AxieNFTManager();
