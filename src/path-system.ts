import * as THREE from 'three';
import { PATH_ARCHETYPES } from './tower-defense-data';
import { GridCoord, PathArchetype } from './tower-defense-types';

export class PathSystem {
  public curve!: THREE.CatmullRomCurve3;
  public totalLength: number = 0;
  public currentArchetype!: PathArchetype;
  public currentWaypoints: THREE.Vector3[] = [];
  private curvePoints: THREE.Vector3[] = [];

  constructor() {
    this.generateRandomPath(0);
  }

  private buildFilletPoints(turns: GridCoord[]): THREE.Vector3[] {
    const cellSize = 0.8;
    const originX = -(46 * cellSize) / 2;
    const originZ = -(28 * cellSize) / 2;
    const gridToWorld = (col: number, row: number) => {
      return new THREE.Vector3(
        originX + (col + 0.5) * cellSize,
        0.18,
        originZ + (row + 0.5) * cellSize
      );
    };

    const R = 0.48; // Fillet radius in meters (smooth cornering for 1-tile wide road)
    const pts: THREE.Vector3[] = [];

    // First waypoint: West entrance
    pts.push(gridToWorld(turns[0].col, turns[0].row));

    for (let i = 1; i < turns.length - 1; i++) {
      const prev = gridToWorld(turns[i - 1].col, turns[i - 1].row);
      const curr = gridToWorld(turns[i].col, turns[i].row);
      const next = gridToWorld(turns[i + 1].col, turns[i + 1].row);

      const vIn = new THREE.Vector3().subVectors(curr, prev);
      const vOut = new THREE.Vector3().subVectors(next, curr);

      const lIn = vIn.length();
      const lOut = vOut.length();

      if (lIn < 0.001 || lOut < 0.001) {
        pts.push(curr);
        continue;
      }

      const uIn = vIn.clone().normalize();
      const uOut = vOut.clone().normalize();

      const r = Math.min(R, lIn * 0.45, lOut * 0.45);

      const pEnter = curr.clone().addScaledVector(uIn, -r);
      const pExit = curr.clone().addScaledVector(uOut, r);

      // Intermediate 45-degree bisector point for rounded corner
      const bisector = new THREE.Vector3().subVectors(uOut, uIn).normalize();
      const pMid = curr.clone().addScaledVector(bisector, r * 0.414);

      pts.push(pEnter);
      pts.push(pMid);
      pts.push(pExit);
    }

    // Last waypoint: East exit
    pts.push(gridToWorld(turns[turns.length - 1].col, turns[turns.length - 1].row));

    return pts;
  }

  public generateRandomPath(archetypeIndex?: number): PathArchetype {
    const idx = archetypeIndex !== undefined ? archetypeIndex : Math.floor(Math.random() * PATH_ARCHETYPES.length);
    const archetype = PATH_ARCHETYPES[idx] || PATH_ARCHETYPES[0];
    this.currentArchetype = archetype;

    const pts = this.buildFilletPoints(archetype.gridTurns);
    this.currentWaypoints = pts;
    // Centripetal catmullrom curve eliminates overshoot and oscillation on 90-degree corners
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    this.totalLength = this.curve.getLength();
    this.curvePoints = this.curve.getSpacedPoints(600);

    return archetype;
  }

  public getStartPosition(): THREE.Vector3 {
    return this.curve.getPointAt(0);
  }

  public getEndPosition(): THREE.Vector3 {
    return this.curve.getPointAt(1.0);
  }

  public getInitialTangent(): THREE.Vector3 {
    return this.curve.getTangentAt(0).normalize();
  }

  public getPositionAtDistance(distance: number): { position: THREE.Vector3; tangent: THREE.Vector3 } {
    const u = Math.min(1.0, Math.max(0.0, distance / this.totalLength));
    const position = this.curve.getPointAt(u);
    const tangent = this.curve.getTangentAt(u).normalize();
    return { position, tangent };
  }

  public isNearPath(pos: THREE.Vector3, threshold: number = 2.0): boolean {
    const thresholdSq = threshold * threshold;
    const px = pos.x;
    const pz = pos.z;

    for (let i = 0; i < this.curvePoints.length - 1; i++) {
      const p1 = this.curvePoints[i];
      const p2 = this.curvePoints[i + 1];

      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const lenSq = dx * dx + dz * dz;

      let t = 0;
      if (lenSq > 0.0001) {
        t = Math.max(0, Math.min(1, ((px - p1.x) * dx + (pz - p1.z) * dz) / lenSq));
      }

      const closestX = p1.x + t * dx;
      const closestZ = p1.z + t * dz;

      const distSq = (px - closestX) * (px - closestX) + (pz - closestZ) * (pz - closestZ);
      if (distSq < thresholdSq) {
        return true;
      }
    }
    return false;
  }

  public createVisualPath(_camera?: THREE.Camera): THREE.Group {
    // Road visuals are rendered directly as 3D beveled tiles by GridSystem.createBoardMesh()
    return new THREE.Group();
  }
}
