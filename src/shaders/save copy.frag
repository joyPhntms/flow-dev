#version 300 es

precision highp float;
in vec2 vTextureCoord;
in vec3 vData;
uniform float uSeed;

#pragma glslify: curlNoise    = require(./glsl-utils/curlNoise.glsl)
#pragma glslify: snoise    = require(./glsl-utils/snoise.glsl)


layout (location = 0) out vec4 oColor0;
layout (location = 1) out vec4 oColor1;
layout (location = 2) out vec4 oColor2;
layout (location = 3) out vec4 oColor3;
layout (location = 4) out vec4 oColor4;

void main(void) {
    vec3 pos = curlNoise(vec3(vTextureCoord, uSeed) * 100.0) * 1.1;
    float t = snoise(vec3(uSeed, vTextureCoord));
    pos *= (t) ;
    //pos.x -= 5.;
    //pos.y -= 3.;
    pos = vec3((vTextureCoord - vec2(0.5)) * 12., 0.) ;
    pos.y = pos.y / 16. * 10.;

    //vec3 pos = vPositionOffset * t;
    vec3 data = vData;
    data.x = 1.+ 0.9 * snoise(vec3(uSeed * 200., vTextureCoord));
    //data.z = data.x;
    //data.y = (snoise(vec3(uSeed * 200., vTextureCoord)) + 1.) * 0.5;

    vec3 extra = curlNoise(vec3(vTextureCoord.x, uSeed, vTextureCoord.y) * 200.0);

    oColor0 = vec4(pos, 1.);
    oColor1 = vec4(vec3(0.0), 1.);
    oColor2 = vec4(extra * .5 + .5, 1.0);
    oColor3 = vec4(pos, 1.0);
    oColor4 = vec4(data, 1.0);


    /*
    0 -> position
    1 -> random
    2 -> orginal position
    */


    /*
    0 -> position
    1 -> velocity
    2 -> random
    3 -> orginal position
    */
}