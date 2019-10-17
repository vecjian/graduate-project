
//河网的动态设计

function gl_draw_with_generative_texture(gl, coordinate, texture_coordinate, drawType, times) {
    const line_vs = `
                attribute vec4 a_Pos;
                attribute vec2 v_texture;
                varying vec4 v_color;
                varying vec2 v_texture_coor;
                void main (){
                    gl_Position = a_Pos;
                    v_texture_coor = v_texture;
                }`;
//uniform vec4 u_Color;
    const line_fs = `
                precision mediump float;
                varying vec2 v_texture_coor;
                uniform float u_time;
                
                float rand(float x) {
                    return fract(sin(x) * 1.0); 
                } 
                
                float random (vec2 st) {
                    return fract( sin(dot(st.xy, vec2(12.9898, 78233))) * 43758.5453123); 
                }
                
                vec2 eaze(in vec2 f) {
                    return 6.0 * f * f * f * f * f - 15.0 * f * f * f *f + 10.0 * f * f * f; 
                }
                vec2 hash(in vec2 x) {
                    const vec2 k = vec2( 0.3183099, 0.3678794 );
                    x = x*k + k.yx;
                    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
                }
    float noise (in vec2 _st) {
    vec2 i = floor( _st );
    vec2 f = fract( _st );
    vec2 u = f*f*(3.0-2.0*f);
    mat2 rot = mat2(cos(u_time), sin(u_time),
                     -sin(u_time), cos(u_time));
                     
    return mix( mix( dot( rot*hash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                     dot( rot*hash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( rot*hash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                     dot( rot*hash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y); 
         
} 


#define NUM_OCTAVES 8

float fbm ( in vec2 _st, float v_time) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = -vec2(v_time*10.0);
    // Rotate to reduce axial bias
    //mat2 rot = mat2(cos(0.5), sin(0.5),
    //              -sin(0.5), cos(0.50));
     
     // Test a rot matrix with time
     mat2 rot = mat2(cos(v_time), sin(v_time),
                     -sin(v_time), cos(v_time));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main(){
     vec2 t = v_texture_coor;
     //t.x -= u_time * 0.1;
     vec2 st = t * 8.0;
     
     float last_value = 0.0;
     float value = fbm(st, u_time);
     
     vec3 color = vec3(value);
     
     float f = value + 0.5;
     
     color = mix(vec3(0.101961,0.619608,0.666667),
                vec3(0.666667,0.666667,0.498039),
                clamp((f*f)*4.0,0.0,1.0));

    color = mix(color,
                vec3(0.666667,1,1),
                clamp(f,0.0,1.0));
    //  color = vec3(0.0,0.0,1);
    // color = vec3(0.0, sin(f), 1.0);
    gl_FragColor = vec4( (f*f*f+.6*f*f+.5*f)*color,1.0);
    // gl_FragColor = vec4( color,1.0);
}`;
    const program = createProgram(gl, line_vs, line_fs);
    gl.useProgram(program.program);
    const aLine = [];
    coordinate.forEach((item) => {
        aLine.push(item.x, item.y, item.z);
    });

    const lineBuffer = createBuffer(gl, new Float32Array(aLine));
    bindAttribute(gl, lineBuffer, program.a_Pos, 3);
    let texture_data =[];
    texture_coordinate.forEach( (iterator) => {
        texture_data.push(iterator);
    });
    const texture_cor = createBuffer(gl, new Float32Array(texture_data));
    bindAttribute(gl, texture_cor, program.v_texture, 2);

    const n = coordinate.length;
    let u_time = gl.getUniformLocation(program.program, "u_time");
    if (u_time < 0) {
        console.log("Can't get the handler of u_time");
        return;
    }
    gl.uniform1f(u_time, times);
    gl.clearColor(0.1,0.1,0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(drawType, 0, n);

}
function gl_draw_with_texture(gl, coordinate, texture_coordinate, drawType, image_src, times) {
    const line_vs = `
                attribute vec4 a_Pos;
                attribute vec2 v_texture;
                varying vec4 v_color;
                varying vec2 v_texture_coor;
                void main (){
                    gl_Position = a_Pos;
                    v_texture_coor = v_texture;
                }`;
//uniform vec4 u_Color;
    const line_fs = `
                precision mediump float;
                varying vec2 v_texture_coor;
                uniform sampler2D u_Sampler;
                uniform float u_time;
                
                float rand(float x) {
                    return fract(sin(x) * 1.0); 
                } 
                
                float random (vec2 st) {
                    return fract( sin(dot(st.xy, vec2(12.9898, 78233))) * 43758.5453123); 
                }
                
                vec2 eaze(in vec2 f) {
                    return 6.0 * f * f * f * f * f - 15.0 * f * f * f *f + 10.0 * f * f * f; 
                }
                vec2 hash(in vec2 x) {
                    const vec2 k = vec2( 0.3183099, 0.3678794 );
                    x = x*k + k.yx;
                    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
                }
    float noise (in vec2 _st) {
    vec2 i = floor( _st );
    vec2 f = fract( _st );
    vec2 u = f*f*(3.0-2.0*f);
    mat2 rot = mat2(cos(u_time), sin(u_time),
                     -sin(u_time), cos(u_time));
                     
    return mix( mix( dot( rot*hash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                     dot( rot*hash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( rot*hash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                     dot( rot*hash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y); 
         
} 


#define NUM_OCTAVES 16

float fbm ( in vec2 _st, float v_time) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = -vec2(v_time);
    // Rotate to reduce axial bias
    //mat2 rot = mat2(cos(0.5), sin(0.5),
    //              -sin(0.5), cos(0.50));
     
     // Test a rot matrix with time
     mat2 rot = mat2(cos(v_time), sin(v_time),
                     -sin(v_time), cos(v_time));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main(){
     vec2 t = v_texture_coor;
     //t.x -= u_time * 0.1;
     vec2 st = fract(t) * 16.0;
     
     float last_value = 0.0;
     float value = fbm(st, u_time * 2.0);
     
     vec3 color = vec3(value);
     
     float f = value + 0.5;
     
     color = mix(vec3(0.101961,0.619608,0.666667),
                vec3(0.666667,0.666667,0.498039),
                clamp((f*f)*4.0,0.0,1.0));
      color = mix(color,
                vec3(0,0,0.164706),
                clamp(f,0.0,1.0));

    color = mix(color,
                vec3(0.666667,1,1),
                clamp(f,0.0,1.0));
     //color = vec3(0.101961,0.619608,0.666667);
     color = vec3(0.0, sin(f), 1.0);
    gl_FragColor = vec4( (f*f*f+.6*f*f+.5*f)*color,1.0);
}`;

    const program = createProgram(gl, line_vs, line_fs);
    gl.useProgram(program.program);
    const aLine = [];
    coordinate.forEach((item) => {
        aLine.push(item.x, item.y, item.z);
    });

    const lineBuffer = createBuffer(gl, new Float32Array(aLine));
    bindAttribute(gl, lineBuffer, program.a_Pos, 3);
    let texture_data =[];
    texture_coordinate.forEach( (iterator) => {
        texture_data.push(iterator);
    });

    const texture_cor = createBuffer(gl, new Float32Array(texture_data));

    bindAttribute(gl, texture_cor, program.v_texture, 2);

    const n = coordinate.length;

    let u_Sampler = gl.getUniformLocation(program.program, "u_Sampler");
    if (u_Sampler < 0) {
        console.log("Can't get the handler of u_Sampler");
        return;
    }

    let u_time = gl.getUniformLocation(program.program, "u_time");
    if (u_time < 0) {
        console.log("Can't get the handler of u_time");
        return;
    }

    gl.uniform1f(u_time, times);
    /* TODO:
       draw until the image load process finished;
     */


    let texture_var = gl.createTexture();
    let image = new Image();
    image.onload = function() {
       loadTexture(gl, n, texture_var, u_Sampler, image);
    };
    image.src = image_src;

    //gl.drawArrays(drawType, 0, n);
}

function isPowerOf2( num ) {
    return (num & (num - 1)) == 0;
}
function loadTextureThrouthInternal(gl, url) {
    const texture = gl.createTexture()

    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([ 0, 0, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        }
    }
    image.src = url;
    return texture;
}
function loadTexture(gl, n, texture, u_Sampler, image) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    }
    gl.uniform1i(u_Sampler, 0);
    gl.clearColor(0.0,0.0,0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.drawArrays(gl.TRIANGLES, 0, n);
    /*
    let ptr_texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ptr_texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 255, 255]));
     */

}
/*
    Params:
        pts : Array of THREE.Vector3
        line_width : double

    Returns:
        array : a array of THREE.Vector3 with three point stand for a triangle
                Draw Type : gl.TRIANGLES
*/


