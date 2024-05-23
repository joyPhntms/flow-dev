#version 300 es

precision highp float;
in vec2 vTextureCoord;

uniform sampler2D uPosMap;
uniform sampler2D uVelMap;
uniform sampler2D uExtraMap;
uniform sampler2D uPosOrgMap;

uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseStrength;
uniform float uFlowSpeed;
uniform float uAccX;
uniform float uAccY;

#pragma glslify: curlNoise    = require(./glsl-utils/curlNoise.glsl)
#pragma glslify: snoise    = require(./glsl-utils/snoise.glsl)
#pragma glslify: rotate    = require(./glsl-utils/rotate.glsl)

layout (location = 0) out vec4 oColor0;
layout (location = 1) out vec4 oColor1;
layout (location = 2) out vec4 oColor2;
layout (location = 3) out vec4 oColor3;

#define PI 3.141592653589793


vec3 _normalize(vec3 v) {
    if(length(v) <= 0.0) {
        return vec3(0.0);
    } else {
        return normalize(v);
    }
}

vec3 fbm(vec3 p){
    vec3 n = vec3(0.0);
    for(int i = 0; i < 5; i++){
        float mul = pow(2.0, float(i));
        n += curlNoise(p*mul) / mul;    
    }

    return n;
}

void main(void) {
    vec3 pos = texture(uPosMap, vTextureCoord).xyz;
    vec3 vel = texture(uVelMap, vTextureCoord).xyz;
    vec3 extra = texture(uExtraMap, vTextureCoord).xyz;
    vec3 posOrg = texture(uPosOrgMap, vTextureCoord).xyz;

    //float speed = mix(1.0, 2.0, extra.x);

    //float offset = snoise(pos * 0.2 + uTime * 0.1) * 0.5 + 0.5;
    //offset = mix(0.2, 0.4, offset);

    //float rotSpeed = 0.01;
    //posOrg.xz = rotate(posOrg.xz, rotSpeed);
    //posOrg.yz = rotate(posOrg.zy, -rotSpeed);

    vec3 acc = vec3(0.);

    // noise force
    //acc += curlNoise(pos * 0.5 + uTime * 0.1);
    //vec3 acc = curlNoise(pos * offset + uTime * 0.1);

    //vec3 acc = fbm(pos * offset + uTime * 0.1);
    acc += (fbm(pos * uNoiseScale + uTime * 0.1) * uNoiseStrength);
    acc.x += uAccX;
    acc.y += uAccY;
    acc.z *= 0.05;

    // rotating force
    /*
    vec3 dir = pos * vec3(1.0, 0.0, 1.0);
    dir = _normalize(dir);   // be careful dir = vec3(0.0, 0.0, 0.0);
    dir.xz = rotate(dir.xz, PI * 0.65);
    float f = mix(1.0, .8, extra.y);
    acc += dir * f;*/

    // pulling back force
    /*float maxRadius = 1.5;
    vec3 center = vec3(-3., -2.0, 0.0);
    float distToCenter = distance(pos, center);
    float f1 = smoothstep(0.5, 2.0, distToCenter);
    vec3 dir = normalize(pos - center);
    acc -= dir * f1;*/


    /*if(distToCenter > maxRadius) {
        vec3 dir = -normalize(pos);
        float f = (distToCenter - maxRadius) * 10.0;
        //acc += dir * f * mix(0.5, 1.0, extra.y);
    }*/

    float speedOffset = mix(0.95, 1.0, extra.z);
    
    vel += acc * 0.0006 * speedOffset * uFlowSpeed;
    pos += vel;
    vel *= 0.9;

    if(abs(pos.x) > 7. || abs(pos.y) > 4.){
        pos = -posOrg + vel* 2.;
        vel = vec3(0.0);
    }
 
    oColor0 = vec4(pos, 1.0);
    oColor1 = vec4(vel, 1.);
    oColor2 = vec4(extra, 1.0);
    oColor3 = vec4(posOrg, 1.0);
}