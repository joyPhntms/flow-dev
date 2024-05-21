import { GL } from "../alfrid";

import * as dat from "dat.gui";
import Config from "../Config";
import Settings from "../Settings";
import { saveJson } from "./";

export default (scene) => {
  const { refresh, reload } = Settings;
  const oControl = {
    save: () => {
      saveJson(Config, "Settings");
    },
  };

  const gui = new dat.GUI({ width: 200 });
  window.gui = gui;

  const fSystem = gui.addFolder("System");
  fSystem.add(Config, "lockCamera").onFinishChange(refresh);
  fSystem.add(Settings, "refresh").name("RESTART");
  fSystem.add(oControl, "save").name("Save Settings");
  fSystem.add(Settings, "reset").name("Reset Default");
  fSystem.open();

  const fBasic = gui.addFolder("Basic");
  fBasic.add(Config, "posX", -10, 10, 0.01).onFinishChange(refresh);
  fBasic.add(Config, "posY", -10, 10, 0.01).onFinishChange(refresh);
  fBasic.open();

  const fParticle = gui.addFolder("Particles");
  fParticle
    .add(
      Config,
      "numParticles",
      [128, 256, 300, 400, 500, 600, 650, 700, 750, 800, 850, 900, 950, 1000]
    )
    .onFinishChange(reload);
  fParticle.add(Config, "flowSpeed", 0.1, 4, 0.01).onFinishChange(refresh);
  fParticle.add(Config, "particleSize", 0.1, 10, 0.01).onFinishChange(refresh);
  fParticle.add(Config, "acc_X", -5, 5, 0.01).onFinishChange(refresh);
  fParticle.add(Config, "acc_Y", -5, 5, 0.01).onFinishChange(refresh);
  fParticle.add(Config, "noiseScale", 0.1, 2, 0.01).onFinishChange(refresh);
  fParticle.add(Config, "noiseStrength", 0.0, 4, 0.01).onFinishChange(refresh);
  fParticle.open();

  const fColor = gui.addFolder("Colors");
  fColor.add(Config, "brightness", 0.1, 5, 0.01).onFinishChange(refresh);
  fColor.addColor(Config, "color1").onFinishChange(refresh);
  fColor.addColor(Config, "color2").onFinishChange(refresh);
  fColor.addColor(Config, "color3").onFinishChange(refresh);
  fColor.addColor(Config, "color4").onFinishChange(refresh);
  fColor.addColor(Config, "color5").onFinishChange(refresh);
  fColor.add(Config, "colorEdge1", 0, 1, 0.01).onFinishChange(refresh);
  fColor.add(Config, "colorEdge2", 0, 1, 0.01).onFinishChange(refresh);
  fColor.add(Config, "colorEdge3", 0, 1, 0.01).onFinishChange(refresh);
  fColor.add(Config, "colorEdge4", 0, 1, 0.01).onFinishChange(refresh);
  fColor.open();
};
