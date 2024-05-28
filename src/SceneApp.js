import {
  GL,
  Draw,
  Geom,
  Mesh,
  Object3D,
  FboPingPong,
  DrawBall,
  DrawAxis,
  DrawCopy,
  Scene,
  HitTestor,
} from "./alfrid";
import Assets from "./Assets";
import resize from "./utils/resize";
import Scheduler from "scheduling";
import { random, saveImage, getDateString } from "./utils";
import vsPass from "./shaders/pass.vert";
import fsSim from "./shaders/sim.frag";
import { iOS, smoothstep } from "./utils";
import { isMobile } from "./alfrid/utils";
import Config from "./Config";
import { vec2, vec3, mat4 } from "gl-matrix";

import fsSave from "./shaders/save.frag";

import vsRender from "./shaders/render.vert";
import fsRender from "./shaders/render.frag";

let hasSaved = false;
let canSave = false;
const hitPlaneSize = 14;

class SceneApp extends Scene {
  constructor() {
    super();

    // this.orbitalControl.lock();
    this._seed = random(10000);
    this.container = new Object3D();
    this.changeCamera = false;

    // interaction
    this._hit = [0, 0, 0];
    this._preHit = [0, 0, 0];

    this.meshHit = Geom.plane(hitPlaneSize, (hitPlaneSize / 16) * 10, 1);

    this.hitTestor = new HitTestor(this.meshHit, this.camera);
    this.needUpdateHit = false;
    this.hitTestor.on("onHit", (e) => {
      vec3.copy(this._preHit, this._hit);
      vec3.copy(this._hit, e.hit);
      this.needUpdateHit = true;
    });

    this.mouseStrength = 0;
    this.tThreshold = 0;
    this.tIndex = 0;

    if (!isMobile) {
      window.addEventListener("mousedown", (e) => this._onDown(e));
      window.addEventListener("mouseup", (e) => this._onUp(e));
      this.addTextureMode = 0;
    } else {
      this.addTextureMode = 1;
    }

    this.resize();
  }
  _onDown(e) {
    //console.log("down");
    this.activateColor();
  }
  _onUp(e) {
    //console.log("up");
    this.stopColor();
  }
  activateColor() {
    this.addTextureMode = 1;
  }
  stopColor() {
    this.addTextureMode = 0;
  }

  _initTextures() {
    const { numParticles: num } = Config;
    const numOfTargets = 5;
    const type = iOS ? GL.HALF_FLOAT : GL.FLOAT;
    this._fbo = new FboPingPong(
      num,
      num,
      {
        type: type,
        minFilter: GL.NEAREST,
        magFilter: GL.NEAREST,
      },
      numOfTargets
    );
  }

  _initViews() {
    const { numParticles: num } = Config;
    this._dAxis = new DrawAxis();
    this._dCopy = new DrawCopy();
    this._dBall = new DrawBall();

    const s = 0.02;

    let colorUniform = [];
    const colorTheme = [
      [12, 75, 96],
      [13, 80, 111],
      [72, 163, 192],
      [125, 199, 204],
      [205, 179, 128],
    ];

    colorTheme.forEach((c) => {
      colorUniform.push(c[0], c[1], c[2]);
    });
    colorUniform = colorUniform.map((v) => v / 255);

    const uv = [];
    const extra = [];
    // instancing
    for (let j = 0; j < num; j++) {
      for (let i = 0; i < num; i++) {
        uv.push([i / num, j / num]);
        extra.push([random(), random(), random()]);
      }
    }

    const drawSave = new Draw()
      .setMesh(Geom.bigTriangle())
      .useProgram(vsPass, fsSave);

    this._fbo.write.bind();
    GL.clear(0, 0, 0, 0);
    drawSave.uniform("uSeed", random(1000)).draw();
    this._fbo.write.unbind();
    this._fbo.swap();

    const meshPoint = new Mesh(GL.POINTS)
      .bufferVertex(extra)
      .bufferTexCoord(uv);

    this._drawParticles = new Draw()
      .setMesh(meshPoint)
      .useProgram(vsRender, fsRender)
      .uniform("uColors", "vec3", colorUniform)
      .uniform("uColorSeed", random(1));

    this._drawSim = new Draw()
      .setMesh(Geom.bigTriangle())
      .useProgram(vsPass, fsSim)
      .setClearColor(0, 0, 0, 1);
  }

