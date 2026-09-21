import * as THREE from 'three';

export enum CellType {
  GRASS = 0,
  PATH = 1,
  OBSTACLE = 2,
  TOWER = 3
}

export interface GridCell {
  col: number;
  row: number;
  type: CellType;
  towerId: string | null;
}

export class GridSystem {
  public readonly cols: number;
  public readonly rows: number;
  public readonly cellSize: number;
  public readonly originX: number;
  public readonly originZ: number;

  public cells: GridCell[][];
  private boardGroup: THREE.Group | null = null;
  private highlightGroup: THREE.Group | null = null;
  private highlightBoxes: THREE.Mesh[] = [];

  constructor(cols: number = 46, rows: number = 28, cellSize: number = 0.8) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.originX = -(cols * cellSize) / 2;
    this.originZ = -(rows * cellSize) / 2;

    this.cells = [];
    this.resetGrid();
  }

  public resetGrid(): void {
    this.cells = [];
    for (let r = 0; r < this.rows; r++) {
      const row: GridCell[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({
          col: c,
          row: r,
          type: CellType.GRASS,
          towerId: null
        });
      }
      this.cells.push(row);
    }
  }

  public gridToWorld(col: number, row: number): THREE.Vector3 {
    return new THREE.Vector3(
      this.originX + (col + 0.5) * this.cellSize,
      0.18,
      this.originZ + (row + 0.5) * this.cellSize
    );
  }

  public worldToGrid(x: number, z: number): { col: number; row: number } | null {
    const col = Math.floor((x - this.originX) / this.cellSize);
    const row = Math.floor((z - this.originZ) / this.cellSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return null;
    }
    return { col, row };
  }

  public canPlaceTower(centerCol: number, centerRow: number, size: number = 3): boolean {
    const isEven = (size % 2 === 0);
    const startX = isEven ? 0 : -Math.floor(size / 2);
    const endX = isEven ? size - 1 : Math.floor(size / 2);
    const startY = isEven ? 0 : -Math.floor(size / 2);
    const endY = isEven ? size - 1 : Math.floor(size / 2);

    for (let dy = startY; dy <= endY; dy++) {
      for (let dx = startX; dx <= endX; dx++) {
        const c = centerCol + dx;
        const r = centerRow + dy;
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) {
          return false;
        }
        if (this.cells[r][c].type !== CellType.GRASS) {
          return false;
        }
      }
    }
    return true;
  }

  public occupyTower(centerCol: number, centerRow: number, towerId: string, size: number = 3): void {
    const isEven = (size % 2 === 0);
    const startX = isEven ? 0 : -Math.floor(size / 2);
    const endX = isEven ? size - 1 : Math.floor(size / 2);
    const startY = isEven ? 0 : -Math.floor(size / 2);
    const endY = isEven ? size - 1 : Math.floor(size / 2);

    for (let dy = startY; dy <= endY; dy++) {
      for (let dx = startX; dx <= endX; dx++) {
        const c = centerCol + dx;
        const r = centerRow + dy;
        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
          this.cells[r][c].type = CellType.TOWER;
          this.cells[r][c].towerId = towerId;
        }
      }
    }
  }

  public freeTower(towerId: string): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].towerId === towerId) {
          this.cells[r][c].type = CellType.GRASS;
          this.cells[r][c].towerId = null;
        }
      }
    }
  }

  public markOrthogonalPath(turns: { col: number; row: number }[], width: number = 3): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].type === CellType.PATH) {
          this.cells[r][c].type = CellType.GRASS;
        }
      }
    }

    const half = Math.floor(width / 2);

    for (let i = 0; i < turns.length - 1; i++) {
      const t1 = turns[i];
      const t2 = turns[i + 1];

      const rMin = Math.min(t1.row, t2.row);
      const rMax = Math.max(t1.row, t2.row);
      const cMin = Math.min(t1.col, t2.col);
      const cMax = Math.max(t1.col, t2.col);

      for (let r = rMin; r <= rMax; r++) {
        for (let c = cMin; c <= cMax; c++) {
          for (let dr = -half; dr <= half; dr++) {
            for (let dc = -half; dc <= half; dc++) {
              const cr = r + dr;
              const cc = c + dc;
              if (cr >= 0 && cr < this.rows && cc >= 0 && cc < this.cols) {
                this.cells[cr][cc].type = CellType.PATH;
              }
            }
          }
        }
      }
    }
  }

  public markPathFromCurve(curve: THREE.CatmullRomCurve3, radius: number = 1.15): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].type === CellType.PATH) {
          this.cells[r][c].type = CellType.GRASS;
        }
      }
    }

    const pts = curve.getSpacedPoints(360);
    const radiusSq = radius * radius;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const world = this.gridToWorld(c, r);
        let isPath = false;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const dx = world.x - p.x;
          const dz = world.z - p.z;
          if (dx * dx + dz * dz <= radiusSq) {
            isPath = true;
            break;
          }
        }
        if (isPath) {
          this.cells[r][c].type = CellType.PATH;
        }
      }
    }
  }

  public markObstacleCell(col: number, row: number): void {
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      if (this.cells[row][col].type !== CellType.PATH) {
        this.cells[row][col].type = CellType.OBSTACLE;
      }
    }
  }

  public createBoardMesh(): THREE.Group {
    this.boardGroup = new THREE.Group();

    const boardW = this.cols * this.cellSize;
    const boardD = this.rows * this.cellSize;
    const frameThickness = 0.55;
    const frameHeight = 0.35;

    // Outer Tray Box
    const trayGeom = new THREE.BoxGeometry(boardW + frameThickness * 2, frameHeight, boardD + frameThickness * 2);
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.8,
      metalness: 0.15
    });
    const trayMesh = new THREE.Mesh(trayGeom, trayMat);
    trayMesh.position.set(0, -frameHeight / 2, 0);
    trayMesh.receiveShadow = true;
    this.boardGroup.add(trayMesh);

    // Golden/brass trim along edge
    const trimGeom = new THREE.BoxGeometry(boardW + 0.1, 0.04, boardD + 0.1);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.7,
      roughness: 0.3
    });
    const trimMesh = new THREE.Mesh(trimGeom, trimMat);
    trimMesh.position.set(0, 0.01, 0);
    this.boardGroup.add(trimMesh);

    let grassCount = 0;
    let pathCount = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].type === CellType.PATH) pathCount++;
        else grassCount++;
      }
    }

    const tileW = this.cellSize - 0.04;
    const tileH = 0.22;
    const tileGeom = new THREE.BoxGeometry(tileW, tileH, tileW);

    // Premium Stylized Grass Material
    const grassMat = new THREE.MeshStandardMaterial({
      roughness: 0.82,
      metalness: 0.02
    });
    const grassInstanced = new THREE.InstancedMesh(tileGeom, grassMat, Math.max(1, grassCount));
    grassInstanced.receiveShadow = true;

    // Stylized Ancient Lunacia Cobblestone Road
    const pathMat = new THREE.MeshStandardMaterial({
      roughness: 0.65,
      metalness: 0.08
    });
    const pathInstanced = new THREE.InstancedMesh(tileGeom, pathMat, Math.max(1, pathCount));
    pathInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    
    // 4-tone Lush Forest Grass Palette
    const grassPalette = [
      new THREE.Color(0x163824), // Vibrant emerald shade
      new THREE.Color(0x1a422b), // Fresh Lunacia green
      new THREE.Color(0x122e1e), // Deep shadowed moss
      new THREE.Color(0x1e4a31)  // Sunlit meadow highlight
    ];

    // 3-tone Cobblestone Path Palette
    const pathPalette = [
      new THREE.Color(0xd4c2a5), // Warm sunbaked paver
      new THREE.Color(0xbfae93), // Weathered limestone
      new THREE.Color(0xab9a80)  // Earthy shadowed cobblestone
    ];

    let grassIdx = 0;
    let pathIdx = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        const world = this.gridToWorld(c, r);

        // Subtle organic height offset to break flat monotony
        const isPath = cell.type === CellType.PATH;
        const subtleH = isPath ? 0.02 : ((Math.sin(c * 0.7) * Math.cos(r * 0.7)) * 0.03);

        dummy.position.set(world.x, (tileH / 2) + subtleH, world.z);
        dummy.updateMatrix();

        if (isPath) {
          pathInstanced.setMatrixAt(pathIdx, dummy.matrix);
          const pTone = pathPalette[(c * 3 + r * 7) % pathPalette.length];
          pathInstanced.setColorAt(pathIdx, pTone);
          pathIdx++;
        } else {
          grassInstanced.setMatrixAt(grassIdx, dummy.matrix);
          const gTone = grassPalette[(c * 5 + r * 11) % grassPalette.length];
          grassInstanced.setColorAt(grassIdx, gTone);
          grassIdx++;
        }
      }
    }

    grassInstanced.instanceMatrix.needsUpdate = true;
    if (grassInstanced.instanceColor) grassInstanced.instanceColor.needsUpdate = true;
    pathInstanced.instanceMatrix.needsUpdate = true;
    if (pathInstanced.instanceColor) pathInstanced.instanceColor.needsUpdate = true;

    this.boardGroup.add(grassInstanced);
    this.boardGroup.add(pathInstanced);

    this.setupHighlightGroup(tileW);

    return this.boardGroup;
  }

  private setupHighlightGroup(tileW: number): void {
    this.highlightGroup = new THREE.Group();
    this.highlightBoxes = [];

    const highlightGeom = new THREE.PlaneGeometry(tileW, tileW);
    highlightGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < 9; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(highlightGeom, mat);
      mesh.position.y = 0.19;
      this.highlightGroup.add(mesh);
      this.highlightBoxes.push(mesh);
    }

    this.highlightGroup.visible = false;
    if (this.boardGroup) {
      this.boardGroup.add(this.highlightGroup);
    }
  }

  public updateHighlight(centerCol: number | null, centerRow: number | null, isValid: boolean, size: number = 3): void {
    if (!this.highlightGroup) return;

    if (centerCol === null || centerRow === null) {
      this.highlightGroup.visible = false;
      return;
    }

    this.highlightGroup.visible = true;

    // Support both odd (size=3, offset -1..1) and even (size=2, offset 0..1) footprints
    const isEven = (size % 2 === 0);
    const startX = isEven ? 0 : -Math.floor(size / 2);
    const endX = isEven ? size - 1 : Math.floor(size / 2);
    const startY = isEven ? 0 : -Math.floor(size / 2);
    const endY = isEven ? size - 1 : Math.floor(size / 2);

    let boxIdx = 0;
    for (let dy = startY; dy <= endY; dy++) {
      for (let dx = startX; dx <= endX; dx++) {
        const c = centerCol + dx;
        const r = centerRow + dy;
        const box = this.highlightBoxes[boxIdx++];
        if (!box) continue;

        box.visible = true;
        const isWithinBounds = c >= 0 && c < this.cols && r >= 0 && r < this.rows;
        const isGrass = isWithinBounds && this.cells[r][c].type === CellType.GRASS;

        // Individual cell color: Green if this specific cell is free grass, Red if this cell is path/rock/tower
        const cellColor = isGrass ? 0x10b981 : 0xef4444;
        const mat = box.material as THREE.MeshBasicMaterial;
        mat.color.setHex(cellColor);
        mat.opacity = isGrass ? 0.40 : 0.75; // More vibrant red for blocked obstacle/path cells

        const world = this.gridToWorld(c, r);
        box.position.set(world.x, 0.19, world.z);
      }
    }

    // Hide any remaining highlight boxes outside this footprint
    for (let i = boxIdx; i < this.highlightBoxes.length; i++) {
      this.highlightBoxes[i].visible = false;
    }
  }

  public hideHighlight(): void {
    if (this.highlightGroup) {
      this.highlightGroup.visible = false;
    }
  }
}
