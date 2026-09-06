import * as THREE from 'three';
import { PATH_WAYPOINTS } from './tower-defense-data';

export class PathSystem {
  public curve: THREE.CatmullRomCurve3;
  public totalLength: number;

  constructor() {
    this.curve = new THREE.CatmullRomCurve3(PATH_WAYPOINTS, false, 'catmullrom', 0.2);
    this.totalLength = this.curve.getLength();
  }

  public getPositionAtDistance(distance: number): { position: THREE.Vector3; tangent: THREE.Vector3 } {
    const u = Math.min(1.0, Math.max(0.0, distance / this.totalLength));
    const position = this.curve.getPointAt(u);
    const tangent = this.curve.getTangentAt(u);
    return { position, tangent };
  }

  public createVisualPath(): THREE.Group {
    const group = new THREE.Group();
    const points = this.curve.getPoints(120);

    // Path surface geometry
    const pathShape = new THREE.Shape();
    const width = 2.4;
    pathShape.moveTo(-width / 2, 0);
    pathShape.lineTo(width / 2, 0);

    const extrudeSettings = {
      steps: 120,
      bevelEnabled: false,
      extrudePath: this.curve
    };

    // A stylish cobblestone path
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const u = i / (points.length - 1);
      const tangent = this.curve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const left = p.clone().addScaledVector(normal, -width / 2);
      const right = p.clone().addScaledVector(normal, width / 2);

      left.y = 0.04;
      right.y = 0.04;

      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);

      normals.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, u * 15, 1, u * 15);
    }

    const indices: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate cobblestone
      roughness: 0.8,
      metalness: 0.1
    });

    const pathMesh = new THREE.Mesh(geom, mat);
    pathMesh.receiveShadow = true;
    group.add(pathMesh);

    // Stone borders along path
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9
    });

    for (let i = 0; i < points.length; i += 3) {
      const p = points[i];
      const u = i / (points.length - 1);
      const tangent = this.curve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const stoneGeom = new THREE.BoxGeometry(0.35, 0.25, 0.45);

      const leftStone = new THREE.Mesh(stoneGeom, borderMat);
      leftStone.position.copy(p).addScaledVector(normal, -(width / 2 + 0.15));
      leftStone.position.y = 0.1;
      leftStone.rotation.y = Math.atan2(tangent.x, tangent.z);
      group.add(leftStone);

      const rightStone = new THREE.Mesh(stoneGeom, borderMat);
      rightStone.position.copy(p).addScaledVector(normal, width / 2 + 0.15);
      rightStone.position.y = 0.1;
      rightStone.rotation.y = Math.atan2(tangent.x, tangent.z);
      group.add(rightStone);
    }

    return group;
  }
}
