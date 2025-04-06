import {Spine, TextureAtlasPage} from "pixi-spine";
import * as spine37 from "@pixi-spine/runtime-3.7"
import * as spine38 from "@pixi-spine/runtime-3.8"
import * as spine41 from "@pixi-spine/runtime-4.1"
import {detectSpineVersion, SPINE_VERSION} from "@pixi-spine/loader-uni"

export const runtime = {
    version: 0,
    data: {
        [SPINE_VERSION.VER37]: spine37,
        [SPINE_VERSION.VER38]: spine38,
        [SPINE_VERSION.VER40]: spine41,
        [SPINE_VERSION.VER41]: spine41,
    }
}

const setFilters = TextureAtlasPage.prototype.setFilters
TextureAtlasPage.prototype.setFilters = function () {
    if (this.baseTexture.width !== this.width || this.baseTexture.height !== this.height) {
        this.baseTexture.setSize(this.width, this.height)
    }
    setFilters.apply(this, arguments)
}

Spine.prototype.createSkeleton = function (spineData) {
    const ver = detectSpineVersion(spineData.version);

    const spine = runtime.data[runtime.version] || runtime.data[ver]
    if (!spine) {
        throw `Cant detect version of spine model ${spineData.version}`
    }

    const rawSpine = runtime.data[ver]

    this.skeleton = new spine.Skeleton(spineData);
    this.skeleton.updateWorldTransform();
    this.stateData = new rawSpine.AnimationStateData(spineData);
    this.state = new rawSpine.AnimationState(this.stateData);
}
