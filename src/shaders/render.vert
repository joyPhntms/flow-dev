// basic.vert

precision highp float;
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uViewport;

uniform vec3 uColors[5];
uniform float uColorSeed;

uniform sampler2D uPosMap;
uniform sampler2D uExtraMap;

uniform float uBrightness;
uniform float uColorEdge1;
uniform float uColorEdge2;
uniform float uColorEdge3;
uniform float uColorEdge4;

uniform float uParticleSize;
uniform vec3 uPosOffset;

varying vec3 vColor;

#pragma glslify: snoise    = require(./glsl-utils/snoise.glsl)
#pragma glslify: rotate    = require(./glsl-utils/rotate.glsl)
#define PI 3.141592653589793


float particleSize(vec4 screenPos, mat4 mtxProj, vec2 viewport, float radius) {
	return viewport.y * mtxProj[1][1] * radius / screenPos.w;
}


void main(void) {
    vec3 pos = texture2D(uPosMap, aTextureCoord).xyz;
    pos.x -= 1.;
    pos.x += uPosOffset.x;
    pos.y += uPosOffset.y;
    //pos.y -= 0.95;
    //pos.xy = rotate(pos.xy, -0.14 * PI);

    vec4 worldSpace = uModelMatrix * vec4(pos, 1.0);
    vec4 cameraSpace = uViewMatrix * worldSpace;
    vec4 screenSpace = uProjectionMatrix * cameraSpace;
    gl_Position = screenSpace;

    // gl_PointSize = mix(12.0, 5.0, aVertexPosition.x);
    float radius = mix(0.01, 0.03, aVertexPosition.x);
    gl_PointSize = particleSize(gl_Position, uProjectionMatrix, uViewport, radius * 0.4 * uParticleSize);

    vec3 color = vec3(0.);
    
    float rnd = ((pos.z) + 1.)*3. - 2.6 ;
    //+  snoise(vec3(uColorSeed, aTextureCoord)) * 0.02;
    //rnd += extra.y * 0.45;

    if(rnd < uColorEdge1) {
        color = uColors[0] * 2.;
    } else if(rnd < uColorEdge2) {
        color = uColors[1] * 1.5;
    } else if(rnd < uColorEdge3) {
        color = uColors[2];
    } else if(rnd < uColorEdge4) {
        color = uColors[3];
    } else {
        color = uColors[4];
    }

    //color += 0.2;
    color *= mix(0.8, 1.1, (pos.z + 1.)*0.5) * uBrightness;
    color = pow(color, vec3(1.5));
    vColor = color;
}