function generateBevelledPoint(pts, line_width) {
    if (pts === undefined || pts.length < 2) {
        return undefined;
    }
    let res = [];
    let start_vector = new THREE.Vector3();
    start_vector.subVectors(pts[1], pts[0]);
    let left_miter = new THREE.Vector3();
    left_miter.crossVectors(new THREE.Vector3(0, 0, 1), start_vector);
    left_miter.normalize();
    left_miter.multiplyScalar(line_width);
    let right_miter = left_miter.clone();
    right_miter.multiplyScalar(-1.0);
    let left_point = new THREE.Vector3();
    let right_point = new THREE.Vector3();
    left_point.addVectors(pts[0], left_miter);
    right_point.addVectors(pts[0], right_miter);
    for (let i = 1; i < pts.length - 1; i++) {
        let pre_point = pts[i - 1];
        let current_point = pts[i];
        let next_point = pts[i + 1];
        let pre_vec = new THREE.Vector3();
        let next_vec = new THREE.Vector3();
        pre_vec.subVectors(current_point, pre_point);
        next_vec.subVectors(next_point, current_point);
        let direct = new THREE.Vector3();
        direct.crossVectors(pre_vec, next_vec);
        // direct is negative stand for clock-wise


        next_vec.multiplyScalar(-1.0);
        pre_vec.normalize();
        next_vec.normalize();

        let semi_vec = new THREE.Vector3();
        semi_vec.addVectors(pre_vec, next_vec);

        semi_vec.normalize();
        let semi_width = -line_width / Math.abs(semi_vec.x * next_vec.y - semi_vec.y * next_vec.x);

        semi_vec.multiplyScalar(semi_width);


        let semi_point = new THREE.Vector3();
        let pre_vec_point = new THREE.Vector3();
        let next_vec_point = new THREE.Vector3();

        if (direct.z > 0) {

            next_vec.crossVectors(new THREE.Vector3(0, 0, 1), next_vec);
            pre_vec.crossVectors(new THREE.Vector3(0, 0, -1), pre_vec);
        } else if (direct.z < 0) {

            next_vec.crossVectors(new THREE.Vector3(0, 0, -1), next_vec);
            pre_vec.crossVectors(new THREE.Vector3(0, 0, 1), pre_vec);
        } else {
            console.log("Direct equals to zero");
            return [];
        }

        pre_vec.multiplyScalar(line_width);
        next_vec.multiplyScalar(line_width);

        semi_point.addVectors(current_point, semi_vec);
        pre_vec_point.addVectors(current_point, next_vec);
        next_vec_point.addVectors(current_point, pre_vec);

        if (direct.z > 0) {

            res.push(left_point, right_point, next_vec_point);
            res.push(left_point, next_vec_point, semi_point);
            res.push(next_vec_point, semi_point, pre_vec_point);
            left_point = semi_point;
            right_point = pre_vec_point;

        } else if (direct.z < 0) {
            res.push(left_point, right_point, next_vec_point);
            res.push(right_point, semi_point, next_vec_point);
            res.push(next_vec_point, semi_point, pre_vec_point);
            left_point = pre_vec_point;
            right_point = semi_point;
        } else {
            console.log("Direct equals to zero");
            return [];
        }

    }


    let end_index = pts.length - 1;

    let end_vector = new THREE.Vector3();
    end_vector.subVectors(pts[end_index], pts[end_index - 1]);
    let end_vector_miter = new THREE.Vector3();
    end_vector_miter.crossVectors(new THREE.Vector3(0, 0, 1), end_vector);
    end_vector_miter.normalize();
    end_vector_miter.multiplyScalar(line_width);

    let left_end_point = new THREE.Vector3();
    let right_end_point = new THREE.Vector3();

    left_end_point.addVectors(pts[end_index], end_vector_miter);
    end_vector_miter.multiplyScalar(-1.0);
    right_end_point.addVectors(pts[end_index], end_vector_miter);

    res.push(left_point, right_point, right_end_point);
    res.push(left_point, right_end_point, left_end_point);
    return res;
}


function VectorAdd(lhs, rhs) {
    let res = new THREE.Vector3();
    res.addVectors(lhs, rhs);
    return res;
}

function VectorSub(lhs, rhs) {
    let res = new THREE.Vector3();
    res.subVectors(lhs, rhs);
    return res;
}

/**
 * @return {number}
 */
function VectorDot(lhs, rhs) {
    return lhs.x * rhs.x + lhs.y * rhs.y + lhs.z * rhs.z;
}

function VectorCross(lhs, rhs) {
    let res = new THREE.Vector3();
    res.crossVectors(lhs, rhs);
    return res;
}

function VectorMultiplyScalar(lhs, scalar) {
    let res = new THREE.Vector3();
    res.multiplyScalar(lhs, scalar);
    return res;
}