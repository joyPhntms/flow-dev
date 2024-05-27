#version 300 es

precision highp float;
in vec2 vTextureCoord;

uniform sampler2D uPosMap;
uniform sampler2D uVelMap;
uniform sampler2D uExtraMap;
uniform sampler2D uPosOrgMap;
uniform sampler2D uColorMap;

uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseStrength;
uniform float uFlowSpeed;
uniform float uAccX;
uniform float uAccY;

uniform vec3 mousePos;
uniform vec3 mousePrev;
uniform float mouseStrength;

uniform float mouseRadius;
uniform float mouseForce;

uniform float onAddColor;
uniform float minVolume;
uniform float maxVolume;
uniform float newColorStrength;
uniform float randomLevel;

uniform vec3 uPosOffset;

#pragma glslify: curlNoise    = require(./glsl-utils/curlNoise.glsl)
#pragma glslify: snoise    = require(./glsl-utils/snoise.glsl)
#pragma glslify: rotate    = require(./glsl-utils/rotate.glsl)

layout (location = 0) out vec4 oColor0;
layout (location = 1) out vec4 oColor1;
layout (location = 2) out vec4 oColor2;
layout (location = 3) out vec4 oColor3;
layout (location = 4) out vec4 oColor4;

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

float mapRange(float value, float x1, float y1, float x2, float y2)
{
    float result = (value - x1) * (y2 - x2) / (y1 - x1) + x2;
    return result;
}

void main(void) {
    vec3 pos = texture(uPosMap, vTextureCoord).xyz;
    vec3 vel = texture(uVelMap, vTextureCoord).xyz;
    vec3 extra = texture(uExtraMap, vTextureCoord).xyz;
    vec3 posOrg = texture(uPosOrgMap, vTextureCoord).xyz;
    vec3 dColor = texture(uColorMap, vTextureCoord).xyz;

    //adjust mouse position
    vec3 mPos = mousePos;
    vec3 mPrev = mousePrev;

    mPos.x += (1.- uPosOffset.x);
    mPos.y += (-uPosOffset.y);

    mPrev.x += (1.- uPosOffset.x);
    mPrev.y += (-uPosOffset.y);
    

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

    vec3 pa = pos - mPrev, ba = mPos - mPrev;
	vec3 q = mPrev + ba * clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 );
    
	vec3 offset = pos - mPos;
	float nDist = length( offset ) / mouseRadius;
    vec3 d_offset = vec3(0.);

    float mStrength = mix(1., 3., mouseStrength);

    float newColorRadius = 1.;

    // mouse perturbation displacement
	if ( nDist < 1.0 ){
        d_offset += (normalize( offset ) * mix( 1., 0., nDist) * 35.) * mouseForce * mStrength + extra * 1.;
        acc.xy += d_offset.xy;
    }

    //color
    if(onAddColor == 1.){
    if(mPos.x < -0.7){
        newColorRadius = smoothstep(-0.7, -4., pos.x) * smoothstep(-0.7, -4., pos.x);
        newColorRadius = mapRange(newColorRadius, 0., 1., minVolume, maxVolume); //min:0.8, max:1.5
        newColorRadius = (newColorRadius * (1.2 - randomLevel) + extra.y * (smoothstep(-0.7, -4., pos.x) + 1.) * randomLevel ) * newColorStrength;
        if (nDist < newColorRadius)
            dColor.x = 0.5;
    }
    else if(mPos.x > 1.){
        /*newColorRadius = smoothstep(1., 4., pos.x) * 0.5;
        newColorRadius = pow(newColorRadius, 2.) + 0.5 + extra.y * 0.1 * (smoothstep(1., 4., pos.x) + 1.);
        if (nDist < newColorRadius)
            dColor.x = 1.;*/
        newColorRadius = smoothstep(1., 4., pos.x) * smoothstep(1., 4., pos.x);
        newColorRadius = mapRange(newColorRadius, 0., 1., minVolume, maxVolume); //min:0.8, max:1.5
        newColorRadius = (newColorRadius * (1.2 - randomLevel) + extra.y * (smoothstep(1., 4., pos.x) + 1.) * randomLevel ) * newColorStrength;
        if (nDist < newColorRadius)
            dColor.x = 1.;
    }
    }
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
        dColor.x = 0.;
    }
 
    oColor0 = vec4(pos, 1.0);
    oColor1 = vec4(vel, 1.);
    oColor2 = vec4(extra, 1.0);
    oColor3 = vec4(posOrg, 1.0);
    oColor4 = vec4(dColor, 1.0);
}