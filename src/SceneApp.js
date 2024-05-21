import {
  GL,
  Draw,
  Geom,
  Mesh,
  Object3D,
  ShaderLibs,
  FboPingPong,
  DrawBall,
  DrawAxis,
  DrawCopy,
  Scene,
} from "./alfrid";
import Assets from "./Assets";
import resize from "./utils/resize";
import Scheduler from "scheduling";
import { random, saveImage, getDateString } from "./utils";
import vsPass from "./shaders/pass.vert";
import fsSim from "./shaders/sim.frag";

import Config from "./Config";

import fsSave from "./shaders/save.frag";

import vsRender from "./shaders/render.vert";
import fsRender from "./shaders/render.frag";

let hasSaved = false;
let canSave = false;

class SceneApp extends Scene {
  constructor() {
    super();

    // this.orbitalControl.lock();
    this._seed = random(10000);
    this.container = new Object3D();
    this.changeCamera = false;

    this.resize();
  }

  _initTextures() {
    const { numParticles: num } = Config;
    const numOfTargets = 4;
    this._fbo = new FboPingPong(
      num,
      num,
      {
        type: GL.FLOAT,
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
    const data = [];
    // instancing
    for (let j = 0; j < num; j++) {
      for (let i = 0; i < num; i++) {
        uv.push([i / num, j / num]);
        extra.push([random(), random(), random()]);
        data.push([random(1), random(1), random(1)]);
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
    this._drawSim
      .bindFrameBuffer(this._fbo.write)
      .bindTexture("uPosMap", this._fbo.read.getTexture(0), 0)
      .bindTexture("uVelMap", this._fbo.read.getTexture(1), 1)
      .bindTexture("uExtraMap", this._fbo.read.getTexture(2), 2)
      .bindTexture("uPosOrgMap", this._fbo.read.getTexture(3), 3)
      .uniform("uTime", Scheduler.getElapsedTime() + this._seed)
      .uniform("uNoiseScale", Config.noiseScale)
      .uniform("uNoiseStrength", Config.noiseStrength)
      .uniform("uFlowSpeed", Config.flowSpeed)
      .uniform("uAccX", Config.acc_X)
      .uniform("uAccY", Config.acc_Y)
      .draw();
    this._fbo.swap();
  }

  render() {
    let g = 0.1;
    GL.clear(g, g, g, 1);

    GL.setMatrices(this.camera);
    GL.setModelMatrix(this.container.matrix);

    this._drawParticles
      .bindTexture("uPosMap", this._fbo.read.texture, 0)
      .bindTexture("uParticleMap", Assets.get("particle"), 1)
      .bindTexture("uExtraMap", this._fbo.read.getTexture(2), 2)
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
  }
}

export default SceneApp;
