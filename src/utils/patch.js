import {Spine, TextureAtlasPage} from "pixi-spine";
import * as spine37 from "@pixi-spine/runtime-3.7"
import * as spine38 from "@pixi-spine/runtime-3.8"
import * as spine41 from "@pixi-spine/runtime-4.1"
import {detectSpineVersion, SPINE_VERSION, SpineParser} from "@pixi-spine/loader-uni"
import {PhysicsConstraint, PhysicsConstraintData} from "@/utils/PhysicsConstraint"
import {UniBinaryParser, UniJsonParser} from "@/utils/SkeletonParser42"

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

SpineParser.prototype.createBinaryParser = function() {
    return new UniBinaryParser();
}

SpineParser.prototype.createJsonParser = function() {
    return new UniJsonParser();
}

const update = Spine.prototype.update;
Spine.prototype.update = function (dt) {
    this.skeleton.time = (this.skeleton.time || 0) + dt * this.state.timeScale;
    update.call(this, dt);
}

const sortTransformConstraint = spine41.Skeleton.prototype.sortTransformConstraint;
spine41.Skeleton.prototype.sortTransformConstraint = function (constraint) {
    if (!constraint.target.isActive()) return;
    if (!this.hasOwnProperty('physicsConstraints')) {
        this.physicsConstraints = [];
    }
    if (constraint.bones && constraint.bones[0] == constraint.target && this.data.hasOwnProperty('physics') && this.data.physics.find(physicsConstraint => `physics-${physicsConstraint.name}` == constraint.data.name)) {
        this.sortBone(constraint.target);
        let physicsConstraint = this.physicsConstraints.find(physicsConstraint => `physics-${physicsConstraint.data.name}` == constraint.data.name);
        if (!physicsConstraint) {
            physicsConstraint = new PhysicsConstraint(new PhysicsConstraintData(this.data.physics.find(physicsConstraint => `physics-${physicsConstraint.name}` == constraint.data.name)), this);
            this.physicsConstraints.push(physicsConstraint);
        }
        this._updateCache.push(physicsConstraint);
        this.sortReset(constraint.target.children);
        constraint.target.sorted = true;
    } else {
        sortTransformConstraint.call(this, constraint);
    }
}
