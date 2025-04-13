export class PhysicsConstraintData {
    name = "";
    bone = "";
    x = 0;
    y = 0;
    rotate = 0;
    scaleX = 0;
    shearX = 0;
    limit = 5000;
    step = 1 / 60;
    inertia = 1;
    strength = 100;
    damping = 1;
    massInverse = 1;
    wind = 0;
    gravity = 0;
    mix = 1;

    constructor(config) {
        if (config) {
            this.name = config.name || this.name;
            this.bone = config.bone || this.bone;
            this.x = config.x !== undefined ? config.x : this.x;
            this.y = config.y !== undefined ? config.y : this.y;
            this.rotate = config.rotate !== undefined ? config.rotate : this.rotate;
            this.scaleX = config.scaleX !== undefined ? config.scaleX : this.scaleX;
            this.shearX = config.shearX !== undefined ? config.shearX : this.shearX;
            this.limit = config.limit !== undefined ? config.limit : this.limit;
            this.step = config.fps !== undefined ? 1 / config.fps : this.step;
            this.inertia = config.inertia !== undefined ? config.inertia : this.inertia;
            this.strength = config.strength !== undefined ? config.strength : this.strength;
            this.damping = config.damping !== undefined ? config.damping : this.damping;
            this.massInverse = config.mass !== undefined ? 1 / config.mass : this.massInverse;
            this.wind = config.wind !== undefined ? config.wind : this.wind;
            this.gravity = config.gravity !== undefined ? config.gravity : this.gravity;
            this.mix = config.mix !== undefined ? config.mix : this.mix;
        }
    }
}

export class PhysicsConstraint {
    readonly data: PhysicsConstraintData;
    bone;
    inertia = 0;
    strength = 0;
    damping = 0;
    massInverse = 0;
    wind = 0;
    gravity = 0;
    mix = 0;
    _reset = true;
    ux = 0;
    uy = 0;
    cx = 0;
    cy = 0;
    tx = 0;
    ty = 0;
    xOffset = 0;
    xVelocity = 0;
    yOffset = 0;
    yVelocity = 0;
    rotateOffset = 0;
    rotateVelocity = 0;
    scaleOffset = 0
    scaleVelocity = 0;

    readonly skeleton;
    remaining = 0;
    lastTime = 0;

    constructor(data, skeleton) {
        this.data = data;
        this.skeleton = skeleton;
        this.bone = this.skeleton.findBone(data.bone);
        this.inertia = data.inertia;
        this.strength = data.strength;
        this.damping = data.damping;
        this.massInverse = data.massInverse;
        this.wind = data.wind;
        this.gravity = data.gravity;
        this.mix = data.mix;
    }

