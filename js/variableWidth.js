//不同宽度的线
//全局反走样开启或者关闭
//采用羽化的方式专门进行反走样


var GL_DRAW_TYPE = {
    Line: 1,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
};

var line_vs = `
attribute vec4 a_Pos;
attribute vec4 a_color;
varying vec4 v_color;


void main (){
    gl_Position = a_Pos;
    v_color = a_color;
}`;

//uniform vec4 u_Color;

var line_fs = `
precision mediump float;
varying vec4 v_color;
void main(){
    gl_FragColor = v_color; 
}`


function getWebglEle() {
    const canvas = document.getElementById("webgl");
    let gl = canvas.getContext('webgl', {antialias: true});
    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    return gl;
}

// Param:
// @ coordinate : Array of THREE.Vector3
// @ color : Array of Color
// @ drawType : gl.triangle of gl.triangle_strip
// Returens : void
function drawlineSequence(gl, coordinate, color, drawType) {
    const program = createProgram(gl, line_vs, line_fs);
    gl.useProgram(program.program);

    const aLine = [];
    coordinate.forEach((item) => {
        aLine.push(item.x, item.y, item.z);
    });
    // Assume the length of coordinate equals to the length of color
    const colorArr = [];
    color.forEach((item) => {
       colorArr.push(item.r, item.g, item.b, item.alpha);
    });
    var colorbuff = createBuffer(gl, new Float32Array(colorArr));
    bindAttribute(gl, colorbuff, program.a_color, 4);
    var lineBuffer = createBuffer(gl, new Float32Array(aLine));
    bindAttribute(gl, lineBuffer, program.a_Pos, 3);
    var n = coordinate.length;
    gl.drawArrays(drawType, 0, n);

}


// function drawFeatherLine() {
//     var gl = getContextgl();

//     gl.clearColor(0.9, 0.9, 0.9, 1);
//     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//     var program = createProgram(gl, line_vs, line_fs);
//     gl.useProgram(program.program);

//     //绘制未经过处理的线
//     var aLine = [-0.6, 0.9, -0.9, 0.2];
//     var colorArr = [];
//     for (let i = 0; i < aLine.length / 2; i++) {
//         colorArr = colorArr.concat([0, 0, 0, 1]);
//     }
//     var u_translate = new THREE.Matrix4();
//     u_translate.makeTranslation(-0.1, 0, 0);
//     gl.uniformMatrix4fv(program.u_translate, false, new Float32Array(u_translate.elements));
//     // gl.uniform1i(program.u_iscahngecolor, 0);
//     var colorbuff = createBuffer(gl, new Float32Array(colorArr));
//     var lineBuffer = createBuffer(gl, new Float32Array(aLine));
//     bindAttribute(gl, lineBuffer, program.a_Pos, 2);
//     bindAttribute(gl, colorbuff, program.a_color, 4);
//     var n = aLine.length / 2;
//     gl.drawArrays(gl.LINES, 0, n);

//     for (var i = 0; i < 20; i++) {
//         var lineWidth = (0.1 + 0.3 * i) * transform();
//         var arr = spliteALine(aLine, lineWidth);
//         var arr1 = spliteALine(aLine, lineWidth / 2 + lineWidth);

//         var leftFeather = addColortoFeatherVertex(arr.left, arr1.left);
//         var rightFeather = addColortoFeatherVertex(arr.right, arr1.right);

//         var u_translate = new THREE.Matrix4();
//         var deltax = 0.1 * i
//         u_translate.makeTranslation(deltax, 0, 0);
//         gl.uniformMatrix4fv(program.u_translate, false, new Float32Array(u_translate.elements));

//         //绘制中心线
//         var arr3 = changeToStrip(arr.left, arr.right);
//         var lineBuffer = createBuffer(gl, new Float32Array(arr3));
//         for (let i = 0; i < arr3.length / 2; i++) {
//             colorArr = colorArr.concat([0, 0, 0, 1]);
//         }

