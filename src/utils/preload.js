// preload.js
import assets from "../asset-list";
import Assets from "../Assets";
import AssetsLoader from "assets-loader";

const loadAssets = (mAssetsPath) =>
  new Promise((resolve, reject) => {
    const loader = document.body.querySelector(".Loading-Bar");
    // console.log("mAssetsPath", mAssetsPath);
    // console.table(assets);
    const mappedAssets = assets.map(({ id, url: urlOrg, type }) => {
      const url = mAssetsPath + urlOrg;
      return {
        id,
        url,
        type,
      };
    });
    // console.table(mappedAssets);
    if (assets.length > 0) {
      document.body.classList.add("isLoading");

      new AssetsLoader({
        assets: mappedAssets,
      })
        .on("error", (error) => {
          console.log("Error :", error);
        })
        .on("progress", (p) => {
          if (loader) loader.style.width = `${p * 100}%`;
        })
        .on("complete", (o) => {
          if (loader) loader.style.width = `100%`;
          Assets.init(o);
          setTimeout(() => {
            document.body.classList.remove("isLoading");
            resolve();
          }, 500);
        })
        .start();
    } else {
      resolve();
    }
  });

export default loadAssets;