    updateAppliedTransform() {
        let parent = this.bone.parent;
        let m = this.bone.matrix;
        if (!parent) {
            this.bone.ax = m.tx - this.bone.skeleton.x;
            this.bone.ay = m.ty - this.bone.skeleton.y;
            this.bone.arotation = Math.atan2(m.b, m.a) * (180 / 3.1415927);
            this.bone.ascaleX = Math.sqrt(m.a * m.a + m.b * m.b);
            this.bone.ascaleY = Math.sqrt(m.c * m.c + m.d * m.d);
            this.bone.ashearX = 0;
            this.bone.ashearY = Math.atan2(m.a * m.c + m.b * m.d, m.a * m.d - m.c * m.b) * (180 / 3.1415927);
            return;
        }
        let pm = parent.matrix;
        let pa = pm.a, pb = pm.c, pc = pm.b, pd = pm.d;
        let pid = 1 / (pa * pd - pb * pc);
        let ia = pd * pid, ib = pb * pid, ic = pc * pid, id = pa * pid;
        let dx = m.tx - pm.tx, dy = m.ty - pm.ty;
        this.bone.ax = (dx * ia - dy * ib);
        this.bone.ay = (dy * id - dx * ic);

        let ra, rb, rc, rd;
        if (this.bone.transform == 1) {
            ra = m.a;
            rb = m.c;
            rc = m.b;
            rd = m.d;
        } else {
            switch (this.bone.transform) {
                case 2: {
                    let s = Math.abs(pa * pd - pb * pc) / (pa * pa + pc * pc);
                    pb = -pc * this.bone.skeleton.scaleX * s / this.bone.skeleton.scaleY;
                    pd = pa * this.bone.skeleton.scaleY * s / this.bone.skeleton.scaleX;
                    pid = 1 / (pa * pd - pb * pc);
                    ia = pd * pid;
                    ib = pb * pid;
                    break;
                }
                case 3:
                case 4:
                    let cos = Math.cos(this.bone.rotation * (3.1415927 / 180)), sin = Math.sin(this.bone.rotation * (3.1415927 / 180));
                    pa = (pa * cos + pb * sin) / this.bone.skeleton.scaleX;
                    pc = (pc * cos + pd * sin) / this.bone.skeleton.scaleY;
                    let s = Math.sqrt(pa * pa + pc * pc);
                    if (s > 0.00001) s = 1 / s;
                    pa *= s;
                    pc *= s;
                    s = Math.sqrt(pa * pa + pc * pc);
                    if (this.bone.transform == 3 && pid < 0 != (this.bone.skeleton.scaleX < 0 != this.bone.skeleton.scaleY < 0)) s = -s;
                    let r = 3.1415927 / 2 + Math.atan2(pc, pa);
                    pb = Math.cos(r) * s;
                    pd = Math.sin(r) * s;
                    pid = 1 / (pa * pd - pb * pc);
                    ia = pd * pid;
                    ib = pb * pid;
                    ic = pc * pid;
                    id = pa * pid;
            }
            ra = ia * m.a - ib * m.b;
            rb = ia * m.c - ib * m.d;
            rc = id * m.b - ic * m.a;
            rd = id * m.d - ic * m.c;
        }

        this.bone.ashearX = 0;
        this.bone.ascaleX = Math.sqrt(ra * ra + rc * rc);
        if (this.bone.ascaleX > 0.0001) {
            let det = ra * rd - rb * rc;
            this.bone.ascaleY = det / this.bone.ascaleX;
            this.bone.ashearY = -Math.atan2(ra * rb + rc * rd, det) * (180 / 3.1415927);
            this.bone.arotation = Math.atan2(rc, ra) * (180 / 3.1415927);
        } else {
            this.bone.ascaleX = 0;
            this.bone.ascaleY = Math.sqrt(rb * rb + rd * rd);
            this.bone.ashearY = 0;
            this.bone.arotation = 90 - Math.atan2(rd, rb) * (180 / 3.1415927);
        }
    }

    reset() {
        this.remaining = 0;
        this.lastTime = this.skeleton.time || 0;
        this._reset = true;
        this.xOffset = 0;
        this.xVelocity = 0;
        this.yOffset = 0;
        this.yVelocity = 0;
        this.rotateOffset = 0;
        this.rotateVelocity = 0;
        this.scaleOffset = 0;
        this.scaleVelocity = 0;
    }