//         //绘制左边的羽化部分
//         var lineBuffer = createBuffer(gl, new Float32Array(leftFeather.triangleStrip));
//         var num = leftFeather.triangleStrip.length / 2;
//         var colorBuffer = createBuffer(gl, new Float32Array(leftFeather.colorArr));
//         bindAttribute(gl, colorBuffer, program.a_color, 4);
//         bindAttribute(gl, lineBuffer, program.a_Pos, 2);
//         gl.drawArrays(gl.TRIANGLES, 0, num);

//         //绘制右边的羽化部分
//         colorBuffer = createBuffer(gl, new Float32Array(rightFeather.colorArr));
//         bindAttribute(gl, colorBuffer, program.a_color, 4);
//         lineBuffer = createBuffer(gl, new Float32Array(rightFeather.triangleStrip));
//         bindAttribute(gl, lineBuffer, program.a_Pos, 2);
//         gl.drawArrays(gl.TRIANGLES, 0, num);
//     }

// }

function drawLineWithFeature(gl, arr_point, line_width, feather_width,guiObj) {
    // generate Feature point

    let arr_draw_block = generateFeather(arr_point, line_width, feather_width);
    // drawFeature

    // drawLineWithWidth
    let arr_width_draw_block = generateWidth(arr_point, line_width);

    if(guiObj.feather){
        arr_draw_block.forEach((draw_block) => {
            drawlineSequence(gl, draw_block.pts, draw_block.color, draw_block.drawtype);
        });
    }
    arr_width_draw_block.forEach( (draw_block) => {
        drawlineSequence(gl, draw_block.pts, draw_block.color, draw_block.drawtype);
    })
}

// Params :
//     arr_point : array of THREE.Vector3
//     line_width : double
//     feather_width : double
// Returns :
//   undefined : when error occurs
//   [DrawBlock] : array of DrawBlock
//     which DrawBlock { pts, color, drawtype }

class DrawBlock {
    constructor() {
        this.pts = [];
        this.color = [];
        this.drawtype = GL_DRAW_TYPE.Line;
    };

}
class Color {
    constructor(R, G, B, alpha) {
        this.r = R;
        this.g = G;
        this.b = B;
        this.alpha = alpha;
        this.a = alpha;
    }
}
function generateFeather(arr_point, line_width, feather_width) {
    if (arr_point === undefined || arr_point.length < 2) {
        return undefined;
    }



    var res = [];
    let v1 = new THREE.Vector3;
    v1.subVectors(arr_point[1], arr_point[0]);
    v1.normalize();
    let miter = new THREE.Vector3();
    miter.crossVectors(v1, new THREE.Vector3(0, 0, 1));
    miter.normalize();
    let inner = LinePointTranslate(arr_point, miter, line_width);
    let outner = LinePointTranslate(arr_point, miter, line_width + feather_width);
    let draw_block = new DrawBlock();

    for (let i = 0; i < inner.length; i++) {
        draw_block.pts.push(inner[i], outner[i]);
        draw_block.color.push(
            new Color(0, 0, 0, 1.0),
            new Color(0, 0, 0, 0.0),
        )
    }
    draw_block.drawtype = GL_DRAW_TYPE.TRIANGLE_STRIP;
    res.push(draw_block);

    miter.crossVectors(new THREE.Vector3(0, 0, 1), v1);
    miter.normalize();
    // console.log(miter);
    inner = LinePointTranslate(arr_point, miter, line_width);
    outner = LinePointTranslate(arr_point, miter, line_width + feather_width);
    let DrawBlock1 = new DrawBlock();
    for (let i = 0; i < inner.length; i++) {
        DrawBlock1.pts.push(inner[i], outner[i]);
        DrawBlock1.color.push(
            new Color(0, 0, 0, 1.0),
            new Color(0, 0, 0, 0.0),
        )
    }
    DrawBlock1.drawtype = GL_DRAW_TYPE.TRIANGLE_STRIP;
    res.push(DrawBlock1);
    return res;
}

