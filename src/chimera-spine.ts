import * as THREE from 'three';
import * as PIXI from 'pixi.js';
import { TextureAtlas } from '@pixi-spine/base';
import { AtlasAttachmentLoader, SkeletonBinary, Spine } from '@pixi-spine/runtime-3.8';

export interface ChimeraSpineInstance {
  mesh: THREE.Mesh;
  update: (delta: number) => void;
  destroy: () => void;
}

export class ChimeraSpineManager {
  private static skeletonDataCache: Map<string, any> = new Map();

  public static async loadChimera(chimeraName: string = 'alpha-wolf'): Promise<any> {
    if (this.skeletonDataCache.has(chimeraName)) {
      return this.skeletonDataCache.get(chimeraName);
    }
    const basePath = `./assets/origins_official/chimeras_enemies/${chimeraName}`;
    const [atlasRes, skelRes] = await Promise.all([
      fetch(`${basePath}.atlas`).then(r => r.text()),
      fetch(`${basePath}.skel`).then(r => r.arrayBuffer())
    ]);
    const pngUrl = `${basePath}.png`;
    const baseTexture = PIXI.BaseTexture.from(pngUrl);
    await new Promise((resolve) => {
      if (baseTexture.valid) resolve(true);
      else baseTexture.once('loaded', () => resolve(true));
    });
    const atlas = new TextureAtlas(atlasRes, (_line, callback) => {
      callback(baseTexture as any);
    });
    const attachmentLoader = new AtlasAttachmentLoader(atlas);
    const binaryLoader = new SkeletonBinary(attachmentLoader);
    const skeletonData = binaryLoader.readSkeletonData(new Uint8Array(skelRes));
    this.skeletonDataCache.set(chimeraName, skeletonData);
    return skeletonData;
  }

  public static createChimeraMesh(
    skeletonData: any,
    defaultAnimation: string = 'action/move-forward'
  ): ChimeraSpineInstance {
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = 512;
    renderCanvas.height = 512;
    const renderer = new PIXI.Renderer({
      view: renderCanvas,
      width: 512,
      height: 512,
      backgroundAlpha: 0,
      antialias: true
    });
    const stage = new PIXI.Container();
    const spineObj = new Spine(skeletonData);
    spineObj.x = 256;
    spineObj.y = 440;
    spineObj.scale.set(0.65, 0.65);
    const anims = spineObj.state.data.skeletonData.animations;
    const animName = anims.some((a: any) => a.name === defaultAnimation) ? defaultAnimation : anims[0]?.name;
    if (animName) {
      spineObj.state.setAnimation(0, animName, true);
    }
    stage.addChild(spineObj as any);
    const canvasTexture = new THREE.CanvasTexture(renderCanvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    const planeW = 2.6;
    const planeH = 2.6;
    const planeGeom = new THREE.PlaneGeometry(planeW, planeH);
    planeGeom.translate(0, planeH / 2, 0);
    const planeMat = new THREE.MeshStandardMaterial({
      map: canvasTexture,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(planeGeom, planeMat);
    mesh.castShadow = true;
    const update = (delta: number) => {
      spineObj.update(delta);
      renderer.render(stage);
      canvasTexture.needsUpdate = true;
    };
    const destroy = () => {
      renderer.destroy(true);
      canvasTexture.dispose();
      planeGeom.dispose();
      planeMat.dispose();
    };
    return { mesh, update, destroy };
  }
}