  update() {
    if (this.needUpdateHit) {
      //real time direction
      const _dir = [0, 0, 0];
      vec3.sub(_dir, this._hit, this._preHit);
      const dir = [_dir[0], _dir[1]];

      //real time distance
      const minRadius = 1;
      const dist = vec2.length(dir);

      if (dist > 0) {
        let d = smoothstep(0, 0.5, dist);
        this.mouseStrength = d;
      } else {
        this.mouseStrength = 0;
      }

      //console.log("mouseStrength", this.mouseStrength);
    }
    if (this.addTextureMode == 1) {
      if (this._hit[0] < 0) {
        this.tThreshold = smoothstep(
          0,
          (-hitPlaneSize / 2) * 0.5,
          this._hit[0]
        );
        this.tIndex = 0;
      } else {
        this.tThreshold = smoothstep(0, (hitPlaneSize / 2) * 0.5, this._hit[0]);
        this.tIndex = 1;
      }
    }
    this._drawSim
      .bindFrameBuffer(this._fbo.write)
      .bindTexture("uPosMap", this._fbo.read.getTexture(0), 0)
      .bindTexture("uVelMap", this._fbo.read.getTexture(1), 1)
      .bindTexture("uExtraMap", this._fbo.read.getTexture(2), 2)
      .bindTexture("uPosOrgMap", this._fbo.read.getTexture(3), 3)
      .bindTexture("uColorMap", this._fbo.read.getTexture(4), 4)
      .uniform("uTime", Scheduler.getElapsedTime() + this._seed)
      .uniform("uNoiseScale", Config.noiseScale)
      .uniform("uNoiseStrength", Config.noiseStrength)
      .uniform("uFlowSpeed", Config.flowSpeed)
      .uniform("uAccX", Config.acc_X)
      .uniform("uAccY", Config.acc_Y)
      .uniform("mousePos", this._hit)
      .uniform("mousePrev", this._preHit)
      .uniform("mouseRadius", Config.mouseRadius)
      .uniform("mouseForce", Config.mouseForce)
      .uniform("mouseStrength", this.mouseStrength)
      .uniform("uPosOffset", [Config.posX, Config.posY, 1.0])
      .uniform("minVolume", Config.minVolume)
      .uniform("maxVolume", Config.maxVolume)
      .uniform("newColorStrength", Config.strength)
      .uniform("randomLevel", Config.randomLevel)
      .draw();
    this._fbo.swap();
  }

  render() {
    let g = 0;
    GL.clear(g, g, g, 1);

    GL.setMatrices(this.camera);
    GL.setModelMatrix(this.container.matrix);

    this._drawParticles
      .bindTexture("uPosMap", this._fbo.read.getTexture(0), 0)
      .bindTexture("uParticleMap", Assets.get("particle"), 1)
      .bindTexture("uExtraMap", this._fbo.read.getTexture(2), 2)
      .bindTexture("uColorMap", this._fbo.read.getTexture(4), 3)
      .bindTexture("uTextureMap1", Assets.get("artwork01"), 4)
      .bindTexture("uTextureMap2", Assets.get("artwork02"), 5)
      .uniform("uViewport", [GL.width, GL.height])
      .uniform("uParticleSize", Config.particleSize)
      .uniform("uBrightness", Config.brightness)
      .uniform("uColorEdge1", Config.colorEdge1)
      .uniform("uColorEdge2", Config.colorEdge2)
      .uniform("uColorEdge3", Config.colorEdge3)
      .uniform("uColorEdge4", Config.colorEdge4)
      .uniform(
        "uColors[0]",
        Config.color1.map((v) => v / 255)
      )
      .uniform(
        "uColors[1]",
        Config.color2.map((v) => v / 255)
      )
      .uniform(
        "uColors[2]",
        Config.color3.map((v) => v / 255)
      )
      .uniform(
        "uColors[3]",
        Config.color4.map((v) => v / 255)
      )
      .uniform(
        "uColors[4]",
        Config.color5.map((v) => v / 255)
      )
      .uniform("uPosOffset", [Config.posX, Config.posY, 1.0])
      .uniform(
        "colorL",
        Config.colorL.map((v) => v / 255)
      )
      .uniform(
        "colorR",
        Config.colorR.map((v) => v / 255)
      )
      .uniform("cParticleSize", Config.new_Pscale)
      .uniform("onAddTexture", this.addTextureMode)
      .uniform("tThreshold", this.tThreshold)
      .uniform("tIndex", this.tIndex)
      .draw();

    if (Config.lockCamera) {
      if (!this.changeCamera) {
        this.orbitalControl.lock();
        this.changeCamera = true;
      }
    } else {
      if (this.changeCamera) {
        this.orbitalControl._isLockZoom = false;
        this.orbitalControl._isLockRotation = false;
        this.changeCamera = false;
      }
    }

    if (canSave && !hasSaved && Config.autoSave) {
      saveImage(GL.canvas, getDateString());
      hasSaved = true;
    }
  }

  resize() {
    const { innerWidth: w, innerHeight: h, devicePixelRatio } = window;
    const canvasScale = 2;
    let s = Math.max(canvasScale, devicePixelRatio);
    s = 1;
    const width = w;
    const height = h;
    resize(GL.canvas, width * s, height * s, GL);
    this.camera.setAspectRatio(GL.aspectRatio);

    this.hitTestor = new HitTestor(this.meshHit, this.camera);
    this.needUpdateHit = false;
    this.hitTestor.on("onHit", (e) => {
      vec3.copy(this._preHit, this._hit);
      vec3.copy(this._hit, e.hit);
      this.needUpdateHit = true;
    });
  }
}

export default SceneApp;