function generateWidth(arr_point, line_width) {
    if (arr_point === undefined || arr_point.length < 2) {
        return undefined;
    }

    let left_point = generateEdgePoint(arr_point, line_width, true);
    let right_point = generateEdgePoint(arr_point, line_width, false);

    let draw_block = new DrawBlock();
    draw_block.drawtype = GL_DRAW_TYPE.TRIANGLE_STRIP;

    for(let i = 0; i < left_point.length; i++) {
        draw_block.pts.push(left_point[i], right_point[i]);
        if (i == 0) {

            draw_block.color.push(
                new Color(0.0, 0.0, 0.0, 1.0),
                new Color(0.0, 0.0, 0.0, 1.0),
            )
        } else {

            draw_block.color.push(
                new Color(0.0, 0.0, 0.0, 1.0),
                new Color(0.0, 0.0, 0.0, 1.0),
            )
        }
    }

    return [draw_block];

}

function generateEdgePoint(arr_point, line_width, is_left) {
    let direction_width = (is_left ? 1.0 : -1.0) * line_width;

    let res = [];
    let first_miter = new THREE.Vector3();

    first_miter.crossVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(
            arr_point[0].x - arr_point[1].x,
            arr_point[0].y - arr_point[1].y,
            arr_point[0].z - arr_point[1].z));
    first_miter.normalize();
    let temp_vec = new THREE.Vector3();
    temp_vec.set(
        arr_point[0].x + direction_width * first_miter.x,
        arr_point[0].y + direction_width * first_miter.y,
        arr_point[0].z + direction_width * first_miter.z
    )
    res.push(temp_vec);

    for(let i = 1; i < arr_point.length - 1; i++) {
        let miter = semiAngleVector(arr_point[i - 1], arr_point[i], arr_point[i + 1]);
        let temp_v = new THREE.Vector3();
        temp_v.set(
            arr_point[0].x + direction_width * first_miter.x,
            arr_point[0].y + direction_width * first_miter.y,
            arr_point[0].z + direction_width * first_miter.z
        )
        res.push(temp_v);
    }

    let end_index = arr_point.length - 1;
    let end_miter = new THREE.Vector3();
    end_miter.crossVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(
            arr_point[end_index - 1].x - arr_point[end_index].x,
            arr_point[end_index - 1].y - arr_point[end_index].y,
            arr_point[end_index - 1].z - arr_point[end_index].z));

    end_miter.normalize();
    end_miter.multiplyScalar(direction_width);
    end_miter.addVectors(end_miter, arr_point[end_index]);
    res.push(end_miter);
    return res;
}


function semiAngleVector(pre, current, next) {
   let pre_vec = new THREE.Vector3();
   let next_vec = new THREE.Vector3();
   pre_vec.subVectors(pre, current);
   next_vec.subVectors(next, current);
   pre_vec.normalize();
   next_vec.normalize();
   let res = new THREE.Vector3(
       (pre_vec.x + next_vec.x) / 2.0,
        (pre_vec.y + next_vec.y) / 2.0,
        (pre_vec.z + next_vec.z) / 2.0
   );
   res.normalize();
   return res;
}
function LinePointTranslate(arr_point, direct_vec, direct_distance) {
    let res = [];

    arr_point.forEach((item) => {

        res.push(new THREE.Vector3(item.x + direct_vec.x * direct_distance,
            item.y + direct_distance * direct_vec.y,
            item.z + direct_distance * direct_vec.z))
    });
    return res;
}


/*
//把一条线段拆分成两个三角形
function spliteALine(segment, lineWidth) {
    // a array of THREE.Vector2

    let line = pointToVec(segment);

    let v1 = new THREE.Vector2();

    v1.subVectors(line[1], line[0]);

    v1.normalize();

    let miter = new THREE.Vector2(-v1.y, v1.x);


    let pt1, pt2, pt3, pt4;

    pt1 = getXY(miter, line[0], lineWidth);
    pt2 = getXY(miter.negate(), line[0], lineWidth);

    pt3 = getXY(miter, line[1], lineWidth);
    pt4 = getXY(miter.negate(), line[1], lineWidth);

    let triStrip = {};
    triStrip.left = [pt1, pt3];
    triStrip.right = [pt2, pt4];
    // triStrip = toXYArray(triStrip);

    return triStrip;
}

function changeToStrip(left, right) {
    return toXYArray([right[0], left[0], left[1], right[1]]);
} 


*/