    update() {
        const bone = this.bone;
        bone.a = bone.matrix.a;
        bone.b = bone.matrix.c;
        bone.c = -bone.matrix.b;
        bone.d = -bone.matrix.d;
        bone.worldXData = bone.worldX;
        bone.worldYData = -bone.worldY;
        const mix = this.mix;
        if (mix == 0) return;

        const x = this.data.x > 0, y = this.data.y > 0, rotateOrShearX = this.data.rotate > 0 || this.data.shearX > 0, scaleX = this.data.scaleX > 0;
        const l = bone.data.length;
        const skeleton = this.skeleton;
        const delta = Math.max((this.skeleton.time || 0) - this.lastTime, 0);
        this.remaining += delta;
        this.lastTime = this.skeleton.time || 0;

        const bx = bone.worldXData, by = bone.worldYData;
        if (this._reset) {
            this._reset = false;
            this.ux = bx;
            this.uy = by;
        } else {
            let a = this.remaining, i = this.inertia, t = this.data.step, f = this.skeleton.data.referenceScale || 100, d = -1;
            let qx = this.data.limit * delta, qy = qx * Math.abs(skeleton.scaleY);
            qx *= Math.abs(skeleton.scaleX);
            if (x || y) {
                if (x) {
                    const u = (this.ux - bx) * i;
                    this.xOffset += u > qx ? qx : u < -qx ? -qx : u;
                    this.ux = bx;
                }
                if (y) {
                    const u = (this.uy - by) * i;
                    this.yOffset += u > qy ? qy : u < -qy ? -qy : u;
                    this.uy = by;
                }
                if (a >= t) {
                    d = Math.pow(this.damping, 60 * t);
                    const m = this.massInverse * t, e = this.strength, w = this.wind * f * skeleton.scaleX, g = this.gravity * f * skeleton.scaleY;
                    do {
                        if (x) {
                            this.xVelocity += (w - this.xOffset * e) * m;
                            this.xOffset += this.xVelocity * t;
                            this.xVelocity *= d;
                        }
                        if (y) {
                            this.yVelocity -= (g + this.yOffset * e) * m;
                            this.yOffset += this.yVelocity * t;
                            this.yVelocity *= d;
                        }
                        a -= t;
                    } while (a >= t);
                }
                if (x) bone.worldXData += this.xOffset * mix * this.data.x;
                if (y) bone.worldYData += this.yOffset * mix * this.data.y;
            }
            if (rotateOrShearX || scaleX) {
                let ca = Math.atan2(bone.c, bone.a), c = 0, s = 0, mr = 0;
                let dx = this.cx - bone.worldXData, dy = this.cy - bone.worldYData;
                if (dx > qx)
                    dx = qx;
                else if (dx < -qx)
                    dx = -qx;
                if (dy > qy)
                    dy = qy;
                else if (dy < -qy)
                    dy = -qy;
                if (rotateOrShearX) {
                    mr = (this.data.rotate + this.data.shearX) * mix;
                    let r = Math.atan2(dy + this.ty, dx + this.tx) - ca - this.rotateOffset * mr;
                    this.rotateOffset += (r - Math.ceil(r / (3.1415927 * 2) - 0.5) * (3.1415927 * 2)) * i;
                    r = this.rotateOffset * mr + ca;
                    c = Math.cos(r);
                    s = Math.sin(r);
                    if (scaleX) {
                        r = l * bone.getWorldScaleX();
                        if (r > 0) this.scaleOffset += (dx * c + dy * s) * i / r;
                    }
                } else {
                    c = Math.cos(ca);
                    s = Math.sin(ca);
                    const r = l * bone.getWorldScaleX();
                    if (r > 0) this.scaleOffset += (dx * c + dy * s) * i / r;
                }
                a = this.remaining;
                if (a >= t) {
                    if (d == -1) d = Math.pow(this.damping, 60 * t);
                    const m = this.massInverse * t, e = this.strength, w = this.wind, g = this.gravity, h = l / f;
                    while (true) {
                        a -= t;
                        if (scaleX) {
                            this.scaleVelocity += (w * c - g * s - this.scaleOffset * e) * m;
                            this.scaleOffset += this.scaleVelocity * t;
                            this.scaleVelocity *= d;
                        }
                        if (rotateOrShearX) {
                            this.rotateVelocity -= ((w * s + g * c) * h + this.rotateOffset * e) * m;
                            this.rotateOffset += this.rotateVelocity * t;
                            this.rotateVelocity *= d;
                            if (a < t) break;
                            const r = this.rotateOffset * mr + ca;
                            c = Math.cos(r);
                            s = Math.sin(r);
                        } else if (a < t)
                            break;
                    }
                }
            }
            this.remaining = a;
        }
        this.cx = bone.worldXData;
        this.cy = bone.worldYData;

        if (rotateOrShearX) {
            let o = this.rotateOffset * mix, s = 0, c = 0, a = 0;
            if (this.data.shearX > 0) {
                let r = 0;
                if (this.data.rotate > 0) {
                    r = o * this.data.rotate;
                    s = Math.sin(r);
                    c = Math.cos(r);
                    a = bone.b;
                    bone.b = c * a - s * bone.d;
                    bone.d = s * a + c * bone.d;
                }
                r += o * this.data.shearX;
                s = Math.sin(r);
                c = Math.cos(r);
                a = bone.a;
                bone.a = c * a - s * bone.c;
                bone.c = s * a + c * bone.c;
            } else {
                o *= this.data.rotate;
                s = Math.sin(o);
                c = Math.cos(o);
                a = bone.a;
                bone.a = c * a - s * bone.c;
                bone.c = s * a + c * bone.c;
                a = bone.b;
                bone.b = c * a - s * bone.d;
                bone.d = s * a + c * bone.d;
            }
        }
        if (scaleX) {
            const s = 1 + this.scaleOffset * mix * this.data.scaleX;
            bone.a *= s;
            bone.c *= s;
        }
        this.tx = l * bone.a;
        this.ty = l * bone.c;
        bone.matrix.a = bone.a;
        bone.matrix.c = bone.b;
        bone.matrix.b = -bone.c;
        bone.matrix.d = -bone.d;
        bone.matrix.tx = bone.worldXData;
        bone.matrix.ty = -bone.worldYData;
        this.updateAppliedTransform();
    }
}
